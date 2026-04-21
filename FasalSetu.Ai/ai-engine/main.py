"""
FasalSetu.Ai — AI Engine
========================
Standalone Python microservice exposing intelligent crop-damage analysis
via a FastAPI REST interface.

Entry Point: analyze_damage(latitude, longitude, claim_date, district)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn
import logging
from datetime import date
from historical_validator import validator_instance

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("fasalsetu.ai-engine")

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FasalSetu AI Engine",
    description=(
        "Satellite-driven crop damage assessment microservice. "
        "Combines Google Earth Engine geospatial data with historical "
        "CSV ground-truth to validate agricultural insurance claims."
    ),
    version="1.0.0",
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


# ── Schemas ──────────────────────────────────────────────────────────────────
class DamageRequest(BaseModel):
    """
    Payload for a single crop-damage analysis request.
    All fields are required unless marked Optional.
    """
    latitude: float = Field(..., ge=-90, le=90,
                            description="Farm latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180,
                             description="Farm longitude in decimal degrees")
    claim_date: date = Field(...,
                             description="ISO-8601 date the damage event occurred (YYYY-MM-DD)")
    district: str = Field(..., min_length=2,
                          description="Revenue district name matching ICRISAT records")
    crop: Optional[str] = Field(None,
                                description="Primary crop grown (e.g. 'Rice', 'Wheat')")
    farmer_id: Optional[str] = Field(None,
                                     description="Farmer reference ID for audit traceability")


class DamageResponse(BaseModel):
    """Structured response returned for every analysis request."""
    status: str              # "APPROVED_FLOOD" | "APPROVED_DROUGHT" | "INCONCLUSIVE" | "NOT_DAMAGED"
    confidence: float        # 0.0 – 1.0
    delta_ndvi: Optional[float]
    delta_ndwi: Optional[float]
    historical_match: Optional[bool]
    reasoning: str
    farmer_id: Optional[str]


# ── Core Function ─────────────────────────────────────────────────────────────
def analyze_damage(
    latitude: float,
    longitude: float,
    claim_date: date,
    district: str,
    crop: Optional[str] = None,
    farmer_id: Optional[str] = None,
) -> DamageResponse:
    """
    Primary AI entry-point for crop damage analysis.

    Orchestration pipeline (to be wired up phase-by-phase):
      1. [Phase 2] HistoricalValidator  — CSV ground-truth lookup
      2. [Phase 3] GEE Satellite Core   — NDVI / NDWI / SAR extraction
      3. [Phase 4] Rule-Based Engine    — Combine signals → decision
      4. [Phase 5] ML Classifier        — Replace rules with Random Forest

    Parameters
    ----------
    latitude    : float  — Farm latitude
    longitude   : float  — Farm longitude
    claim_date  : date   — Date of alleged damage event
    district    : str    — District name (must match ICRISAT records)
    crop        : str    — Optional crop type
    farmer_id   : str    — Optional audit reference

    Returns
    -------
    DamageResponse with status, confidence, satellite deltas, and reasoning.
    """
    logger.info(
        "analyze_damage called | district=%s lat=%.4f lon=%.4f date=%s crop=%s",
        district, latitude, longitude, claim_date, crop or "N/A",
    )

    # ── Phase 2: Historical Validator ─────────────────────────────────────────
    # We perform an initial check on both FLOOD and DROUGHT so we know the historical context.
    # Currently just logging the output or placing it in response but not fully replacing the
    # entire ML decision tree until Phase 4. We will run both checks.
    is_historical_flood = validator_instance.get_historical_match(district, claim_date, crop, "FLOOD")
    is_historical_drought = validator_instance.get_historical_match(district, claim_date, crop, "DROUGHT")
    
    historical_summary = f"Flood Risk: {is_historical_flood} | Drought Risk: {is_historical_drought}"
    logger.info(f"Historical check complete: {historical_summary}")

    # ── STUB: Phases 3-5 will replace this block ──────────────────────────
    # Phase 3 → delta_ndvi, delta_ndwi = GEESatelliteCore(lat, lon, claim_date)
    # Phase 4 → status, confidence = RuleEngine(delta_ndvi, delta_ndwi, historical_match)
    # Phase 5 → status, confidence = ml_model.predict([delta_ndvi, delta_ndwi])

    response = DamageResponse(
        status="INCONCLUSIVE",
        confidence=0.0,
        delta_ndvi=None,
        delta_ndwi=None,
        historical_match=(is_historical_flood or is_historical_drought),
        reasoning=(
            f"[Phase 2 Complete] {historical_summary}. "
            "Satellite extraction (Phase 3) is pending."
        ),
        farmer_id=farmer_id,
    )

    logger.info("analyze_damage result | status=%s confidence=%.2f", response.status, response.confidence)
    return response


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    """Health-check endpoint for the AI engine."""
    return {
        "service": "FasalSetu AI Engine",
        "version": "1.0.0",
        "status": "operational",
        "phase": "Phase 1 — Environment Bootstrap",
    }


@app.get("/health", tags=["Health"])
def health():
    """Lightweight liveness probe (can be polled by the Spring Boot backend)."""
    return {"status": "ok"}


@app.post("/analyze", response_model=DamageResponse, tags=["Analysis"])
def analyze(request: DamageRequest):
    """
    Analyze crop damage for a given farm location and claim date.

    This endpoint orchestrates the full AI pipeline and returns a structured
    damage assessment payload suitable for consumption by the Spring Boot
    insurance decision engine.
    """
    try:
        result = analyze_damage(
            latitude=request.latitude,
            longitude=request.longitude,
            claim_date=request.claim_date,
            district=request.district,
            crop=request.crop,
            farmer_id=request.farmer_id,
        )
        return result
    except Exception as exc:
        logger.error("analyze_damage failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Engine error: {str(exc)}")


# ── Dev Server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
