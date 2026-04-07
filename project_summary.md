# Project Summary: AI-Powered Crop Insurance Assessment

This document serves as a high-level summary of the concepts, data sources, and architecture we discussed. It strips away the technical jargon so you can use this to remember how the project works, explain it to professors, or refer back to it as we build.

---

## 1. What is the Project?
We are building an intelligent system that acts like a digital detective. Its job is to look at a farmer's crop field from space and determine if it was damaged by an event (like a flood or drought) so that their insurance claim can be automatically verified.

## 2. The Core Strategy: "Change Detection"
Instead of teaching a highly complex AI what every type of "damage" looks like, we are going to use the **Before & After Strategy**:
1. **The Claim:** The farmer reports damage on a specific date (e.g., August 15th).
2. **The Fetch:** Our system automatically pulls a satellite picture of the farm from *before* the damage, and *after* the damage.
3. **The Comparison:** The system calculates the "greenness" of the field. If the field is drastically less green after the storm, the system flags the farm as damaged and approves the claim.

## 3. The 4 Clues (Data Sources) We Need
1. **Pictures from Space (Satellite Imagery):**
   * *What it is:* The actual photos of the crops used to calculate "Greenness" (NDVI).
   * *Where we get it:* The European **Sentinel-2** satellite provides these for free. We use **Google Earth Engine** to grab them automatically.
2. **The Outline of the Farm (Geospatial Boundaries):**
   * *What it is:* The exact location and perimeter of the farm so the system knows where to look.
   * *Where we get it:* The farmer will draw a box on a map on our website.
3. **The Answer Key (Training Data - Optional!):**
   * *What it is:* Historical lists of damaged farms. Only needed if we want to build an advanced, predictive AI instead of using the simple "Before & After" math rule.
   * *Where we get it:* **Source.coop** (formerly Radiant MLHub) or the **Agriculture-Vision** dataset. We will likely skip this and just use the math rules to get a working prototype faster!
4. **Weather Reports (Meteorological Data):**
   * *What it is:* Historical rain/temperature data.
   * *Where we get it:* NASA Power API. If thick clouds are blocking the satellite camera, the system can use the weather reports to verify if a massive storm hit the area.

---

## 4. How We Are Going to Build It (Tech Stack)
We are organizing the project into three distinct pieces:
* **The Brain (AI Microservice):** Python. It handles pulling the satellite pictures and doing the math on the 'greenness'.
* **The Engine (Backend Application):** Java & Spring Boot. This runs the business rules. It stores the users, handles the logins, and decides if an insurance claim should be paid.
* **The Filing Cabinet (Database):** MySQL. This stores the users, the claims, and the drawn farm boundaries.
* **The Display (Frontend):** React.js. The website the farmer actually logs into to draw their farm and see their approved claims.

## 5. Development Roadmap (The Order We Build In)
We are *not* starting with the AI or the satellite data. We are starting with the foundation.
* **Step 1:** Build the Database (MySQL) and Java Spring Boot Backend Engine. We will temporarily use fake AI data to test it.
* **Step 2:** Build the React Website and the interactive map.
* **Step 3:** Build the Python AI brain and hook it up to Google Earth Engine.
* **Step 4:** Connect the Brain to the Engine.
