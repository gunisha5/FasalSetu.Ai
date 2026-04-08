# FasalSetu AI — Dataset Master Plan
## Option A: Pre-train on Foreign Data → Fine-tune on India

---

> [!IMPORTANT]
> Read this entire document before downloading anything or writing any code.
> Every dataset listed here has a specific purpose. Using the wrong dataset
> at the wrong phase will waste your time.

---

## The Big Picture: Option A Approach

```
PHASE 0: Download foreign labeled datasets
          ↓
PHASE 1: Pre-train CNN+LSTM on foreign flood/drought data
         (Model learns: "what does satellite damage look like?")
          ↓
PHASE 2: Collect Indian ground truth labels (district-level)
          ↓
PHASE 3: Fetch Indian Sentinel-2 images via GEE for those districts
          ↓
PHASE 4: Fine-tune the pre-trained model on Indian data
         (Model adapts: "what does Indian paddy/wheat damage look like?")
          ↓
PHASE 5: Production model ready for FasalSetu AI
```

---

## Phase 0 + 1 — Pre-Training Datasets (Foreign, Labeled)

These datasets already have Sentinel-2 images + damage labels bundled together.
You do NOT need to label anything yourself. Just download and use.

---

### Dataset 1 — STURM-Flood

| Property | Details |
|---|---|
| **Full Name** | STURM: A Benchmark Dataset for Flood Extent Mapping |
| **What it contains** | Sentinel-1 SAR + Sentinel-2 multispectral images of 60 real flood events globally (2015–2023), paired with pixel-level flood/non-flood binary masks |
| **What your model learns from it** | What flooded agricultural land looks like spectrally. The CNN learns to detect standing water, waterlogged soil, and dead/submerged vegetation |
| **Label format** | Binary pixel mask: `0 = Not Flooded`, `1 = Flooded` (GeoTIFF raster files) |
| **Image format** | GeoTIFF (.tif), Sentinel-2 L2A bands at 10m resolution |
| **Size** | ~50 GB (you can download region-by-region) |
| **Primary Download** | https://zenodo.org/records/12748983 |
| **GitHub (instructions)** | https://github.com/STURM-WEO/STURM-Flood |
| **Paper reference** | arXiv:2407.xxxxx |

> [!NOTE]
> **Alternate if STURM-Flood is unavailable:**
> Sen1Floods11 Dataset
> - URL: https://github.com/cloudtostreet/Sen1Floods11
> - Zenodo: https://zenodo.org/record/3998594
> - Contains: 446 hand-labeled flood maps with Sentinel-1 + Sentinel-2 imagery
> - Same label format: binary flood mask GeoTIFFs

---

### Dataset 2 — HAD-FCDR25 (For Crop-Specific Flood Damage)

| Property | Details |
|---|---|
| **Full Name** | Hadejia Agricultural District Flood Crop Damage & Recovery Dataset 2025 |
| **What it contains** | Multi-temporal Sentinel-2 images of agricultural regions in Nigeria (2020–2022) + pixel-level labels for flood-damaged crops vs healthy crops |
| **What your model learns from it** | Unlike STURM-Flood which just marks "water", this dataset specifically marks flood-DAMAGED CROPS — much closer to what FasalSetu needs |
| **Label format** | Multi-class GeoTIFF mask: `0 = Healthy Crop`, `1 = Flood-Damaged Crop`, `2 = Recovering Crop` |
| **Image format** | GeoTIFF (.tif), Sentinel-2 bands B2, B3, B4, B8, B11, B12 |
| **Size** | ~8 GB |
| **Primary Download** | https://zenodo.org/records/HAD-FCDR25 (search "HAD-FCDR25" on zenodo.org) |

> [!NOTE]
> **Alternate if HAD-FCDR25 is unavailable:**
> Bihar Flood Impacted Croplands Dataset (BFCD-22)
> - This is actually an INDIAN dataset (Bihar, 2022 floods)
> - Search: "BFCD-22 Bihar cropland flood" on Google Scholar / Zenodo
> - Paper: Look for "FLNet" paper on arXiv which references this dataset
> - If found, this is BETTER than HAD-FCDR25 because it covers India

---

### Dataset 3 — Sen4AgriNet (For Healthy Crop Baseline)

