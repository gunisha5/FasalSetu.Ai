"""
config.py — Centralised configuration for the FasalSetu AI Engine.

All tuneable parameters and secrets are sourced from environment variables
(or the .env file in development).  Import this module everywhere instead
of calling os.getenv() directly.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if it exists (development convenience)
_ENV_FILE = Path(__file__).parent / ".env"
if _ENV_FILE.exists():
    load_dotenv(_ENV_FILE)

# ── Server ────────────────────────────────────────────────────────────────────
HOST: str       = os.getenv("AI_ENGINE_HOST", "0.0.0.0")
PORT: int       = int(os.getenv("AI_ENGINE_PORT", "8001"))
RELOAD: bool    = os.getenv("AI_ENGINE_RELOAD", "true").lower() == "true"

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR: Path          = Path(__file__).parent.resolve()
DATA_DIR: Path          = BASE_DIR.parent          # Project root holds the CSVs
ICRISAT_CSV: Path       = Path(r"C:\Users\manya\Downloads\FasalSetu.Ai\FasalSetu.Ai\ICRISAT-District Level Data.csv")
FLOOD_CSV: Path         = DATA_DIR / "India_Flood_Inventory_v3.csv"
MODEL_PATH: Path        = BASE_DIR / "models" / "random_forest.pkl"
TRAINING_CSV: Path      = BASE_DIR / "data" / "training_features.csv"

# ── Google Earth Engine ───────────────────────────────────────────────────────
GEE_SERVICE_ACCOUNT: str    = os.getenv("GEE_SERVICE_ACCOUNT", "")
_GEE_KEY: str               = os.getenv("GEE_KEY_FILE", "gee-key.json")
# Resolve relative path to absolute relative to this config file
if _GEE_KEY and not os.path.isabs(_GEE_KEY):
    GEE_KEY_FILE: str = str((BASE_DIR / _GEE_KEY).resolve())
else:
    GEE_KEY_FILE: str = _GEE_KEY

GEE_PROJECT_ID: str         = os.getenv("GEE_PROJECT_ID", "fasalsetu-ai")
GEE_MAX_CLOUD_COVER: int    = int(os.getenv("GEE_MAX_CLOUD_COVER", "80"))

# ── GEE Query Windows (days) ──────────────────────────────────────────────────
PRE_EVENT_DAYS: int     = int(os.getenv("PRE_EVENT_DAYS", "30"))   # Before claim_date
POST_EVENT_DAYS: int    = int(os.getenv("POST_EVENT_DAYS", "15"))  # After  claim_date

# ── Thresholds (Phase 4 Rule Engine) ─────────────────────────────────────────
FLOOD_NDWI_THRESHOLD: float     = float(os.getenv("FLOOD_NDWI_THRESHOLD", "0.3"))
DROUGHT_NDVI_THRESHOLD: float   = float(os.getenv("DROUGHT_NDVI_THRESHOLD", "-0.2"))

# ── ML Model (Phase 5) ────────────────────────────────────────────────────────
N_ESTIMATORS: int   = int(os.getenv("RF_N_ESTIMATORS", "100"))
TEST_SIZE: float    = float(os.getenv("RF_TEST_SIZE", "0.2"))
RANDOM_STATE: int   = int(os.getenv("RF_RANDOM_STATE", "42"))

# ── OpenWeatherMap — Weather Monitor ─────────────────────────────────────────
# Get a free API key from https://openweathermap.org/api
OPENWEATHER_API_KEY: str            = os.getenv("OPENWEATHER_API_KEY", "")
WEATHER_API_TIMEOUT_SECS: int       = int(os.getenv("WEATHER_API_TIMEOUT_SECS", "8"))

# Flood risk: rainfall in last 1 hour >= this value (mm) triggers flood signal
WEATHER_FLOOD_RAIN_THRESHOLD_MM: float  = float(os.getenv("WEATHER_FLOOD_RAIN_THRESHOLD_MM", "4.0"))
# Drought risk proxy: humidity <= this value AND rainfall ~0 triggers drought signal
WEATHER_DROUGHT_HUMIDITY_MAX: int       = int(os.getenv("WEATHER_DROUGHT_HUMIDITY_MAX", "25"))
# Drought: rainfall must be at or below this (mm/h) to be considered "dry"
WEATHER_DROUGHT_RAIN_MAX_MM: float      = float(os.getenv("WEATHER_DROUGHT_RAIN_MAX_MM", "0.1"))

# ── Weighted Scoring (Combined Confidence Engine) ─────────────────────────────
# Weights MUST sum to 1.0. Tune via environment variables.
WEIGHT_HISTORICAL: float    = float(os.getenv("WEIGHT_HISTORICAL", "0.15"))
WEIGHT_WEATHER: float       = float(os.getenv("WEIGHT_WEATHER",    "0.20"))
WEIGHT_SATELLITE: float     = float(os.getenv("WEIGHT_SATELLITE",  "0.30"))
WEIGHT_ML: float            = float(os.getenv("WEIGHT_ML",         "0.15"))
WEIGHT_VISUAL: float        = float(os.getenv("WEIGHT_VISUAL",     "0.20"))
