# AI-Powered Crop Insurance & Damage Assessment Implementation Plan

## Project Overview
This project aims to build a multi-spectral satellite-driven crop damage assessment platform using AI. It evaluates the health of crops by analyzing satellite data and provides an automated or semi-automated system for processing and validating crop insurance claims. 

The architecture involves fetching satellite imagery, feeding it into a Machine Learning pipeline for damage assessment, and processing those results via a robust backend connected to a user-friendly frontend dashboard.

## Proposed Tech Stack

### Backend & Database (Core Application)
- **Framework**: Spring Boot (Java) - Excellent for complex business rules, user management, and serving the frontend application.
- **Database**: MySQL - For relational data such as Users, Insurance Policies, Farms, and Claim records. MySQL's Spatial Data Types will be utilized to store and query farm boundaries (GeoJSON polygons).
- **Architecture**: A RESTful architecture handling requests from the frontend, reading/writing to MySQL, and orchestrating requests to the Python ML Microservice.

### Data Engineering & ML (Processing Microservice)
Since AI and geospatial operations are best handled in Python, this will run as an entirely separate microservice.
- **Microservice Framework**: FastAPI or Flask (Python) to expose inference endpoints.
- **Data Source**: Sentinel-2 imagery (via Google Earth Engine or Copernicus API).
- **Geospatial Processing**: `rasterio`, `geopandas`, `xarray`.
- **Machine Learning**: `PyTorch` or `TensorFlow` for Spatio-temporal Deep Learning to assess crop damage based on vegetation indices (NDVI, NDWI).

### Frontend & Dashboard
- **Framework**: React.js / Next.js
- **Mapping**: Mapbox GL JS or Leaflet (via React Leaflet) for visualizing satellite imagery, heatmaps, and farm boundaries.
- **Styling**: Tailwind CSS & Shadcn UI (for a clean, modern dashboard interface).

---

## User Review Required

> [!WARNING]  
> Please review the Open Questions below. The availability of satellite data and what ML models are feasible depends heavily on your answers.

## Proposed Architecture Breakdown

### 1. Spring Boot Backend Application (`/backend`)
- **Controllers**: API endpoints (`/api/claims`, `/api/farms`, etc.).
- **Services**: Business logic. An `InsuranceDecisionService` will evaluate the damage scores returned by the AI microservice and determine payout eligibility based on policy rules.
- **Repositories**: Spring Data JPA to interface with MySQL.
- **Entities**: JPA models mapping to MySQL tables (`User`, `Farm`, `Policy`, `Claim`).

### 2. Python ML Microservice (`/ml-service`)
- Python API waiting for requests like: "Assess damage for Farm Polygon X between Date Y and Date Z".
- Python logic then queries Google Earth Engine, runs deep learning inference to assess crop stress, and returns a JSON response containing damage percentage/classification back to Spring Boot.

### 3. React Frontend (`/frontend`)
- Interacts purely with the Spring Boot backend. 
- Renders an interactive map and temporal charts for policyholders and insurers.

---

## Project Phases

### Phase 1: Spring Boot, MySQL & Core Domain (Foundation)
*Focus: Build the data models and core business logic first to establish the backbone of the platform.*
- Design and set up MySQL database schemas (Users, Farm Plots, Policies, Claims).
- Initialize the Java Spring Boot project.
- Build REST APIs for CRUD operations. 
- Create a mocked interface for the AI service so the backend can process mock "Damage Scores" to test the Insurance Engine logic.

### Phase 2: Frontend Dashboard & Map Integration
*Focus: Build the user interface using mocked data from Phase 1 to validate the end-to-end user experience.*
- Initialize the React.js frontend interface with Tailwind CSS.
- Implement an interactive Mapbox/Leaflet map component for users to draw or view farm boundaries.
- Hook up the frontend map and claim views to the Spring Boot REST APIs so the core user flows work perfectly.

### Phase 3: Python AI Microservice (Data Acquisition & ML)
*Focus: Build out the actual geospatial intelligence now that the platform can consume its outputs.*
- Set up the Python FastAPI/Flask microservice.
- Implement Google Earth Engine (GEE) scripts to pull Sentinel-2 multi-spectral data for regions of interest.
- Develop the Spatio-temporal ML models (or rule-based NDVI calculations) for calculating crop damage.

### Phase 4: Full System Integration
*Focus: Replace mocks with real intelligence.*
- Connect the Spring Boot backend to the live Python AI microservice (replacing the mocked interface).
- End-to-end verification of drawn farm boundaries triggering actual GEE data fetches -> Model Inference -> Real claim payouts on the dashboard.

---

## Open Questions

1. **AI Microservice Hosting**: Are you comfortable running a secondary Python process alongside the Spring Boot application? (This is standard practice for AI web applications).
2. **Ground Truth Data**: Do you have access to real insurance claims (affected areas mapped with GPS) to train an advanced Deep Learning model, or do you want to start with a Rule-Based threshold approach utilizing vegetation indices (NDVI)?
3. **Database Setup**: Do you have a local instance of MySQL installed and running to connect Spring Boot to, or do we need to set that up via Docker?

## Verification Plan
- **Setup Check**: Run both the Spring Boot app and Python ML service locally. Verify they can communicate.
- **Database Hookup**: Ensure that adding a new "Farm" via REST API correctly persists to your local MySQL database.
- **End-to-End**: A front-end request triggers a mocked AI assessment through Spring Boot and accurately displays an overlay on the frontend map.
