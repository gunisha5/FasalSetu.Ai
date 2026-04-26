"""
FasalSetu.Ai — AI Engine
========================
Standalone Python microservice exposing intelligent crop-damage analysis
via a FastAPI REST interface.

Pipeline (in order of execution):
  1. [Phase 2] HistoricalValidator  — CSV ground-truth (flood/drought)
  2. [Weather] WeatherMonitor       — Real-time OpenWeatherMap signals
  3. [Phase 3] GEE Satellite Core   — NDVI / NDWI / SAR extraction
  4. [Phase 5] ML Classifier        — Random Forest predict_proba
  5. [Phase 4] Rule/Weight Engine   — Combine all signals → final decision
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Union
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import shutil
from datetime import date
from historical_validator import validator_instance
from weather_monitor import weather_monitor_instance
from gee_satellite import gee_instance
from rule_engine import evaluate_damage
from visual_assessment import visual_processor
import config
import os
import pickle
from fastapi.responses import FileResponse
from report_generator import report_gen
from email_service import send_report_email
from nasa_weather import get_historical_weather
from district_risk import risk_manager
from policy_parser import extract_policy_text, parse_policy_json, validate_policy_data, calculate_damage, estimate_claim, generate_explanation

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("fasalsetu.ai-engine")

# ── ML Model (loaded once at boot) ────────────────────────────────────────────
ml_model = None
if os.path.exists(config.MODEL_PATH):
    with open(config.MODEL_PATH, "rb") as f:
        ml_model = pickle.load(f)
    logger.info("Loaded Random Forest model from %s", config.MODEL_PATH)
else:
    logger.warning(
        "No ML model found at %s. Pipeline will run without ML layer.",
        config.MODEL_PATH,
    )

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FasalSetu AI Engine",
    description=(
        "Multi-layer crop damage assessment microservice. "
        "Combines CSV historical data, real-time weather, Google Earth Engine "
        "satellite imagery, and a Random Forest classifier to validate "
        "agricultural insurance claims."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test")
def test():
    return {"status": "ok"}


# ── Schemas ───────────────────────────────────────────────────────────────────

class DamageRequest(BaseModel):
    """
    Payload for a single crop-damage analysis request.
    All fields are required unless marked Optional.
    """
    latitude:   float = Field(..., ge=-90,  le=90,   description="Farm latitude in decimal degrees")
    longitude:  float = Field(..., ge=-180, le=180,  description="Farm longitude in decimal degrees")
    claim_date: date  = Field(...,                   description="ISO-8601 date the damage event occurred (YYYY-MM-DD)")
    district:   str   = Field(..., min_length=2,     description="Revenue district name matching ICRISAT records")
    crop:       Optional[str] = Field(None,          description="Primary crop grown (e.g. 'Rice', 'Wheat')")
    farmer_id:  Optional[str] = Field(None,          description="Farmer reference ID for audit traceability")
    image_b64:  Optional[str] = Field(None,          description="Base64 encoded photo evidence for visual AI analysis")
    lang:       str           = Field("en",          description="Language for the reasoning report (en, hi, pa)")


class DamageResponse(BaseModel):
    status: str
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    damage_percent: Optional[float] = None
    estimated_claim: Optional[float] = None
    explanation: Optional[str] = None
    policy_summary: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


# ── Core Function ─────────────────────────────────────────────────────────────
def analyze_damage(
    latitude:   float,
    longitude:  float,
    claim_date: date,
    district:   str,
    crop:       Optional[str] = None,
    farmer_id:  Optional[str] = None,
    image_b64:  Optional[str] = None,
    lang:       str = "en",
) -> DamageResponse:
    # --- CROP HANDLING FIX ---
    if not crop or str(crop).lower() == "string":
        crop = "wheat"
    crop = str(crop).lower().strip()
    print("[DEBUG] Using crop:", crop)
    # -------------------------

    # 1. Core Data Retrieval (Satellite features removed)
    is_historical_flood   = validator_instance.get_historical_match(district, claim_date, crop, "FLOOD")
    is_historical_drought = validator_instance.get_historical_match(district, claim_date, crop, "DROUGHT")
    wx = weather_monitor_instance.fetch(latitude, longitude)
    
    # 2. Risk Indicators (Historical & Weather)
    f_rain   = float(wx.rainfall_mm or 0.0)
    f_wx_f   = int(getattr(wx, 'weather_flood_risk', 0) or 0)
    f_wx_d   = int(getattr(wx, 'weather_drought_risk', 0) or 0)

    # NASA Historical Weather
    nasa_wx = get_historical_weather(latitude, longitude, claim_date)
    f_rain_7d = float(nasa_wx["rainfall_7d"])
    f_temp_avg = float(nasa_wx["temp_avg"])

    # 3. District Risk Intelligence Integration
    def get_risk(dist_name: str) -> dict:
        """Helper to fetch normalized risk from the pre-computed dictionary."""
        d_key = str(dist_name).lower().strip() if dist_name else ""
        risk = risk_manager.get_district_risk(d_key)
        return {
            "flood_risk": risk.get("flood_risk", 0.5),
            "drought_risk": risk.get("drought_risk", 0.5)
        }

    # Fetch Risk
    risk = get_risk(district)
    f_hist_f = risk["flood_risk"]
    f_hist_d = risk["drought_risk"]
    
    # Baseline Risk scores for modifiers
    f_dist_f = f_hist_f
    f_dist_d = f_hist_d

    # 4. Build Feature Vector
    # Features: [NDVI, NDWI, SAR, Hist_Flood, Hist_Drought, Rain_Now, Wx_Flood, Wx_Drought]
    features = [[0.0, 0.0, 0.0, f_hist_f, f_hist_d, f_rain, f_wx_f, f_wx_d]]
    
    if ml_model is None:
        return DamageResponse(status="ERROR", message="Model not loaded")

    # 4. Hybrid Prediction Logic (ML + Rule Engine)
    # Default to model's statistical prediction
    probs = ml_model.predict_proba(features)[0]
    classes = ml_model.classes_

    max_index = probs.argmax()
    prediction = str(classes[max_index])
    base_confidence = float(probs[max_index])

    # Rule-Based Overrides (Domain Expertise)
    # If high cumulative rainfall matches high district vulnerability -> Overwrite to FLOOD
    if f_rain_7d > 100 and f_dist_f > 0.6:
        prediction = "FLOOD"
        logger.info("Rule-based override: FLOOD detected (High Rain + High Risk)")
    
    # If low rainfall matches high drought vulnerability -> Overwrite to DROUGHT
    elif f_rain < 5 and f_dist_d > 0.6:
        prediction = "DROUGHT"
        logger.info("Rule-based override: DROUGHT detected (Low Rain + High Risk)")

    # 5. Calibrated Confidence Logic (Fixing Overconfidence)
    # Formula: confidence = base_confidence * (0.6 + flood_risk * 0.4)
    confidence = base_confidence * (0.6 + f_dist_f * 0.4)

    # Apply environmental likelihood modifiers (Rainfall / History)
    likelihood_modifier = 1.0
    if f_dist_f > 0.6 and f_rain_7d > 100:
        likelihood_modifier += 0.1
    elif f_dist_d > 0.6 and f_rain < 5:
        likelihood_modifier += 0.1
    
    # Final combined confidence
    confidence = confidence * likelihood_modifier

    # 6. Strict Clamping [0.3, 0.9]
    if confidence > 0.9:
        confidence = 0.9
    elif confidence < 0.3:
        confidence = 0.3
    
    confidence = round(float(confidence), 2)

    # 7. Comprehensive Pipeline Logging
    logger.info(
        "PIPELINE COMPLETE | District: %s | Prediction: %s | Confidence: %.2f",
        district, prediction, confidence
    )
    logger.debug(
        "DETAILED FEATURES | Rain_Now: %.2fmm | Rain_7d: %.2fmm | Temp: %.1fC | Flood_Risk: %.2f | Drought_Risk: %.2f",
        f_rain, f_rain_7d, f_temp_avg, f_dist_f, f_dist_d
    )

    # Final confidence print for backend verification
    print("Final confidence:", confidence)

    return DamageResponse(
        status="SUCCESS",
        prediction=str(prediction),
        confidence=confidence,
        features={
            "historical_flood": f_hist_f,
            "historical_drought": f_hist_d,
            "rainfall_current": f_rain,
            "rainfall_7d": f_rain_7d,
            "flood_risk": f_dist_f,
            "drought_risk": f_dist_d
        }
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Health-check endpoint for the AI engine."""
    return {
        "service": "FasalSetu AI Engine",
        "version": "2.0.0",
        "status": "operational",
        "pipeline": [
            "1. Historical CSV Validator",
            "2. Weather Monitor (OpenWeatherMap)",
            "3. GEE Satellite Core (Sentinel-1 SAR + Sentinel-2 NDVI/NDWI)",
            "4. Random Forest ML Classifier",
            "5. Weighted Confidence Engine",
        ],
        "ml_model_loaded": ml_model is not None,
    }


