"""
rule_engine.py — Phase 4: Weighted Confidence Evaluation Engine

Combines four independent signals into a single probabilistic assessment:
  - Historical CSV ground-truth  (20%)
  - Real-time weather indicators (25%)
  - Satellite deltas NDVI/NDWI/SAR (35%)
  - ML Random Forest score        (20%)

Falls back gracefully when any signal is unavailable.
"""

import config
import logging
from dataclasses import dataclass, field
from typing import Optional, Dict, Any

logger = logging.getLogger("fasalsetu.rule_engine")


# ── Output Schema ─────────────────────────────────────────────────────────────

@dataclass
class EvaluationResult:
    """
    Full structured output of the combined confidence engine.
    Replaces the old simple (status, confidence, reasoning) tuple.
    """
    status: str                         # APPROVED_FLOOD | APPROVED_DROUGHT | NOT_DAMAGED | INCONCLUSIVE
    confidence: float                   # Final weighted confidence 0.0–1.0
    flood_probability: float            # Combined flood probability 0.0–1.0
    drought_probability: float          # Combined drought probability 0.0–1.0
    reasoning: str                      # Human-readable decision explanation
    contributing_factors: Dict[str, Any] = field(default_factory=dict)


# ── Internal Scorers ──────────────────────────────────────────────────────────

def _score_historical(is_flood: bool, is_drought: bool):
    """Returns (flood_score, drought_score) from CSV validation. Scale: 0.0–1.0."""
    return (1.0 if is_flood else 0.0), (1.0 if is_drought else 0.0)


def _score_weather(weather_flood_risk: Optional[bool], weather_drought_risk: Optional[bool],
                   rainfall_mm: Optional[float]):
    """
    Returns (flood_score, drought_score) from weather indicators. Scale: 0.0–1.0.
    Returns (None, None) if weather data is unavailable so the weight is redistributed.
    """
    if weather_flood_risk is None:
        return None, None

    flood_score = 0.0
    drought_score = 0.0

    if weather_flood_risk:
        # Scale by rainfall intensity: 4 mm/h baseline → 1.0 at ≥20 mm/h
        flood_score = min(1.0, (rainfall_mm or 0.0) / 20.0)

    if weather_drought_risk:
        drought_score = 1.0

    return flood_score, drought_score


def _score_satellite(delta_ndvi: Optional[float], delta_ndwi: Optional[float],
                     delta_sar: Optional[float]):
    """
    Returns (flood_score, drought_score) from satellite signals. Scale: 0.0–1.0.
    Returns (None, None) if no satellite data available.
    """
    if delta_ndvi is None and delta_ndwi is None and delta_sar is None:
        return None, None

    flood_score = 0.0
    drought_score = 0.0

    # NDWI: values from 0.0 → 0.6+ → map to 0.0 → 1.0
    if delta_ndwi is not None and delta_ndwi > 0:
        flood_score = max(flood_score, min(1.0, delta_ndwi / config.FLOOD_NDWI_THRESHOLD))

    # SAR: a drop of -2 dB → flood signal; -6+ dB → near-certain flooding
    if delta_sar is not None and delta_sar < 0:
        flood_score = max(flood_score, min(1.0, abs(delta_sar) / 6.0))

    # NDVI: values from 0 → -0.5+ → map to 0.0 → 1.0
    if delta_ndvi is not None and delta_ndvi < 0:
        drought_score = max(drought_score, min(1.0, abs(delta_ndvi) / abs(config.DROUGHT_NDVI_THRESHOLD)))

    return flood_score, drought_score


def _score_ml(ml_probabilities: Optional[Dict[str, float]]):
    """
    Returns (flood_score, drought_score) from the Random Forest predict_proba output.
    ml_probabilities: dict like {"FLOOD": 0.72, "DROUGHT": 0.18, "NORMAL": 0.10}
    Returns (None, None) if model was not available.
    """
    if ml_probabilities is None:
        return None, None
    return ml_probabilities.get("FLOOD", 0.0), ml_probabilities.get("DROUGHT", 0.0)


# ── Main Engine ───────────────────────────────────────────────────────────────

