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

### Phase 1.1: PyTorch Spatio-Temporal Model Pre-Training (Immediate Next Step)

We will now construct the underlying ML Architecture utilizing the extracted global datasets.

#### 1. Pivot Strategy (Why Sen4AgriNet is No Longer Required)
- **The Pivot:** Because Sen4AgriNet introduced access restrictions, we are dropping it entirely. 
- **The Solution:** The **STURM-Flood** and **HAD-FCDR25** datasets contain "Healthy/Non-Flooded" pixels right alongside the flooded ones. We will extract our "Healthy" baseline samples directly from these datasets instead. This is mathematically identical but simplifies our dataloader since we only process two datasets instead of three.

#### 2. ML Environment Setup (`.venv`)
- **Install Core Libraries:** `torch`, `torchvision`, `rasterio` (for reading `.tif` GeoTIFFs), `geopandas`, and `scikit-learn` in the local Python environment.

#### 2. Spatio-Temporal Deep Learning Architecture (`scripts/core_ml/model.py`)
- **The CNN (Spatial):** A 2D Convolutional Neural Network. It will read 6 feature bands (`B2`, `B3`, `B4`, `B8`, and derived `NDVI`, `NDWI`) from a cropped satellite patch (e.g., $64\times64$ pixels) to identify visual textures like standing water or healthy vegetation.
- **The LSTM (Temporal):** The CNN output vector is passed into an LSTM which observes how these visual features evolve over a sequence of months (Time Steps). 
- **Classifier Head:** A final Linear layer outputting class probabilities (Healthy vs Flood vs Drought).

#### 3. Custom GeoTIFF DataLoader (`scripts/core_ml/dataset.py`)
- We will build a PyTorch `Dataset` component that directly reads from `data/STURM_Flood_Subset/extracted/Dataset/Sentinel2` and matches the patches to labels located in `Sentinel2_metadata.csv`.
- It will perform live dynamic calculation of the NDVI & NDWI indices directly from the raw multispectral bands to minimize storage bloat.

#### 4. Pre-Training Loop (`scripts/core_ml/train.py`)
- We will write the training loop using Binary Cross Entropy (BCE) focusing on detecting Flood vs Non-Flood patterns.

> [!IMPORTANT]
> Does this architectural approach look good to you? Do you want me to proceed with setting up the virtual environment (`requirements.txt`) and writing the PyTorch codebase?

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
