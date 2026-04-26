# FasalSetu.Ai: AI & Geospatial Engine Implementation Plan

This plan outlines the roadmap exclusively for the **AI and Satellite Data Processing** portion of FasalSetu.Ai. This component acts as a standalone intelligent service that parses CSVs, queries satellites, and trains machine learning models.

---

## Phase 1: AI Data Environment Setup
Set up the Python data science and API environment where the AI logic will execute.

1.  **Python Workspace Configuration:** Initialize a dedicated Python environment (`/ai-engine`) decoupled from any existing project stacks.
2.  **Core Dependencies:** Install required libraries:
    *   `fastapi` & `uvicorn` (to expose the AI logic as a usable API)
    *   `earthengine-api` (for satellite communication)
    *   `pandas` (for CSV data manipulation)
    *   `scikit-learn` (for the machine learning model)
3.  **Engine API Root:** Create `main.py` with the core function `analyze_damage(latitude, longitude, claim_date, district)` that serves as the entry point for AI processing.

---

## Phase 2: Historical Ground-Truth Parser (CSV Ingestion)
Process the existing datasets to provide historical context and rule-based validation for claims.

1.  **Ingest ICRISAT Data:** Write a `pandas` script to parse `C:\Users\manya\Downloads\FasalSetu.Ai\FasalSetu.Ai\ICRISAT-District Level Data.csv` to calculate year-over-year yield drops (Drought Indicators) for a given district.
2.  **Ingest Flood Inventory:** Write a `pandas` script to query `India_Flood_Inventory_v3.csv` to verify if a catastrophic flood occurred in the provided district on the given date.
3.  **Historical Baseline Service:** Create a Python class `HistoricalValidator` that returns a simple boolean or probability score based strictly on these CSV lookups. It must also:
    *   Compute the **"Average" greenness of the whole district** to account for Small Land Holdings (ensuring a crop drop is a regional disaster, not just an isolated pixel mismatch covering multiple farms).
    *   Check the **"Harvesting Window"** for the specific crop (e.g., Rice/Wheat) in that district using ICRISAT data to avoid confusing a regular scheduled harvest with a drought event.

---

## Phase 3: Satellite Geospatial Core (Google Earth Engine)
Use GEE to extract specific micro-level features (NDVI/NDWI) for the exact farm coordinates.

1.  **Authentication Engine:** Configure `ee.Authenticate()` and `ee.Initialize()` using service accounts or local tokens safely.
2.  **NDVI calculation (Vegetation Health):** query `COPERNICUS/S2_SR` (Sentinel-2) for imagery 30 days before and 15 days after the claim. Use the formula: `(NIR - Red) / (NIR + Red)` to return `Delta-NDVI`.
3.  **NDWI calculation (Moisture/Flood):** Perform the same query using the formula: `(Green - NIR) / (Green + NIR)` to return `Delta-NDWI`.
4.  **Weather Resilience (SAR):** Integrate Sentinel-1 (SAR) radar-based imagery to fix the "Cloud Problem" during Monsoon Floods. Since optical data is blinded by thick clouds, Sentinel-1 can "see through clouds" to detect water on the ground.

---

## Phase 4: Rule-Based Evaluation Engine (MVP Logic)
Combine historical context (Phase 2) with satellite features (Phase 3) into an algorithmic decision tree.

1.  **Flood Assessment Rule:** If `Delta-NDWI > 0.3` (Satellite spike) **AND** `HistoricalValidator == True` for Flood -> Generate an "Approved (Flood)" payload with high confidence.
2.  **Drought Assessment Rule:** If `Delta-NDVI < -0.2` (Vegetation death) **AND** `HistoricalValidator == True` for Drought -> Generate an "Approved (Drought)" payload with high confidence.
3.  **Discrepancy Rule:** If the satellite shows damage but the CSV shows no historical record (or vice versa), output an "Inconclusive / Manual Review Required" status.

---

## Phase 5: Machine Learning Classifier (The Final Model)
Upgrade the static "Rule-Based Engine" to a formally trained Machine Learning Model to finalize the AI project requirement.

1.  **Generate Synthetic Training Data:** Write a small Python script to loop over 100 known "flooded coordinates" and 100 known "healthy coordinates". Use Phase 3's GEE code to extract and save their exact NDVI/NDWI values into a new CSV (`training_features.csv`).
    *   *Pro-Tip:* Include data for "Normal" years for the same coordinates. The hardest thing for an AI is detecting the difference between a poor harvest and an actual disaster.
2.  **Train the Random Forest:** Use `scikit-learn` to load `training_features.csv`. Split into training/testing sets, and fit a `RandomForestClassifier(n_estimators=100)`.
3.  **Deploy the ML Model:** Save the model using `pickle`. Replace the hardcoded If/Then rules in Phase 4 with actual ML inference: `model.predict([[Delta-NDVI, Delta-NDWI]])`. The API will now return the Random Forest's probability score.