# Localized reasoning templates
REASONING_TEMPLATES = {
    "en": {
        "hist_flood": "Historical CSV flood record matched.",
        "hist_drought": "Historical CSV drought record matched.",
        "weather": "Weather signals: {label} conditions (rain={rain:.1f}mm/h).",
        "satellite": "Satellite signals: Water levels (NDWI)={ndwi}, Vegetation (NDVI)={ndvi}.",
        "ml": "AI Model: flood={flood:.0%}, drought={drought:.0%}.",
        "visual": "Ground Evidence: flood={flood:.1%}, drought={drought:.1%}.",
        "no_sat": " (Note: Satellite imagery was unavailable; estimates based on weather/history.)",
        "weighted": "[AI Report] flood={f_prob:.1%}, drought={d_prob:.1%}."
    },
    "hi": {
        "hist_flood": "पुराने बाढ़ के रिकॉर्ड से मिलान हुआ।",
        "hist_drought": "पुराने सूखे के रिकॉर्ड से मिलान हुआ।",
        "weather": "मौसम संकेत: {label} की स्थिति (बारिश={rain:.1f}mm/h)।",
        "satellite": "सैटेलाइट संकेत: जल स्तर (NDWI)={ndwi}, हरियाली (NDVI)={ndvi}।",
        "ml": "AI मॉडल: बाढ़={flood:.0%}, सूखा={drought:.0%}.",
        "visual": "खेत के सबूत: बाढ़={flood:.1%}, सूखा={drought:.1%}.",
        "no_sat": " (नोट: सैटेलाइट चित्र उपलब्ध नहीं थे; केवल मौसम/इतिहास पर आधारित।)",
        "weighted": "[AI रिपोर्ट] बाढ़={f_prob:.1%}, सूखा={d_prob:.1%}."
    },
    "pa": {
        "hist_flood": "ਪੁਰਾਣੇ ਹੜ੍ਹ ਦੇ ਰਿਕਾਰਡ ਨਾਲ ਮੇਲ ਖਾਂਦਾ ਹੈ।",
        "hist_drought": "ਪੁਰਾਣੇ ਸੋਕੇ ਦੇ ਰਿਕਾਰਡ ਨਾਲ ਮੇਲ ਖਾਂਦਾ ਹੈ।",
        "weather": "ਮੌਸਮ ਦੇ ਸੰਕੇਤ: {label} ਦੀ ਸਥਿਤੀ (ਮੀਂਹ={rain:.1f}mm/h)।",
        "satellite": "ਸੈਟੇਲਾਈਟ ਸੰਕੇਤ: ਪਾਣੀ ਦਾ ਪੱਧਰ (NDWI)={ndwi}, ਹਰਿਆਲੀ (NDVI)={ndvi}।",
        "ml": "AI ਮਾਡਲ: ਹੜ੍ਹ={flood:.0%}, ਸੋਕਾ={drought:.0%}.",
        "visual": "ਖੇਤ ਦੇ ਸਬੂਤ: ਹੜ੍ਹ={flood:.1%}, ਸੋਕਾ={drought:.1%}.",
        "no_sat": " (ਨੋਟ: ਸੈਟੇਲਾਈਟ ਤਸਵੀਰਾਂ ਉਪਲਬਧ ਨਹੀਂ ਸਨ; ਸਿਰਫ ਮੌਸਮ/ਇਤਿਹਾਸ 'ਤੇ ਅਧਾਰਤ।)",
        "weighted": "[AI ਰਿਪੋਰਟ] ਹੜ੍ਹ={f_prob:.1%}, ਸੋਕਾ={d_prob:.1%}."
    }
}