@app.get("/health", tags=["Health"])
def health():
    """Lightweight liveness probe (can be polled by the Spring Boot backend)."""
    return {"status": "ok"}


@app.post("/predict", response_model=DamageResponse, tags=["Analysis"])
async def analyze(
    latitude: float = Form(...),
    longitude: float = Form(...),
    claim_date: date = Form(...),
    district: str = Form(...),
    crop: Optional[str] = Form(None),
    farmer_id: Optional[str] = Form(None),
    image_b64: Optional[str] = Form(None),
    lang: str = Form("en"),
    policy_pdf: Optional[UploadFile] = File(None)
):
    """
    Analyze crop damage and estimate insurance claims.
    Accepts farm data and an optional policy PDF.
    """
    try:
        # 1. Run Core AI Analysis
        result = analyze_damage(
            latitude=latitude,
            longitude=longitude,
            claim_date=claim_date,
            district=district,
            crop=crop,
            farmer_id=farmer_id,
            image_b64=image_b64,
            lang=lang
        )
        
        if result.status == "ERROR":
            return result

        prediction = result.prediction
        confidence = result.confidence
        features = result.features

        # 2. Handle Policy Parsing (if PDF provided)
        policy = None
        damage_percent = 0.0
        claim_amount = 0
        policy_summary = None
        explanation = None

        if policy_pdf:
            # Save temporary file
            temp_path = f"temp_{policy_pdf.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(policy_pdf.file, buffer)
            
            try:
                # Extraction
                policy_text = extract_policy_text(temp_path)
                
                # Parsing
                policy_raw = parse_policy_json(policy_text)
                
                # Validation
                policy = validate_policy_data(policy_raw)
                
                # Claim Estimation
                claim_amount = estimate_claim(damage_percent, prediction, policy)
                
                # Explanation
                explanation = generate_explanation(prediction, round(damage_percent, 2), policy, claim_amount)
                
                policy_summary = {
                    "sum_insured": policy["sum_insured"],
                    "coverage_used": policy["coverage"].get(prediction, 0.0)
                }
            finally:
                # Cleanup
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        print("[API RESPONSE CLAIM]", claim_amount)

        return DamageResponse(
            status="SUCCESS",
            prediction=prediction,
            confidence=confidence,
            damage_percent=round(damage_percent, 2),
            estimated_claim=claim_amount,
            explanation=explanation if policy_pdf else None,
            policy_summary=policy_summary,
            features=features
        )

    except Exception as exc:
        logger.error("analyze failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Engine error: {str(exc)}")


@app.get("/download-report/{claim_id}", tags=["Analysis"])
async def download_report(claim_id: int, farmer_email: Optional[str] = "farmer@example.com"):
    """
    Generates a visual PDF report with charts, triggers an email to the farmer,
    and returns the file for local download.
    """
    # 1. Mock/Fetch Data for the report
    report_data = {
        "farmer_name": "Rajesh Kumar",
        "date": date.today().isoformat(),
        "lat": 20.5937,
        "lon": 78.9629,
        "district": "Vidarbha",
        "prediction": "APPROVED_FLOOD",
        "confidence": 0.82,
        "features": {
            "delta_ndvi": -0.15,
            "delta_sar": -4.2,
            "rainfall": 120.5
        }
    }

    # 2. Generate PDF locally
    pdf_path = report_gen.create_pdf(claim_id, report_data)

    # 3. Email Integration
    if farmer_email:
        send_report_email(farmer_email, claim_id, pdf_path)

    # 4. Return for Download
    return FileResponse(
        path=pdf_path,
        filename=f"FasalSetu_Report_{claim_id}.pdf",
        media_type='application/pdf'
    )


# ── Dev Server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=config.RELOAD)
