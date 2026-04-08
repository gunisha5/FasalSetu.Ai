# 🌾 AI Crop Damage Detection Model — Structured Overview

## 🔍 The Core Question: What Is Our Model Actually Doing?

Your model takes a **time-series of satellite images** of a farm plot and asks:

> "Looking at how this crop changed over the past 6 months, what happened to it?"

### 🎯 Output Labels:
- Healthy  
- Drought-Affected  
- Flood-Damaged  
- Partially Impacted  

---

## 🧠 Why You Need BOTH Types of Data

Think of it like teaching a doctor to read an ECG:

- First, learn what a **normal heartbeat** looks like (baseline)
- Then, learn what **abnormal patterns** look like
- Together → Accurate diagnosis

### 🌱 Similarly, Your Model Learns:

#### ✅ Healthy Crop Pattern (Normal Growth)
Jan: NDVI = 0.2 (seedling)  
Mar: NDVI = 0.7 (growing) → NORMAL bell curve  
May: NDVI = 0.8 (peak)  
Jul: NDVI = 0.3 (harvest)  

#### 🌵 Drought-Affected Crop
Jan: NDVI = 0.2 (seedling)  
Mar: NDVI = 0.4 (stunted) → FAILS TO PEAK  
May: NDVI = 0.2 (withering)  
Jul: NDVI = 0.1 (dead)  

#### 🌊 Flood-Damaged Crop
Jan: NDVI = 0.2 (seedling)  
Mar: NDVI = 0.7 (growing) → SUDDEN CRASH  
Apr: NDVI = 0.1 (flooded) ← Flood event here  
Jul: NDVI = 0.2 (partial recovery)  

---

## 📊 What Data Do You Actually Need?

| Data Type               | What It Is                                                  | Why You Need It |
|------------------------|-------------------------------------------------------------|----------------|
| Satellite Imagery (X)  | Time-series Sentinel-2 multi-spectral images               | Input to model |
| Damage Labels (Y)      | Tags like "flooded in Aug 2023"                            | Ground truth (answers) |
| Crop Type Info         | Crop type (paddy, wheat, etc.)                             | Helps learn correct baseline |

> ❌ You do NOT need generic data like crop prices or yields  
> ✅ You need **labeled satellite time-series data**

---

## 🧱 The 3-Layer Data Requirement

### 🛰️ Layer 1 — THE IMAGES
- Source: Sentinel-2 via Google Earth Engine (GEE)
- Free and automated
- Multi-spectral time-series for farm plots

### 📍 Layer 2 — THE BOUNDARIES
- Farm plot locations (GeoJSON polygons)
- Defines **where to look** in satellite data

### 🏷️ Layer 3 — THE LABELS (Ground Truth)
- Example:
  > "Farm X in Odisha was flood-damaged in September 2021"

- Sources:
  - Disaster records
  - Insurance claims
  - Government datasets

> ⚠️ **Biggest challenge: Getting reliable labels**

---

## 🤖 How CNN + LSTM Uses This Data

Sentinel-2 Images (6 months)  
↓  
CNN → Extract spatial features  
↓  
LSTM / Transformer → Learn temporal patterns  
↓  
Classifier Head  
↓  
OUTPUT: "Flood-Damaged" (92% confidence)  

### 🧩 Role Breakdown:

- **CNN (Space Understanding)** → Detects patterns like water, vegetation, soil  
- **LSTM (Time Understanding)** → Detects how patterns evolve over time  

---

## 🏷️ Labeling Strategy (Practical Approach)

Manual labeling is impossible at scale → Use **Weak Supervision**

### ⚙️ How It Works:

1. Get district-level disaster declarations  
   Example: "District X = drought-hit (Kharif 2022)"

2. Fetch satellite images for that district  

3. Automatically label:
   - Declared district → DROUGHT  
   - Non-declared district → HEALTHY  

---

## 🇮🇳 Data Sources for India

- PMFBY (Pradhan Mantri Fasal Bima Yojana) → Insurance claim records  
- NDMA (National Disaster Management Authority) → Disaster reports  
- IMD (India Meteorological Department) → Weather & disaster data  
- Sentinel-2 (GEE) → Satellite imagery  

---

## 📝 Summary

| Question | Answer |
|---------|-------|
| Do we need agricultural data? | Yes — for healthy baseline |
| Do we need damage data? | Yes — for abnormal patterns |
| Are they separate datasets? | No — same data, different labels |
| What’s the hardest part? | Getting reliable labels |
| How to get labels in India? | PMFBY + NDMA + IMD |

---

## 🚀 Final Insight

> The real intelligence of your system comes not from the model architecture,  
> but from how well you combine satellite data with real-world event labels.
