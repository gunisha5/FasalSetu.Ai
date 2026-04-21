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
ICRISAT_CSV: Path       = DATA_DIR / "ICRISAT-District Level Data.csv"
FLOOD_CSV: Path         = DATA_DIR / "India_Flood_Inventory_v3.csv"
MODEL_PATH: Path        = BASE_DIR / "models" / "random_forest.pkl"
TRAINING_CSV: Path      = BASE_DIR / "data" / "training_features.csv"

# ── Google Earth Engine ───────────────────────────────────────────────────────
GEE_SERVICE_ACCOUNT: str    = os.getenv("GEE_SERVICE_ACCOUNT", "")
GEE_KEY_FILE: str           = os.getenv("GEE_KEY_FILE", "")      # Path to SA JSON key

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
