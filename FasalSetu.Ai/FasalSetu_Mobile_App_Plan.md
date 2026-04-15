# FasalSetu.Ai — Mobile Application Implementation Plan (v5 — Final)

**Project:** FasalSetu.Ai — AI-Powered Crop Insurance Assessment  
**Authors:** Team FasalSetu  
**Date:** April 2026  
**Version:** v5 — Final (PWA Prototype + Dual AI Engine)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Prototype Strategy — PWA First](#2-prototype-strategy--pwa-first)
3. [Tech Stack](#3-tech-stack)
4. [The Correct User Journey](#4-the-correct-user-journey)
5. [Database Schema](#5-database-schema)
6. [Phase 1 — Registration (Done Once, 3 Steps)](#6-phase-1--registration-done-once--3-steps)
7. [Phase 2 — Claim Filing (Per Calamity, 5 Steps)](#7-phase-2--claim-filing-per-calamity--5-steps)
8. [AI Dual Engine Architecture](#8-ai-dual-engine-architecture)
9. [Backend REST API](#9-backend-rest-api)
10. [Screen Architecture](#10-screen-architecture)
11. [Claim Status Flow](#11-claim-status-flow)
12. [Android vs iOS Differences](#12-android-vs-ios-differences)
13. [Development Phases — 9 Weeks](#13-development-phases--9-weeks)
14. [Future AI Integration](#14-future-ai-integration)

---

## 1. Executive Summary

FasalSetu.Ai is an AI-powered crop insurance assessment system that automates insurance claim validation using satellite imagery and policy document analysis. It eliminates the need for manual on-ground inspection, reducing settlement time from weeks to hours.

The mobile application serves two user types:

| User | Role |
|---|---|
| 🌾 **Farmer** | Register land, file damage claims when calamity strikes, track payout status |
| 🏦 **Insurance Agent** | Review claims, verify AI analysis results, approve or reject payouts |

**Key decisions in this plan:**

| Decision | Reasoning |
|---|---|
| Insurance policy uploaded **at claim time**, not registration | A farmer can have multiple policies for different farms and different calamity types |
| Up to **3 policies** can be attached to one claim | Real-world: PMFBY for flood + private add-on for the same land |
| AI satellite runs **only for Flood and Drought** | Model is trained only on these two calamity types (Sentinel-2 NDVI/NDWI) |
| All other damage types go to **manual agent review** | Hailstorm, pest, fire etc. cannot be reliably detected from satellites |
| Prototype delivered as a **PWA** (Progressive Web App) | Faster build, shareable by URL, works on any phone, looks native |

---

## 2. Prototype Strategy — PWA First

### What We Are Building for Evaluation

Instead of a full native React Native app, we are delivering a **mobile-first Progressive Web App (PWA)** built with React + Vite. This is a deliberate, professional technical decision — not a shortcut.

> **A PWA is a website that behaves like a native app on a phone.**
> When the user visits the URL on their phone and taps "Add to Home Screen",
> the app appears as a full-screen icon — no browser bar, no address bar.
> It looks and feels identical to an app downloaded from the Play Store.

---

### Why PWA is the Right Strategy for This Project

Modern smartphone browsers support everything our app needs:

| Feature Needed | Supported in Browser? |
|---|---|
| GPS / Location | ✅ `navigator.geolocation` |
| Camera access | ✅ `<input capture="camera">` |
| Map polygon drawing | ✅ Leaflet / Mapbox GL JS |
| PDF document upload | ✅ `<input accept=".pdf">` |
| Push notifications | ✅ Web Push API |
| Offline support | ✅ Service Workers |
| "Add to Home Screen" icon | ✅ PWA manifest — looks like native app |

---

### PWA vs Native App — Honest Comparison

| Aspect | PWA (Our Prototype) | React Native (Full App) |
|---|---|---|
| Build time | **Weeks** | Months |
| Demo method | **Share a URL** — opens on any phone instantly | Requires APK install or App Store listing |
| Feels native on phone | ✅ Full screen, app icon, no browser chrome | ✅ True native |
| App Store listing | ❌ Not on Play Store / App Store | ✅ Listed |
| Evaluator can test | ✅ Any device instantly | Only if app is installed |
| Backend and AI code | **Identical in both cases** | Identical in both cases |
| Our stack (React) | ✅ Direct reuse of existing skills | Requires React Native learning curve |

> The technical depth of FasalSetu is in the **AI pipeline and backend architecture** — not the frontend framework. Evaluators assess what you built and why, not the deployment mechanism.

---

### PWA Technical Setup

Adding PWA capability to the React + Vite project requires only 2 things:

**1. `public/manifest.json`** — tells the browser to treat it as an installable app:

```json
{
  "name": "FasalSetu.Ai",
  "short_name": "FasalSetu",
  "description": "AI-powered crop insurance claim filing",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a1628",
  "theme_color": "#22c55e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**2. `vite-plugin-pwa`** — auto-generates the service worker for offline support:

```bash
npm install vite-plugin-pwa
```

That is all that is needed. The rest is normal React development.

---

### End-to-End Demo Flow (What Evaluators Will See)

```
Evaluator opens URL on phone → FasalSetu loads full screen, no browser bar
            ↓
Onboarding → Register with name, Aadhaar, email → OTP verification
            ↓
Add Farm → draws polygon on satellite map using finger
            ↓
Home screen → taps "File New Claim" (flood just hit the village)
            ↓
Claim Wizard:
  Step 1 → Selects affected farm
  Step 2 → Selects FLOOD, sets date, estimates 70% crop loss
  Step 3 → Uploads 3 photos from camera
  Step 4 → Uploads PMFBY policy PDF → taps "+ Add Policy" → uploads private add-on PDF
  Step 5 → Reviews, checks declaration box, receives OTP, enters code → SUBMITTED
            ↓
Processing screen → satellite imagery being fetched...
            ↓
AI Result appears:
  Damage Score: 74/100 (SEVERE)
  Policy 1 (PMFBY):  Entitled Rs 1,18,400
  Policy 2 (Add-on): Entitled Rs 29,600
  Total Payout:       Rs 1,48,000
            ↓
Agent login → sees claim in queue → reviews AI result → clicks APPROVE
            ↓
Farmer gets push notification → "Your claim is approved. Rs 1,48,000 will be transferred."
```

---

### How to Frame This in Your Project Report

Include this statement in your report and presentation slides:

> *"The current prototype is implemented as a mobile-first Progressive Web Application (PWA) using React + Vite, enabling demonstration of all core functionalities on any smartphone without requiring App Store installation. The complete native mobile architecture using React Native + Expo is fully documented and designed as part of the production roadmap. The PWA prototype demonstrates the system's full user journey, dual AI engine integration, multi-policy insurance processing, and real-time claim status tracking — serving as a functional proof-of-concept for evaluation purposes."*

---

## 3. Tech Stack

### Frontend — React + Vite (PWA, Mobile-First)

| Layer | Technology |
|---|---|
| Framework | **React 18 + Vite** |
| Language | **TypeScript** |
| Styling | **TailwindCSS** (mobile-first, 375px base) |
| Routing | **React Router v6** |
| State Management | **Zustand** |
| Maps | **Leaflet + react-leaflet** (polygon drawing tool) |
| HTTP Client | **Axios** |
| Forms | **React Hook Form + Zod** (type-safe validation) |
| PWA | **vite-plugin-pwa** + manifest.json + service worker |
| Icons | **Lucide React** |

### Backend — Java Spring Boot

| Layer | Technology |
|---|---|
| Framework | **Spring Boot 3.x** |
| Language | **Java 21** |
| Auth | **Spring Security + JWT + Email OTP** |
| ORM | **Spring Data JPA / Hibernate** |
| Email | **Spring Mail (SMTP via Gmail / SendGrid)** |
| Push Notifications | **Firebase Admin SDK (FCM)** |
| File + PDF Storage | **Cloudinary / AWS S3** |
| AI — Satellite | **RestTemplate → Python FastAPI (mocked for prototype)** |
| AI — Policy OCR | **Google Vision API + NLP service (mocked for prototype)** |
| Build Tool | **Maven** |

### Database — MySQL 8.x

| What | Details |
|---|---|
| Primary DB | **MySQL 8.x** |
| Geospatial | MySQL native `GEOMETRY` type (for farm polygon storage) |
| Migrations | **Flyway** (versioned SQL scripts, tracked in Git) |

---

## 4. The Correct User Journey

```
┌──────────────────────────────────────────────────────────────┐
│  PHASE 1 — DONE ONCE AT INSTALLATION (Registration)          │
│                                                              │
│  Personal Details → Email OTP Verify → Farm Details          │
│  (draw boundary on map) → Bank Details                       │
│                                                              │
│  No insurance policy here. Policies vary per calamity.       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │  Weeks or months pass...
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  PHASE 2 — WHEN CALAMITY STRIKES (Claim Filing)              │
│                                                              │
│  Select Farm → Calamity Details → Damage Evidence            │
│  → Upload Insurance Policy/Policies (fresh, per event)       │
│  → Review → OTP Submit                                       │
└───────────────────────────┬──────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     FLOOD or DROUGHT               ANY OTHER DAMAGE
    (AI satellite runs)           (manual agent review)
              │                           │
              ▼                           │
   Engine 1: Sentinel-2 NDVI             │
   damage severity analysis              │
              │                           │
              └──────────┬────────────────┘
                         ▼
              Engine 2: OCR + NLP
              reads uploaded policy PDFs
              extracts coverage terms
              calculates entitled payout
              per company norms
```

### Why Policy is Uploaded at Claim Time (Not Registration)

| Problem | How This Design Solves It |
|---|---|
| One farmer has multiple farms, each with a different insurer | Policy is attached per claim, not per farm |
| Same farm may have PMFBY for flood + private add-on for hailstorm | Farmer attaches **multiple policies** (up to 3) to one claim |
| Policies renew every year — 8-month-old document may be invalid | Fresh upload at claim time ensures it is always the current document |
| Some farmers may have no policy | Claim still submitted — goes to agent for manual review |

---

## 5. Database Schema

```sql
-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,   -- Used for OTP login
    phone               VARCHAR(15)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    role                ENUM('FARMER', 'AGENT', 'ADMIN') NOT NULL,
    aadhaar_number      VARCHAR(12) UNIQUE,
    date_of_birth       DATE,
    gender              ENUM('MALE', 'FEMALE', 'OTHER'),
    is_email_verified   BOOLEAN DEFAULT FALSE,
    fcm_token           VARCHAR(500),                   -- For push notifications
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EMAIL OTP TOKENS
-- OTP is hashed with BCrypt before storage.
-- Expires in 10 minutes. Single-use only.
-- ============================================================
CREATE TABLE email_otp_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    VARCHAR(255) NOT NULL,
    purpose     ENUM('REGISTRATION', 'LOGIN', 'CLAIM_SUBMIT', 'PASSWORD_RESET') NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- FARMS TABLE
-- A farmer can register multiple farms.
-- Boundary is a GeoJSON polygon drawn by the farmer on the map.
-- ============================================================
CREATE TABLE farms (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    farmer_id         BIGINT NOT NULL,
    farm_name         VARCHAR(255),             -- Nickname e.g. "North Field"
    state             VARCHAR(100) NOT NULL,
    district          VARCHAR(100) NOT NULL,
    taluka            VARCHAR(100),
    village           VARCHAR(100) NOT NULL,
    pincode           VARCHAR(10),
    survey_number     VARCHAR(100),             -- Khasra / Gata number
    area_hectares     DECIMAL(10, 4),           -- Auto-calculated from polygon
    boundary          GEOMETRY NOT NULL,        -- GeoJSON polygon
    soil_type         ENUM('CLAY', 'SANDY', 'LOAMY', 'SILT', 'RED', 'BLACK'),
    primary_crop      VARCHAR(100),             -- e.g. Rice, Wheat, Cotton
    secondary_crop    VARCHAR(100),
    irrigation_type   ENUM('RAINFED', 'CANAL', 'BOREWELL', 'DRIP', 'OTHER'),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id)
);

-- ============================================================
-- BANK DETAILS TABLE
-- Entered once at registration. Pre-filled on every claim.
-- ============================================================
CREATE TABLE bank_details (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    farmer_id       BIGINT NOT NULL UNIQUE,
    account_holder  VARCHAR(255) NOT NULL,      -- Must match Aadhaar name
    bank_name       VARCHAR(255) NOT NULL,
    account_number  VARCHAR(30) NOT NULL,
    ifsc_code       VARCHAR(15) NOT NULL,
    branch_name     VARCHAR(255),               -- Auto-fetched from IFSC API
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id)
);

-- ============================================================
-- CLAIMS TABLE
-- One row per calamity event filed by a farmer.
-- ============================================================
CREATE TABLE claims (
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,
    farm_id                   BIGINT NOT NULL,
    farmer_id                 BIGINT NOT NULL,
    agent_id                  BIGINT,

    -- Calamity Details (filled by farmer at claim time)
    damage_event_date         DATE NOT NULL,
    damage_type               ENUM(
                                'FLOOD',
                                'DROUGHT',
                                'HAILSTORM',
                                'CYCLONE',
                                'PEST_ATTACK',
                                'LANDSLIDE',
                                'FIRE',
                                'OTHER'
                              ) NOT NULL,
    estimated_loss_pct        INT,              -- Farmer's visual estimate (0–100)
    affected_area_hectares    DECIMAL(10, 4),
    crop_stage_at_damage      ENUM('SEEDLING', 'VEGETATIVE', 'FLOWERING', 'RIPENING', 'HARVESTING'),
    description               TEXT,            -- Free text from farmer

    -- Evidence uploaded by farmer
    damage_photo_urls         JSON,            -- Up to 5 Cloudinary URLs
    damage_video_url          VARCHAR(500),

    -- AI Engine 1: Satellite Analysis (FLOOD and DROUGHT only)
    ai_satellite_run          BOOLEAN DEFAULT FALSE,
    ai_ndvi_before            DECIMAL(6, 4),
    ai_ndvi_after             DECIMAL(6, 4),
    ai_damage_score           DECIMAL(5, 2),   -- 0 to 100
    ai_damage_label           ENUM('HEALTHY', 'MILD', 'MODERATE', 'SEVERE'),
    ai_satellite_confidence   DECIMAL(4, 3),
    ai_cloud_cover_warning    BOOLEAN DEFAULT FALSE,
    ai_satellite_skipped_reason VARCHAR(255),  -- Populated when not FLOOD/DROUGHT

    -- AI Engine 2: Policy Analysis (runs for all damage types)
    ai_policy_run             BOOLEAN DEFAULT FALSE,
    ai_policy_covered         BOOLEAN,
    ai_total_entitled_payout  DECIMAL(15, 2),  -- Sum across all attached policies
    ai_payout_reasoning       TEXT,

    -- Final Agent Decision
    status                    ENUM(
                                'PENDING',
                                'AI_PROCESSING',
                                'UNDER_REVIEW',
                                'APPROVED',
                                'REJECTED',
                                'PAID'
                              ) DEFAULT 'PENDING',
    final_payout_amount       DECIMAL(15, 2),  -- Agent may override AI recommendation
    agent_notes               TEXT,
    rejection_reason          TEXT,

    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (farm_id)     REFERENCES farms(id),
    FOREIGN KEY (farmer_id)   REFERENCES users(id),
    FOREIGN KEY (agent_id)    REFERENCES users(id)
);

-- ============================================================
-- CLAIM POLICIES TABLE
-- Each claim can have 1 to 3 insurance policies attached.
-- Policy PDFs are uploaded fresh at claim time — not at registration.
-- This supports: PMFBY for flood + private add-on on the same farm.
-- ============================================================
CREATE TABLE claim_policies (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id                BIGINT NOT NULL,
    farmer_id               BIGINT NOT NULL,

    -- Policy Identity (entered by farmer)
    insurance_company       VARCHAR(255) NOT NULL,
    policy_scheme           ENUM('PMFBY', 'WBCIS', 'RWBCIS', 'FASAL_BIMA', 'PRIVATE', 'OTHER'),
    policy_number           VARCHAR(100) NOT NULL,
    policy_start_date       DATE NOT NULL,
    policy_end_date         DATE NOT NULL,
    premium_paid            DECIMAL(10, 2),

    -- Farmer's declaration of what is covered
    declared_perils         JSON,              -- e.g. ["FLOOD", "DROUGHT"]
    declared_sum_insured    DECIMAL(15, 2),

    -- Uploaded Document
    policy_document_url     VARCHAR(500) NOT NULL,  -- Cloudinary/S3 URL

    -- AI OCR + NLP Extraction (one run per policy PDF)
    ai_ocr_status           ENUM('PENDING', 'DONE', 'FAILED') DEFAULT 'PENDING',
    ai_verified_perils      JSON,              -- What AI found in the document
    ai_verified_sum_insured DECIMAL(15, 2),
    ai_coverage_formula     TEXT,              -- Payout formula extracted from PDF
    ai_exclusions           JSON,              -- Exclusions extracted from PDF
    ai_this_policy_payout   DECIMAL(15, 2),    -- Payout from THIS policy alone
    ai_policy_valid         BOOLEAN,           -- Is this policy valid for this claim?
    ai_validity_reason      TEXT,              -- Plain English explanation

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id)  REFERENCES claims(id),
    FOREIGN KEY (farmer_id) REFERENCES users(id)
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(255),
    body        TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 6. Phase 1 — Registration (Done Once — 3 Steps)

> The farmer completes registration **once** when they first install the app.
> All data is permanently stored and reused for every future claim — nothing is re-entered.

---

### Step 1 — Personal Details

| Field | Input Type | Notes |
|---|---|---|
| Full Name | Text | As per Aadhaar card |
| Email Address | Email | Used for OTP verification and notifications |
| Phone Number | Number | 10-digit Indian mobile |
| Password | Password | Minimum 8 characters |
| Aadhaar Number | Number | 12-digit, for KYC identity |
| Date of Birth | Date Picker | |
| Gender | Radio | Male / Female / Other |

> OTP is sent to the email on submit. Farmer must verify the OTP before proceeding to Step 2.

---

### Step 2 — Farm Details

| Field | Input Type | Notes |
|---|---|---|
| Farm Name | Text | Nickname e.g. "North Field" |
| State | Dropdown | All Indian states listed |
| District | Dropdown | Auto-populated based on selected state |
| Taluka / Block | Text | Sub-district administrative unit |
| Village | Text | Village or locality name |
| Pincode | Number | 6-digit postal code |
| Survey / Khasra Number | Text | Land record number from Patwari documents |
| Primary Crop | Dropdown | Rice / Wheat / Cotton / Sugarcane / Maize / Soybean / Other |
| Secondary Crop | Dropdown | Optional |
| Soil Type | Dropdown | Clay / Sandy / Loamy / Silt / Red / Black |
| Irrigation Source | Dropdown | Rainfed / Canal / Borewell / Drip / Other |
| **Draw Farm Boundary** | **Map Tool** | Farmer taps polygon corner points on satellite map |
| Total Area (hectares) | Auto-calculated | Derived from drawn polygon — cannot be manually edited |

> Farmers can add additional farms later from the "My Farms" section after registration.

---

### Step 3 — Bank Details (for Payout Disbursement)

| Field | Input Type | Notes |
|---|---|---|
| Account Holder Name | Text | Must match name on Aadhaar |
| Bank Name | Text | e.g. SBI, Punjab National Bank |
| Account Number | Number | |
| Confirm Account Number | Number | Must match exactly |
| IFSC Code | Text | Auto-fetches branch name from IFSC API |
| Branch Name | Auto-filled | Read-only, populated from IFSC lookup |

---

## 7. Phase 2 — Claim Filing (Per Calamity — 5 Steps)

> Farm, bank, and profile are already stored. Farmer only provides calamity-specific information.
> Insurance policy is uploaded HERE — fresh each time, because it varies per event.

---

### Step 1 — Select Affected Farm

| Field | Type | Notes |
|---|---|---|
| Select Farm | Card Picker | All registered farms shown with farm name and crop type |
| Current Crop at Time of Claim | Auto-shown | Pre-filled from farm record — editable if crop changed |

---

### Step 2 — Calamity Details

| Field | Input Type | Notes |
|---|---|---|
| Date of Calamity | Date Picker | When did the damage event occur? |
| **Type of Damage** | Radio Buttons | See the AI routing note below |
| Estimated Crop Loss | Slider (0–100%) | Farmer's own visual assessment |
| Affected Area | Number (hectares) | How many hectares of the total farm are damaged |
| Crop Stage at Time of Damage | Dropdown | Seedling / Vegetative / Flowering / Ripening / Harvesting |
| Brief Description | Text Area | What happened, in the farmer's own words |

> **If FLOOD or DROUGHT is selected:**
> App shows a blue info card — *"AI satellite analysis will automatically assess your crop damage using Sentinel-2 satellite imagery. Results appear within ~10 minutes of submission."*
>
> **If any other damage type is selected:**
> App shows a yellow info card — *"An insurance agent will be assigned to manually verify and assess your claim."*

---

### Step 3 — Upload Damage Evidence

| Field | Input Type | Notes |
|---|---|---|
| Damage Photos | Image Picker | **Up to 5 photos** — taken from camera or chosen from gallery |
| Short Video | Video Picker | Optional — maximum 30 seconds showing field condition |
| Weather / News Document | Document Picker | Optional — PDF or image of IMD alert, news article, or Weather Station report |

---

### Step 4 — Insurance Policies

> A farmer can attach **up to 3 policies** to a single claim.

**Per Policy (farmer taps "+ Add Another Policy" to attach more):**

| Field | Input Type | Notes |
|---|---|---|
| Insurance Company | Dropdown + Text | AIC / Bajaj Allianz / HDFC Ergo / LIC / SBI General / ICICI Lombard / Other |
| Policy Scheme | Dropdown | PMFBY / WBCIS / RWBCIS / Fasal Bima / Private / Other |
| Policy Number | Text | Exactly as printed on the policy document |
| Damage Types This Policy Covers | Multi-select checkbox | Farmer's declaration |
| Policy Start Date | Date Picker | |
| Policy End Date | Date Picker | App warns if the policy is expired |
| Sum Insured (Rs) | Number | Maximum payout amount stated on the policy |
| Premium Paid (Rs) | Number | |
| **Upload Policy Document** | **PDF / Image Picker** | Actual policy PDF or clearly scanned photograph of the document |

> The AI reads each uploaded PDF independently and checks:
> 1. Is the policy currently valid (within start–end dates)?
> 2. Does the document actually confirm coverage for this damage type?
> 3. What is the payout calculation formula per this company's norms?
> 4. Are there any exclusions that apply to this specific claim?
> 5. What is the entitled payout from this policy alone?
>
> Payouts from all valid attached policies are **summed** for the total recommendation shown to the agent.

---

### Step 5 — Review and OTP Submit

- Full summary card displayed: farm name, calamity event, evidence count, no. of policies attached
- Bank account details shown for confirmation — editable if needed
- Declaration checkbox: *"I confirm that all information provided is accurate and complete to the best of my knowledge"*
- **"Submit Claim"** button → OTP sent to registered email → farmer enters 6-digit code → claim created in system

---

## 8. AI Dual Engine Architecture

> For the **prototype**, both engines are mocked with realistic hardcoded responses.
> When the real AI models are ready, only the Spring Boot service layer changes.
> The React frontend and MySQL database require **zero changes**.

---

### Which Engine Runs for Which Damage Type

| Damage Type | Engine 1 — Satellite NDVI | Engine 2 — Policy PDF OCR | Who Finalises |
|---|---|---|---|
| **FLOOD** | ✅ Runs automatically | ✅ Runs automatically | Agent reviews AI output |
| **DROUGHT** | ✅ Runs automatically | ✅ Runs automatically | Agent reviews AI output |
| HAILSTORM | ❌ Skipped — not in AI scope | ✅ Runs automatically | Agent does manual field verification |
| CYCLONE | ❌ Skipped | ✅ Runs automatically | Agent does manual field verification |
| PEST ATTACK | ❌ Skipped | ✅ Runs automatically | Agent does manual field verification |
| FIRE | ❌ Skipped | ✅ Runs automatically | Agent does manual field verification |
| OTHER | ❌ Skipped | ✅ Runs automatically | Agent does manual field verification |

---

### Engine 1 — Satellite NDVI Analysis (Flood and Drought Only)

```
Input:  { farm_id, damage_event_date, damage_type }

Pre-check:
  IF damage_type NOT IN ['FLOOD', 'DROUGHT']:
    → Set ai_satellite_run = FALSE
    → ai_satellite_skipped_reason = "Satellite analysis only supported for FLOOD/DROUGHT"
    → Skip to Engine 2

Processing Steps:
1. Fetch farm polygon boundary (GeoJSON) from MySQL
2. Query Google Earth Engine (Sentinel-2 Harmonized Surface Reflectance):
     Before image: 30 days BEFORE damage_event_date
     After image:  ON or AFTER damage_event_date
3. For FLOOD  → compute both NDVI (vegetation) and NDWI (water presence)
   For DROUGHT → compute NDVI + SWIR band (soil moisture indicator)
4. Calculate NDVI drop = ndvi_before − ndvi_after
5. Classify into damage severity:
     Drop < 0.10   → HEALTHY   (score  0–20)
     Drop 0.10–0.30 → MILD      (score 20–40)
     Drop 0.30–0.50 → MODERATE  (score 40–70)
     Drop > 0.50   → SEVERE    (score 70–100)
6. Cloud cover check:
     IF cloud cover > 70% on post-event image:
       → Set ai_cloud_cover_warning = TRUE
       → Reduce confidence score and note in reasoning

Output:
  { ndvi_before, ndvi_after, damage_score, damage_label,
    confidence, cloud_cover_warning }
```

---

### Engine 2 — Policy Document Analysis (All Damage Types)

```
Input per policy: { policy_document_url, damage_type, damage_score,
                    affected_area_hectares, farm_area_hectares, claim_date }

Steps (runs once per attached policy PDF):
1. Download PDF from Cloudinary / S3
2. Run OCR to extract raw text (Google Vision API / Tesseract)
3. Run NLP extraction:
     a. Policy validity: confirm start_date ≤ claim_date ≤ end_date
     b. Extract covered perils list from document text
     c. Check if damage_type is in covered_perils
     d. Extract maximum sum insured value
     e. Extract payout formula
          (e.g. "payout = loss_percentage × (affected_area / total_area) × sum_insured")
     f. Extract exclusions list from fine print
     g. Check if any exclusion applies to this specific claim scenario
4. If policy is valid AND damage type is covered:
     this_policy_payout = apply_formula(damage_score, affected_area, farm_area, sum_insured)
5. Store result with plain-English validity reasoning text

Aggregation (Spring Boot, after all policy PDFs processed):
  total_entitled_payout = SUM of ai_this_policy_payout for all valid policies
  Combine reasoning text from all policies into a single summary

Output per policy:
  { ai_policy_valid, ai_verified_perils, ai_verified_sum_insured,
    ai_coverage_formula, ai_exclusions,
    ai_this_policy_payout, ai_validity_reason }
```

---

### Sample Output — FLOOD Claim with 2 Policies (Agent View)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENGINE 1 — SATELLITE ANALYSIS (Sentinel-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Damage Score  :  74 / 100 — SEVERE
  NDVI Before   :  0.71    |    NDVI After : 0.20
  NDVI Drop     :  0.51
  Confidence    :  89%
  Cloud Warning :  None

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENGINE 2 — POLICY 1 :  AIC (PMFBY)
  Policy No. PMF-2024-MH-00182
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Policy Status  :  Active  ✅
  Coverage       :  FLOOD confirmed in document  ✅
  Sum Insured    :  Rs 2,00,000
  Formula Applied:  74% × 80% area × Rs 2,00,000
  Exclusions     :  None applicable  ✅
  This Payout    :  Rs 1,18,400

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENGINE 2 — POLICY 2 :  Bajaj Allianz (Private Add-on)
  Policy No. BA-CROP-029183
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Policy Status  :  Active  ✅
  Coverage       :  FLOOD confirmed in document  ✅
  Sum Insured    :  Rs 50,000 (add-on rider)
  Formula Applied:  74% × 80% area × Rs 50,000
  Exclusions     :  None applicable  ✅
  This Payout    :  Rs 29,600

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TOTAL RECOMMENDED PAYOUT  :  Rs 1,48,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 9. Backend REST API

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user — sends OTP to email |
| `POST` | `/api/auth/verify-email` | Submit OTP — activate account and return JWT |
| `POST` | `/api/auth/login` | Email + password — return JWT |
| `POST` | `/api/auth/send-otp` | Request OTP for a sensitive action |
| `POST` | `/api/auth/forgot-password` | Send OTP for password reset |
| `POST` | `/api/auth/reset-password` | OTP + new password |

### Farmer — Registration Data

| Method | Endpoint | Description |
|---|---|---|
| `GET` / `PUT` | `/api/farmer/profile` | View or update personal details |
| `GET` / `POST` | `/api/farmer/farms` | List all farms / Register a new farm |
| `GET` | `/api/farmer/farms/{id}` | Get a single farm's details |
| `GET` / `PUT` | `/api/farmer/bank-details` | View or update bank account |

### Farmer — Claim Filing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/farmer/claims` | File new claim (OTP code included in request body) |
| `GET` | `/api/farmer/claims` | List all claims with status filter |
| `GET` | `/api/farmer/claims/{id}` | Claim detail — AI results, policy breakdown, payout |
| `POST` | `/api/farmer/claims/{id}/policies` | Attach insurance policy PDF to a claim |
| `GET` | `/api/farmer/notifications` | All in-app notifications |

### Agent

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/agent/claims` | Claim queue — filter by ALL / AI_ASSISTED / MANUAL_REVIEW |
| `GET` | `/api/agent/claims/{id}` | Full claim with complete AI analysis |
| `PUT` | `/api/agent/claims/{id}/review` | Approve or Reject — set final payout |
| `GET` | `/api/agent/map/farms` | GeoJSON of all farms in agent's assigned region |

### AI Mock Endpoints (Internal — Replaced When Real AI Is Ready)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/internal/ai/satellite-assess` | Returns mock NDVI result for FLOOD/DROUGHT |
| `POST` | `/api/internal/ai/policy-ocr` | Returns mock OCR extraction result from PDF |
| `POST` | `/api/internal/ai/payout-aggregate` | Returns mock summed payout across all policies |

---

## 10. Screen Architecture

```
App (React + Vite PWA — Mobile-First, 375px base)
│
├── Auth
│   ├── Splash Screen
│   ├── Onboarding  (3 slides — what is FasalSetu, how claims work, what AI does)
│   ├── Login Screen             Email + Password
│   ├── OTP Verify Screen        6-digit code sent to email
│   ├── Forgot Password Screen
│   └── Registration Wizard      3 steps — done only once
│       ├── Step 1: Personal Details  (+ email OTP verify)
│       ├── Step 2: Farm Details      (includes map polygon drawing)
│       └── Step 3: Bank Details
│
├── Farmer Interface
│   │
│   ├── Home Dashboard
│   │   ├── My Farms summary cards (name, crop, hectares)
│   │   ├── Recent claims with status badges
│   │   └── "File New Claim" — large, prominent button
│   │
│   ├── My Farms
│   │   ├── Farm List Screen
│   │   ├── Farm Detail Screen
│   │   └── Add New Farm Screen   (for registering a second or third farm)
│   │
│   ├── My Claims
│   │   ├── Claim List            Filter: All / Processing / Under Review / Approved / Paid
│   │   ├── Claim Filing Wizard   5 steps — filed each time calamity strikes
│   │   │   ├── Step 1: Select Affected Farm
│   │   │   ├── Step 2: Calamity Details     (damage type sets AI path)
│   │   │   ├── Step 3: Evidence Upload      (photos, video, weather proof)
│   │   │   ├── Step 4: Insurance Policies   (upload 1–3 policy PDFs)
│   │   │   └── Step 5: Review + OTP Submit
│   │   └── Claim Detail Screen
│   │       ├── Status Timeline
│   │       ├── AI Satellite Card   (shown only for FLOOD / DROUGHT)
│   │       ├── Policy Analysis Cards  (one per attached policy with payout breakdown)
│   │       ├── Total Payout Recommendation
│   │       └── Agent Decision Card (approved / rejected with notes)
│   │
│   └── Notifications Screen
│
└── Agent Interface
    │
    ├── Dashboard
    │   ├── Stats: Pending / AI Processing / Manual Review / Approved / Rejected
    │   └── Total Payout Disbursed this month
    │
    ├── Claim Queue
    │   ├── Tab: All Claims
    │   ├── Tab: AI-Assisted     (FLOOD / DROUGHT — AI analysis complete, agent reviews)
    │   └── Tab: Manual Review   (Other damage types — agent verifies)
    │       └── Claim Review Screen
    │           ├── Farm boundary shown on satellite map
    │           ├── AI Satellite Score card  (if applicable)
    │           ├── Per-policy AI analysis cards
    │           ├── Total recommended payout
    │           ├── Farmer-uploaded photos
    │           └── Approve / Reject / Override Payout form
    │
    ├── Map Overview   (all farms in region, colour-coded by damage severity)
    └── Notifications Screen
```

---

## 11. Claim Status Flow

### FLOOD / DROUGHT — AI-Assisted Path

```
Submitted  (OTP verified — claim record created)
    ↓
AI Processing
    Engine 1: Sentinel-2 satellite imagery being fetched and analysed
    Engine 2: Uploaded policy PDFs being read via OCR + NLP
    ↓
AI Analysis Complete
    Damage score confirmed — payout calculated across all policies
    ↓
Under Agent Review
    Agent reviews AI output — approves, rejects, or overrides payout
    ↓
Approved / Rejected
    ↓
Payment Initiated  (payout transferred to registered bank account)
```

### All Other Damage Types — Manual Review Path

```
Submitted  (OTP verified — claim record created)
    ↓
AI Processing
    Engine 2 only: Policy PDFs read — no satellite analysis
    ↓
Policy Analysis Complete
    ↓
Under Agent Review
    Agent manually verifies damage (field visit or photo review)
    Agent checks policy AI analysis result for coverage confirmation
    ↓
Approved / Rejected
    ↓
Payment Initiated
```

### Status Timeline — Farmer View

```
✅  Claim Submitted         Aug 16, 2025 at 9:32 AM
    OTP verified. Claim FC-00482 created for North Field.

⏳  AI Analysis Running     Aug 16, 2025 at 9:33 AM
    Fetching Sentinel-2 satellite imagery for your farm boundary.

✅  AI Analysis Complete    Aug 16, 2025 at 9:41 AM
    Damage Score: 74/100 (Severe)
    Total Recommended Payout: Rs 1,48,000 across 2 policies.

🔄  Under Agent Review      Aug 17, 2025 at 10:00 AM
    Assigned to Agent Priya Sharma.

✅  Claim Approved          Aug 19, 2025 at 3:15 PM
    Final Payout: Rs 1,48,000
    Note: "AI confirms severe flood damage. Both policies verified and valid."

💰  Payment Initiated       Aug 20, 2025 at 11:00 AM
    Rs 1,48,000 transferred to SBI account ending 4821.
    Expected credit: 1–2 working days.
```

---

## 12. Android vs iOS Differences

> With the PWA prototype, both platforms are served from the **same URL**.
> The differences below are relevant if a full native React Native app is built in a future production phase.

| Aspect | Android | iOS |
|---|---|---|
| **Development machine** | Windows / Linux / Mac — any works | Mac with Xcode required for native build; use EAS cloud build to avoid this |
| **App Store cost** | **$25 one-time** | **$99 per year** |
| **Review speed** | Hours to 1 day | 1–3 days — manual, strict |
| **Back navigation** | Hardware back button always present | Swipe left from screen edge only |
| **Safe area insets** | Small status bar at top | Notch / Dynamic Island — must use `SafeAreaView` |
| **Push notification permission** | Granted automatically on Android ≤ 12 | Must be explicitly requested from the user |
| **PWA — Add to Home Screen** | ✅ Fully supported (Chrome, Firefox) | ✅ Supported in Safari only |
| **Camera permission** | `CAMERA` in `AndroidManifest.xml` | `NSCameraUsageDescription` in `Info.plist` |
| **Build format** | `.aab` (App Bundle) | `.ipa` |
| **Beta testing** | Google Play Internal Testing — instant | TestFlight — up to 10,000 testers |

**For the PWA prototype, all of the above differences are handled automatically by the browser.**

---

## 13. Development Phases — 9 Weeks

### Phase M1 — Foundation (Week 1–2)
- [ ] Initialise React + Vite project with TypeScript and TailwindCSS
- [ ] Configure React Router navigation structure
- [ ] PWA setup — `manifest.json`, `vite-plugin-pwa`, app icons, splash screen
- [ ] Splash, Onboarding, Login, OTP Verify screens
- [ ] 3-step Registration Wizard (personal + farm + bank)
- [ ] JWT authentication — Axios instance with token interceptor

### Phase M2 — Farm Setup (Week 3)
- [ ] Farm list and farm detail screens
- [ ] Map polygon drawing tool (Leaflet + editable polygon plugin)
- [ ] Add New Farm screen
- [ ] Bank details form with IFSC lookup API integration

### Phase M3 — Claim Filing Wizard (Week 4)
- [ ] 5-step Claim Filing Wizard screens
- [ ] Damage type selection — AI path vs manual review visual logic
- [ ] Photo upload to Cloudinary
- [ ] Multi-policy form with PDF upload (up to 3 policies)
- [ ] OTP-verified claim submission

### Phase M4 — Claim Tracking (Week 5)
- [ ] Claim list with status filter tabs and badges
- [ ] Status timeline component
- [ ] AI satellite score card (conditional — FLOOD/DROUGHT only)
- [ ] Per-policy analysis breakdown cards
- [ ] Total payout display with formula explanation

### Phase M5 — Agent Interface (Week 6)
- [ ] Agent dashboard with monthly stats
- [ ] Claim queue with filter tabs (All / AI-Assisted / Manual)
- [ ] Claim review screen with map overlay and approve/reject form
- [ ] Map overview screen with colour-coded farm markers

### Phase M6 — Backend APIs (Week 7)
- [ ] All Spring Boot REST endpoints
- [ ] Spring Mail OTP email service (Gmail SMTP or SendGrid)
- [ ] Cloudinary integration — photos and policy PDF uploads
- [ ] AI mock service — satellite result + policy OCR + payout aggregation
- [ ] MySQL schema with Flyway migrations
- [ ] FCM push notifications

### Phase M7 — Wiring and Polish (Week 8)
- [ ] Replace all frontend mocks with live Spring Boot API calls
- [ ] Mobile UI polish — touch targets, swipe gestures, keyboard behaviour
- [ ] Loading skeleton screens, error messages, offline banner
- [ ] PWA — final icon set, theme colour, splash screen

### Phase M8 — End-to-End Testing (Week 9)
- [ ] Full flow test: Register → Add Farm → File FLOOD Claim (2 policies) → AI runs → Agent Approves → Farmer notified
- [ ] Manual path test: File HAILSTORM Claim → Agent manual review
- [ ] Edge cases: OTP expired, wrong OTP, expired policy, cloud cover satellite warning, no policy attached
- [ ] Cross-device testing: Android phone, iPhone (Safari), tablet, desktop browser
- [ ] PWA install test: Add to Home Screen on Android and iOS

---

## 14. Future AI Integration

When real AI models are complete, **only the Spring Boot service layer needs changes**.
The React frontend, MySQL schema, and REST API response format remain identical.

```java
// ── SATELLITE ANALYSIS ────────────────────────────────────────────
// PROTOTYPE (mock):
return new SatelliteResult(74.5, "SEVERE", 0.89, false);

// PRODUCTION (calls Python FastAPI AI service):
SatelliteResult result = restTemplate.postForObject(
    "http://ai-service:8000/flood-drought-assess",
    new SatelliteRequest(farmBoundaryGeoJson, damageEventDate, damageType),
    SatelliteResult.class
);

// ── POLICY OCR + NLP ──────────────────────────────────────────────
// PROTOTYPE (mock):
return new PolicyOcrResult(true, 118400.0, List.of("FLOOD"), "Mock payout formula", List.of());

// PRODUCTION (calls OCR + NLP microservice):
PolicyOcrResult result = policyAnalysisClient.analyze(
    policyDocumentUrl,
    claimDetails
);
```

> **The mobile app (PWA) and database schema require zero changes when AI is plugged in.**
> This clean separation of concerns between the three layers is by design.

---

*Document prepared by Team FasalSetu.Ai — April 2026*  
*For queries or contributions, contact the team lead.*