| Property | Details |
|---|---|
| **Full Name** | Sen4AgriNet: A Multi-Year Multi-Country Benchmark Dataset for Agricultural Monitoring |
| **What it contains** | Large-scale Sentinel-2 TIME-SERIES (monthly images over full growing seasons) for agricultural fields across France, Greece, and Catalonia. Labeled with crop TYPE (wheat, corn, sunflower, etc.) |
| **What your model learns from it** | This teaches the LSTM what HEALTHY crop temporal patterns look like. The model learns the normal NDVI bell curve of a growing season so it can detect when something goes wrong |
| **Label format** | Shapefile (.shp) with crop type labels + corresponding Sentinel-2 patch GeoTIFFs |
| **Image format** | NumPy arrays (.npy) arranged as time-series patches, OR GeoTIFF patches |
| **Size** | ~120 GB (but you can download by country — start with Greece only, ~30 GB) |
| **Primary Download** | https://www.sen4agrinet.space/ |
| **GitHub** | https://github.com/Orion-AI-Lab/S4A |
| **Paper** | https://arxiv.org/abs/2204.00951 |

> [!NOTE]
> **Alternate if Sen4AgriNet is unavailable:**
> TimeSen2Crop Dataset
> - URL: https://github.com/0zgur0/ms-convSTAR
> - Zenodo: https://zenodo.org/record/6350734
> - Contains: 1 million+ Sentinel-2 patch time-series labeled by crop type (Austria)
> - Format: HDF5 files with shape (time_steps, height, width, bands)
> - Same purpose: teaches LSTM what healthy crop temporal patterns look like

---

## Phase 2 — Indian Ground Truth Labels (Free, Government Data)

These are NOT image datasets. These are text/CSV records that tell you
**which Indian districts experienced floods or droughts and in which season.**
You combine these with Sentinel-2 images from GEE to create
your Indian fine-tuning dataset.

---

### Source 1 — NDMA Flood Reports (Primary for Flood Labels)

| Property | Details |
|---|---|
| **Full Name** | National Disaster Management Authority Annual Reports |
| **What it gives you** | District-wise flood declarations by year and season (Kharif/Rabi) |
| **How you use it** | If NDMA says "Puri district, Odisha was flood-affected in Kharif 2022" → you fetch Sentinel-2 images from GEE for Puri district during August-October 2022 → label those as "Flood-Damaged" |
| **Format** | PDF reports (you extract district names and dates manually) |
| **Primary URL** | https://ndma.gov.in/Natural-Hazards/Floods (Annual reports section) |
| **Alternate URL** | https://nidm.gov.in (National Institute of Disaster Management) |

---

### Source 2 — IMD Drought Monitor (Primary for Drought Labels)

| Property | Details |
|---|---|
| **Full Name** | India Meteorological Department Drought Information System |
| **What it gives you** | District-level drought classifications: Normal / Mild Drought / Moderate Drought / Severe Drought per season |
| **How you use it** | Districts classified as "Severe Drought" in Kharif 2021 → fetch their Sentinel-2 images → label as "Drought-Affected" |
| **Format** | Interactive map + downloadable CSV/Excel files |
| **Primary URL** | https://www.imd.gov.in/pages/drought_main.php |
| **Alternate** | https://indiawris.gov.in (India Water Resources Information System) |

---

### Source 3 — PMFBY Claims Data (Gold Standard Labels)

| Property | Details |
|---|---|
| **Full Name** | Pradhan Mantri Fasal Bima Yojana (National Crop Insurance Portal) |
| **What it gives you** | Actual insurance claim records: which farmers (with GPS coordinates) claimed damage, what crop, what season, and whether it was approved |
| **How you use it** | Approved claim = confirmed damage at that GPS location → fetch Sentinel-2 images for that coordinate → label as damaged |
| **Format** | CSV/Excel download from portal |
| **Primary URL** | https://pmfby.gov.in → "Report" section → District/State wise data |
| **Alternate** | https://agri.rajasthan.gov.in (state portals often have more granular data) |

> [!IMPORTANT]
> PMFBY data is the BEST ground truth because it represents actual verified farmer claims.
> The IMD/NDMA data is district-level (coarse). PMFBY data can be village/GPS-level (precise).

---

## Phase 3 — Sentinel-2 via Google Earth Engine (The Images Themselves)

This is NOT a download. This is where you fetch the actual satellite images
for whichever Indian districts your Phase 2 labels identified.

| Property | Details |
|---|---|
| **What it is** | Google's cloud platform hosting the entire Sentinel-2 archive (2015–present) |
| **What you fetch** | Monthly Sentinel-2 composites for specific Indian district coordinates during specific seasons |
| **Bands to fetch** | B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR1), B12 (SWIR2) |
| **Derived indices** | NDVI = (B8-B4)/(B8+B4), NDWI = (B3-B11)/(B3+B11) |
| **Registration** | https://earthengine.google.com → Sign up (free with Google account) |
| **Code editor** | https://code.earthengine.google.com |
| **Python API docs** | https://developers.google.com/earth-engine/guides/python_install |

