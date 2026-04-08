# FasalSetu.Ai: Foolproof Implementation Strategy

This document outlines the master technical strategy and step-by-step roadmap for building the FasalSetu.Ai crop damage assessment system. 

## The Philosophy: "Risk-First" Development

> [!CAUTION]
> **Why AI First?**
> The sole value of FasalSetu relies on the accuracy of its Deep Learning model. If the AI cannot predict crop damage from satellites, the web app and database are useless. Therefore, we **start with Phase 1 (The ML Pipeline)**. We validate the hardest technical challenge before writing a single line of backend Java or frontend React code.

---

## Technical Stack & Tooling

| Component | Technology / Tool | Purpose |
| :--- | :--- | :--- |
| **Data Labeling** | `Pandas`, `Numpy` (Offline Local) | Formatting ground-truth crop yields into ML targets. |
| **Foreign Datasets** | `Kaggle`, `Zenodo` (Online) | Sourcing large labeled flood/healthy datasets for pre-training. |
| **Indian Datasets**| `earthengine-api` (Google Earth Engine) | Cloud-sourcing raw Sentinel-2 Indian satellite imagery. |
| **Deep Learning** | `PyTorch` (Offline Local) | Building the hybrid CNN + LSTM spatial-temporal model. |
| **ML Microservice** | `FastAPI`, `Uvicorn` (Offline Local) | Serving the trained PyTorch model as an internal API. |
| **Main Backend** | `Java Spring Boot` (Offline Local) | Handling business logic, authentication, and SQL interactions. |
| **Database** | `MySQL` (Offline Local) | Storing user identities, GeoJSON boundaries, and insurance claims. |
| **Frontend** | `React` + `Vite` + `TailwindCSS` | Building an interactive, premium user interface. |
| **Map Rendering** | `Mapbox GL JS` / `Leaflet` | Displaying damage heatmaps visually in the browser. |

---

## Phase 1: Deep Learning & Data Pipeline (Active)
*Goal: Prove the AI can ingest satellite data and accurately predict crop damage.*

### Phase 1.0: Indian Ground Truth Replacements (Status Check)
To avoid manual PDF parsing, we are strategically substituting the original manual reports with highly structured data:
- **PMFBY Dataset Replacement:** Use the local `ICRISAT District-Level Data.csv` to act as the gold-standard proxy for verified yield and general claim statuses. ✅
- **IMD Dataset Replacement:** Use the new "Drought" dataset currently being downloaded (e.g. Christ University Kaggle Climate Data) containing programmatic Drought/SPEI indexes. ✅
- **NDMA/NVMB Dataset Replacement:** *(Status: Pending Search)*. We need a clean programmatic source for flood labels in India before finalizing the flood aspect. ⏳

### Phase 1.1: Pre-Training on Foreign Data (Immediate Next Step)
- **Datasets Needed:** 
  1. **STURM-Flood** (~50GB via Zenodo) - Teaches the CNN what flooded agricultural land looks like globally.
  2. **HAD-FCDR25** (~8GB via Zenodo) - Teaches the model specific flood-damaged crop textures.
  3. **Sen4AgriNet** (~30GB subset) - Teaches the LSTM the temporal "bell curve" of a universally healthy crop growing season.
- **What is happening:** CNN+LSTM architectures require massive data to learn basic physics (e.g. what is water vs soil). Instead of burning Indian data on basics, we train the model offline heavily on these massive labeled global datasets first.
- **Tools:** `PyTorch`.

### Phase 1.2: Spatio-Temporal Imagery Extraction (For Indian Fine-Tuning)
- **Datasets Needed:** Google Earth Engine (Sentinel-2 Harmonized Surface Reflectance).
- **What is happening:** Taking our finalized labels from Phase 1.0 (once the flood dataset is found and merged), we will write a Python script that asks Google Earth Engine to download 8 months of Sentinel-2 satellite images representing those exact Indian districts.
- **Tools:** `earthengine-api`, `geopandas`.
- **Output:** Local folder of PyTorch-ready files containing 4D vectors: `(Time, Channels, Height, Width)`.

### Phase 1.3: Indian Model Fine-Tuning
- **What is happening:** The model (already hyper-smart from Phase 1.1 pre-training) is now fed our Indian GEE images (from 1.2) paired with our Indian labels (from 1.0). This "Fine-Tuning" adapts the model specifically to Indian monsoon patterns and Indian farm geographics. 
- **Output:** A finalized, trained weights file (`fasalsetu_model_vFINAL.pth`).

---

## Phase 2: MLOps & The Inference Engine
*Goal: Make the Python model accessible to the rest of the application.*

### Phase 2.1: FastAPI Server
- **What is happening:** We will wrap the PyTorch model in a lightweight `FastAPI` web server running internally on Port `8000`.
- **How it works:** Spring Boot will send an HTTP POST request containing `{"latitude": X, "longitude": Y, "date": Z}` to FastAPI. FastAPI fetches real-time satellite imagery for that GPS location from GEE, runs it through the model, and returns `{"damage_status": "Drought"}`.

---

## Phase 3: The Claim Management Backend
*Goal: The business infrastructure.*

### Phase 3.1: Spring Boot & MySQL Setup
- **What is happening:** Create the main application server. Connect it to MySQL.
- **Database Architecture:**
  - `Users` (Farmers, Insurance Agents)
  - `Farms` (GeoJSON coordinates representing a farmer's plot)
  - `Claims` (A track record linking a farm to an auto-generated model payout score).

### Phase 3.2: AI Orchestration Logic
- **What is happening:** Spring Boot hits the FastAPI service when an insurance claim is filed. It interprets the AI's signal and checks the database rules to approve or deny a crop insurance payout automatically.

---

## Phase 4: Geospatial Frontend
*Goal: A stunning, interactive interface to WOW users.*

### Phase 4.1: React UI Creation
- **What is happening:** Designing a React interface equipped with modern aesthetics (Dark modes, glassmorphism, fluid animations). We will avoid generic templates and ensure it looks like premium specialized software.

### Phase 4.2: Mapbox Dashboard
- **What is happening:** Building the interactive map. When an Insurance Agent clicks on a specific farm boundary on the map, the React UI queries the Spring Boot backend, hitting the AI pipeline, and visually paints the farm red/green depending on the damage rating.
