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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uvicorn
import logging
from datetime import date
from historical_validator import validator_instance
from weather_monitor import weather_monitor_instance
from gee_satellite import gee_instance
from rule_engine import evaluate_damage
from visual_assessment import visual_processor
import config
import os
import pickle

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


class DamageResponse(BaseModel):
    """
    Fully enriched response returned for every analysis request.
    """
    # ── Decision ──────────────────────────────────────────────────────────────
    status:              str            # APPROVED_FLOOD | APPROVED_DROUGHT | NOT_DAMAGED | INCONCLUSIVE
    confidence:          float          # Final weighted confidence score 0.0–1.0
    flood_probability:   float          # Combined flood probability 0.0–1.0
    drought_probability: float          # Combined drought probability 0.0–1.0
    reasoning:           str            # Human-readable reasoning string

    # ── Satellite Signals ─────────────────────────────────────────────────────
    delta_ndvi:  Optional[float]
    delta_ndwi:  Optional[float]
    delta_sar:   Optional[float]

    # ── Weather Signals ───────────────────────────────────────────────────────
    weather_available:    bool
    rainfall_mm:          Optional[float]
    temperature:          Optional[float]
    humidity:             Optional[int]
    weather_flood_risk:   Optional[bool]
    weather_drought_risk: Optional[bool]

    # ── Ground-Truth ──────────────────────────────────────────────────────────
    historical_match: Optional[bool]

    # ── Audit ─────────────────────────────────────────────────────────────────
    contributing_factors: Optional[Dict[str, Any]]
    farmer_id:            Optional[str]