def evaluate_damage(
    delta_ndvi: Optional[float],
    delta_ndwi: Optional[float],
    delta_sar: Optional[float],
    is_historical_flood: bool,
    is_historical_drought: bool,
    weather_flood_risk: Optional[bool] = None,
    weather_drought_risk: Optional[bool] = None,
    rainfall_mm: Optional[float] = None,
    ml_probabilities: Optional[Dict[str, float]] = None,
    visual_flood_score: Optional[float] = None,
    visual_drought_score: Optional[float] = None,
    lang: str = "en",
) -> EvaluationResult:
    """
    Weighted confidence engine combining all four signal layers.
    ...
    """

    # ── 1. Compute per-layer raw scores ──────────────────────────────────────
    hist_flood,  hist_drought   = _score_historical(is_historical_flood, is_historical_drought)
    wx_flood,    wx_drought     = _score_weather(weather_flood_risk, weather_drought_risk, rainfall_mm)
    sat_flood,   sat_drought    = _score_satellite(delta_ndvi, delta_ndwi, delta_sar)
    ml_flood,    ml_drought     = _score_ml(ml_probabilities)

    # ── 2. Build available-layer weight map ───────────────────────────────────
    layers = {
        "historical": (config.WEIGHT_HISTORICAL, hist_flood,  hist_drought),
        "weather":    (config.WEIGHT_WEATHER,    wx_flood,    wx_drought),
        "satellite":  (config.WEIGHT_SATELLITE,  sat_flood,   sat_drought),
        "ml":         (config.WEIGHT_ML,         ml_flood,    ml_drought),
        "visual":     (config.WEIGHT_VISUAL,     visual_flood_score, visual_drought_score),
    }

    available = {k: v for k, v in layers.items() if v[1] is not None}

    if not available:
        return EvaluationResult(
            status="INCONCLUSIVE",
            confidence=0.0,
            flood_probability=0.0,
            drought_probability=0.0,
            reasoning="No signal data available / डेटा उपलब्ध नहीं है।",
            contributing_factors={},
        )

    # Redistribute weights proportionally among available layers
    total_weight = sum(v[0] for v in available.values())
    normalised = {k: (v[0] / total_weight, v[1], v[2]) for k, v in available.items()}

    # ── 3. Compute weighted probabilities ────────────────────────────────────
    flood_prob   = sum(w * f for w, f, _ in normalised.values())
    drought_prob = sum(w * d for w, _, d in normalised.values())

    # ── 4. Determine final status ────────────────────────────────────────────
    if flood_prob >= drought_prob and flood_prob >= 0.5:
        status = "APPROVED_FLOOD"
        confidence = round(flood_prob, 3)
    elif drought_prob > flood_prob and drought_prob >= 0.5:
        status = "APPROVED_DROUGHT"
        confidence = round(drought_prob, 3)
    elif max(flood_prob, drought_prob) < 0.25:
        status = "NOT_DAMAGED"
        confidence = round(1.0 - max(flood_prob, drought_prob), 3)
    else:
        status = "INCONCLUSIVE"
        confidence = round(max(flood_prob, drought_prob), 3)

    # ── 5. Assemble contributing factors for audit trail ─────────────────────
    contributing_factors = {
        "historical": {
            "weight_applied": round(normalised["historical"][0], 3) if "historical" in normalised else 0,
            "flood_score": round(hist_flood, 3),
            "drought_score": round(hist_drought, 3),
        },
        "weather": {
            "weight_applied": round(normalised["weather"][0], 3) if "weather" in normalised else 0,
            "available": wx_flood is not None,
            "flood_score": round(wx_flood, 3) if wx_flood is not None else None,
            "drought_score": round(wx_drought, 3) if wx_drought is not None else None,
            "rainfall_mm": rainfall_mm,
        },
        "satellite": {
            "weight_applied": round(normalised["satellite"][0], 3) if "satellite" in normalised else 0,
            "available": sat_flood is not None,
            "flood_score": round(sat_flood, 3) if sat_flood is not None else None,
            "drought_score": round(sat_drought, 3) if sat_drought is not None else None,
            "delta_ndvi": delta_ndvi,
            "delta_ndwi": delta_ndwi,
            "delta_sar": delta_sar,
        },
        "ml": {
            "weight_applied": round(normalised["ml"][0], 3) if "ml" in normalised else 0,
            "available": ml_flood is not None,
            "flood_score": round(ml_flood, 3) if ml_flood is not None else None,
            "drought_score": round(ml_drought, 3) if ml_drought is not None else None,
        },
        "visual": {
            "weight_applied": round(normalised["visual"][0], 3) if "visual" in normalised else 0,
            "available": visual_flood_score is not None,
            "flood_score": round(visual_flood_score, 3) if visual_flood_score is not None else None,
            "drought_score": round(visual_drought_score, 3) if visual_drought_score is not None else None,
        },
    }

    # ── 6. Build localized reasoning string ──────────────────────────────────
    t = REASONING_TEMPLATES.get(lang, REASONING_TEMPLATES["en"])
    parts = []
    
    if is_historical_flood: parts.append(t["hist_flood"])
    elif is_historical_drought: parts.append(t["hist_drought"])

    if wx_flood is not None:
        label = "flood" if weather_flood_risk else ("drought" if weather_drought_risk else "normal")
        # Translation for nested labels if needed, but keeping it simple
        parts.append(t["weather"].format(label=label, rain=rainfall_mm or 0))

    if sat_flood is not None:
        parts.append(t["satellite"].format(ndwi=delta_ndwi or 0, ndvi=delta_ndvi or 0))

    if ml_probabilities:
        parts.append(t["ml"].format(flood=ml_probabilities.get("FLOOD", 0), drought=ml_probabilities.get("DROUGHT", 0)))

    if visual_flood_score is not None:
        parts.append(t["visual"].format(flood=visual_flood_score, drought=visual_drought_score or 0))

    reasoning = t["weighted"].format(f_prob=flood_prob, d_prob=drought_prob) + " " + " ".join(parts)
    
    if sat_flood is None:
        reasoning += t["no_sat"]

    # ── Dynamic Translation API Integration (Suggested) ──────────────────────
    # To fully support all 13+ languages without hardcoding templates, you can
    # integrate an external API like Google Translate or 'deep-translator'.
    # Example using deep-translator (pip install deep-translator):
    # 
    # from deep_translator import GoogleTranslator
    # if lang not in REASONING_TEMPLATES:
    #     try:
    #         reasoning = GoogleTranslator(source='en', target=lang).translate(reasoning)
    #     except Exception as e:
    #         logger.error(f"Translation API failed for {lang}: {e}")
    
    if lang not in REASONING_TEMPLATES and lang != "en":
        # Fallback for languages not yet in REASONING_TEMPLATES (returns English)
        logger.warning(f"Language '{lang}' requested but no template found. Falling back to English.")

    return EvaluationResult(
        status=status,
        confidence=confidence,
        flood_probability=round(flood_prob, 3),
        drought_probability=round(drought_prob, 3),
        reasoning=reasoning,
        contributing_factors=contributing_factors,
    )