> [!NOTE]
> The `gee_data_pipeline.js` file already written in `ml-service/` handles this step.
> But we only run it AFTER Phase 2 is done — so we know WHICH coordinates to fetch.

---

## Summary Table: Every Dataset at a Glance

| Phase | Dataset | Purpose | Format | Size | Primary Link |
|---|---|---|---|---|---|
| Pre-train | **STURM-Flood** | Flood detection (spatial) | GeoTIFF + binary mask | ~50 GB | zenodo.org/records/12748983 |
| Pre-train | **HAD-FCDR25** | Flood crop damage (spatial) | GeoTIFF + multi-class mask | ~8 GB | zenodo.org (search HAD-FCDR25) |
| Pre-train | **Sen4AgriNet** | Healthy crop time-series (temporal) | NumPy/GeoTIFF patches | ~120 GB | sen4agrinet.space |
| Fine-tune labels | **NDMA Reports** | Indian flood district labels | PDF → CSV | Tiny | ndma.gov.in |
| Fine-tune labels | **IMD Drought Monitor** | Indian drought district labels | CSV/Excel | Tiny | imd.gov.in |
| Fine-tune labels | **PMFBY Portal** | Verified Indian claim locations | CSV/Excel | Small | pmfby.gov.in |
| Fine-tune images | **GEE (Sentinel-2)** | Indian satellite images | Fetched via API | Varies | code.earthengine.google.com |

---

## The Exact Option A Step-by-Step Approach

```
STEP 1 → Register on GEE (earthengine.google.com) — takes 1 day approval

STEP 2 → Download STURM-Flood from Zenodo
          URL: https://zenodo.org/records/12748983
          What to download: The Sentinel-2 image patches + flood mask annotations
          File types: .tif files organized by event folders

STEP 3 → Download Sen4AgriNet (Greece subset to save space)
          URL: https://www.sen4agrinet.space
          What to download: Time-series patches for 1 year (choose Greece)
          File types: .npy or .tif patch files + labels.csv

STEP 4 → Run pre-training using STURM-Flood (flood class) + 
          Sen4AgriNet (healthy class)
          → Model now understands flood vs healthy spectrally & temporally

STEP 5 → Go to NDMA (ndma.gov.in) and note which Indian districts
          were flood-hit in Kharif 2020, 2021, 2022
          → Create a CSV: district_name, state, year, season, damage_type

STEP 6 → Go to IMD Drought Monitor and note drought-hit districts
          same seasons → add to the CSV with damage_type = Drought

STEP 7 → Run gee_data_pipeline.js in GEE Code Editor
          → Input: your districts CSV
          → Output: Sentinel-2 GeoTIFF time-series for those districts
          → These become your Indian training images

STEP 8 → Combine GEE images (Step 7) + district labels (Steps 5-6)
          → This is now your Indian fine-tuning dataset

STEP 9 → Fine-tune the pre-trained model (from Step 4) on this 
          Indian dataset
          → Model now adapts to Indian monsoon patterns + crop types

STEP 10 → Test: present Indian farm plots + check if model correctly 
           classifies Healthy / Drought / Flood / Partial
```

---

## What Format Does Each Dataset Need to Be In for Your Model?

Your CNN+LSTM model expects this tensor shape per farm:
```
(T, C, H, W)
 |  |  |  └── Width of patch in pixels (e.g., 64)
 |  |  └───── Height of patch in pixels (e.g., 64)
 |  └──────── Channels = 8 bands [B2,B3,B4,B8,B11,B12,NDVI,NDWI]
 └─────────── Time steps = number of months (e.g., 5 for Kharif)
```

| Dataset | Raw Format | Conversion Needed |
|---|---|---|
| STURM-Flood | Per-event GeoTIFF folders | Extract 64×64 patches, compute NDVI/NDWI, stack to (T,C,H,W) |
| HAD-FCDR25 | Multi-band GeoTIFF | Same as above |
| Sen4AgriNet | .npy patch files (T,H,W,C) or (T,C,H,W) | Transpose axes if needed, select correct 8 bands |
| Indian GEE data | Per-month GeoTIFF exports | Stack monthly files into (T,C,H,W) — data_loader.py handles this |

> [!TIP]
> Start with Sen4AgriNet because it's already in time-series patch format.
> It requires the least pre-processing to get into (T, C, H, W) shape.