# ── Core Function ─────────────────────────────────────────────────────────────
def analyze_damage(
    latitude:   float,
    longitude:  float,
    claim_date: date,
    district:   str,
    crop:       Optional[str] = None,
    farmer_id:  Optional[str] = None,
    image_b64:  Optional[str] = None,
) -> DamageResponse:
    """
    Full AI pipeline orchestrator.

    Execution Order
    ---------------
    1. Phase 2  — HistoricalValidator (CSV lookup)
    2. Weather  — WeatherMonitor      (OpenWeatherMap real-time)
    3. Phase 3  — GEESatelliteCore    (Sentinel-1 SAR + Sentinel-2 NDVI/NDWI)
    4. Phase 5  — Random Forest       (predict_proba if model loaded)
    5. Phase 4  — WeightedEngine      (combine all → final decision)
    """
    logger.info(
        "analyze_damage called | district=%s lat=%.4f lon=%.4f date=%s crop=%s",
        district, latitude, longitude, claim_date, crop or "N/A",
    )

    # ── Step 1: Historical Validator ──────────────────────────────────────────
    logger.info("Step 1/5 — Historical CSV validation...")
    is_historical_flood   = validator_instance.get_historical_match(district, claim_date, crop, "FLOOD")
    is_historical_drought = validator_instance.get_historical_match(district, claim_date, crop, "DROUGHT")
    logger.info(
        "Historical result: flood=%s drought=%s",
        is_historical_flood, is_historical_drought,
    )

    # ── Step 2: Weather Monitor ───────────────────────────────────────────────
    logger.info("Step 2/5 — Real-time weather fetch...")
    wx = weather_monitor_instance.fetch(latitude, longitude)
    if wx.weather_available:
        logger.info(
            "Weather: rain=%.2fmm temp=%.1f°C humidity=%d%% "
            "flood_risk=%s drought_risk=%s",
            wx.rainfall_mm or 0,
            wx.temperature or 0,
            wx.humidity or 0,
            wx.weather_flood_risk,
            wx.weather_drought_risk,
        )
    else:
        logger.warning("Weather data unavailable — pipeline continues without it.")

    # ── Step 3: GEE Satellite Core ────────────────────────────────────────────
    logger.info("Step 3/5 — GEE satellite extraction...")
    delta_ndvi, delta_ndwi, delta_sar = gee_instance.get_satellite_deltas(
        latitude, longitude, claim_date
    )
    logger.info(
        "Satellite result: delta_ndvi=%s delta_ndwi=%s delta_sar=%s",
        delta_ndvi, delta_ndwi, delta_sar,
    )

    # ── Step 4: ML Random Forest ──────────────────────────────────────────────
    logger.info("Step 4/5 — ML model inference...")
    ml_probabilities = None
    has_satellite = delta_ndvi is not None and delta_ndwi is not None and delta_sar is not None

    if ml_model is not None and has_satellite:
        features = [[
            delta_ndvi, delta_ndwi, delta_sar,
            int(is_historical_flood), int(is_historical_drought),
            wx.rainfall_mm or 0.0,
            int(wx.weather_flood_risk or 0),
            int(wx.weather_drought_risk or 0)
        ]]
        raw_probs = ml_model.predict_proba(features)[0]
        classes   = ml_model.classes_
        ml_probabilities = {cls: float(prob) for cls, prob in zip(classes, raw_probs)}
        logger.info("ML probabilities: %s", ml_probabilities)
    else:
        logger.info("ML model skipped (no model or missing satellite data).")

    logger.info("Step 4.5 — Visual evidence analysis...")
    vis_flood, vis_drought = None, None
    if image_b64:
        vis_flood, vis_drought = visual_processor.analyze_from_base64(image_b64)
    else:
        logger.info("No visual evidence provided — skipping visual layer.")

    # ── Step 5: Weighted Confidence Engine ────────────────────────────────────
    logger.info("Step 5/5 — Weighted confidence evaluation...")
    result = evaluate_damage(
        delta_ndvi=delta_ndvi,
        delta_ndwi=delta_ndwi,
        delta_sar=delta_sar,
        is_historical_flood=is_historical_flood,
        is_historical_drought=is_historical_drought,
        weather_flood_risk=wx.weather_flood_risk,
        weather_drought_risk=wx.weather_drought_risk,
        rainfall_mm=wx.rainfall_mm,
        ml_probabilities=ml_probabilities,
        visual_flood_score=vis_flood,
        visual_drought_score=vis_drought,
    )

    logger.info(
        "Final result | status=%s confidence=%.3f flood=%.3f drought=%.3f",
        result.status, result.confidence,
        result.flood_probability, result.drought_probability,
    )

    return DamageResponse(
        # Decision
        status=result.status,
        confidence=result.confidence,
        flood_probability=result.flood_probability,
        drought_probability=result.drought_probability,
        reasoning=result.reasoning,
        # Satellite
        delta_ndvi=delta_ndvi,
        delta_ndwi=delta_ndwi,
        delta_sar=delta_sar,
        # Weather
        weather_available=wx.weather_available,
        rainfall_mm=wx.rainfall_mm,
        temperature=wx.temperature,
        humidity=wx.humidity,
        weather_flood_risk=wx.weather_flood_risk,
        weather_drought_risk=wx.weather_drought_risk,
        # Ground-Truth
        historical_match=(is_historical_flood or is_historical_drought),
        # Audit
        contributing_factors=result.contributing_factors,
        farmer_id=farmer_id,
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


@app.post("/analyze", response_model=DamageResponse, tags=["Analysis"])
def analyze(request: DamageRequest):
    """
    Analyze crop damage for a given farm location and claim date.

    Runs the full 5-layer AI pipeline:
      Historical → Weather → Satellite → ML → Weighted Engine

    Returns a fully enriched DamageResponse including probabilities,
    contributing factors, and raw satellite/weather signals for audit.
    """
    try:
        result = analyze_damage(
            latitude=request.latitude,
            longitude=request.longitude,
            claim_date=request.claim_date,
            district=request.district,
            crop=request.crop,
            farmer_id=request.farmer_id,
            image_b64=request.image_b64,
        )
        return result
    except Exception as exc:
        logger.error("analyze_damage failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Engine error: {str(exc)}")


# ── Dev Server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=config.RELOAD)
