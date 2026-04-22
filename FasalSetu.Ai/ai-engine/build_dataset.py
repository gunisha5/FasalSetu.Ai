"""
build_dataset.py — Phase 5: Generate Synthetic Training Data

Iterates over sample coordinates to extract GEE features and build a dataset.
Includes a 'mock' generator for fast prototyping without hitting GEE limits.
"""

import pandas as pd
import numpy as np
import random
from datetime import date
import os
import config
from gee_satellite import gee_instance

def generate_mock_data(num_samples: int = 200):
    """
    Fast synthetic data generation mapping expected feature distributions
    so we can train the AI without waiting for hours of GEE API calls.
    """
    print(f"Generating {num_samples} mock data points...")
    data = []
    for _ in range(num_samples // 3):
        # Flood cases (High NDWI, Drop in SAR, High Rainfall)
        # Added Noise: +- 15% variance to simulate sensor error
        rain = random.uniform(5.0, 25.0)
        noise = lambda: random.uniform(0.85, 1.15)
        data.append({
            'delta_ndvi': random.uniform(-0.1, 0.1) * noise(),
            'delta_ndwi': random.uniform(0.25, 0.6) * noise(),
            'delta_sar': random.uniform(-5.0, -2.0) * noise(),
            'is_historical_flood': 1,
            'is_historical_drought': 0,
            'rainfall_mm': rain * noise(),
            'weather_flood_risk': 1 if rain >= config.WEATHER_FLOOD_RAIN_THRESHOLD_MM else 0,
            'weather_drought_risk': 0,
            'label': 'FLOOD'
        })
    for _ in range(num_samples // 3):
        # Drought cases (Severe drop in NDVI, Low Rainfall, Low Humidity)
        rain = random.uniform(0.0, 0.1)
        noise = lambda: random.uniform(0.85, 1.15)
        data.append({
            'delta_ndvi': random.uniform(-0.6, -0.25) * noise(),
            'delta_ndwi': random.uniform(-0.3, 0.0) * noise(),
            'delta_sar': random.uniform(-1.0, 1.0) * noise(),
            'is_historical_flood': 0,
            'is_historical_drought': 1,
            'rainfall_mm': rain * noise(),
            'weather_flood_risk': 0,
            'weather_drought_risk': 1,
            'label': 'DROUGHT'
        })
    for _ in range(num_samples - (2 * (num_samples // 3))):
        # Normal cases (with "Difficult" cases)
        rain = random.uniform(0.0, 3.5)
        noise = lambda: random.uniform(0.85, 1.15)
        # Occasionally simulate a "high-looking" NDWI that isn't a flood to test model specificity
        difficult_ndwi = random.uniform(0.1, 0.28) if random.random() > 0.8 else random.uniform(-0.1, 0.1)
        data.append({
            'delta_ndvi': random.uniform(-0.1, 0.15) * noise(),
            'delta_ndwi': difficult_ndwi * noise(),
            'delta_sar': random.uniform(-1.0, 1.0) * noise(),
            'is_historical_flood': 0,
            'is_historical_drought': 0,
            'rainfall_mm': rain * noise(),
            'weather_flood_risk': 0,
            'weather_drought_risk': 0,
            'label': 'NORMAL'
        })
        
    df = pd.DataFrame(data)
    os.makedirs(config.TRAINING_CSV.parent, exist_ok=True)
    df.to_csv(config.TRAINING_CSV, index=False)
    print(f"Mock training data saved to {config.TRAINING_CSV}")

def extract_from_gee(coordinates, claim_dates):
    """
    Real GEE extraction loop (Warning: Slow due to API limits).
    """
    data = []
    print(f"Extracting features from GEE for {len(coordinates)} points...")
    for idx, (lat, lon) in enumerate(coordinates):
        date_obj = claim_dates[idx]
        print(f"Processing point {idx+1}/{len(coordinates)}...")
        d_ndvi, d_ndwi, d_sar = gee_instance.get_satellite_deltas(lat, lon, date_obj)
        
        # In a real workflow, we would know the ground-truth label based on the coordinates
        data.append({
            'delta_ndvi': d_ndvi or 0.0,
            'delta_ndwi': d_ndwi or 0.0,
            'delta_sar': d_sar or 0.0,
            'is_historical_flood': 0,    # Mocked for loop
            'is_historical_drought': 0,  # Mocked for loop
            'label': 'UNKNOWN'
        })
        
    df = pd.DataFrame(data)
    os.makedirs(config.TRAINING_CSV.parent, exist_ok=True)
    df.to_csv(config.TRAINING_CSV, index=False)
    print(f"Real training data saved to {config.TRAINING_CSV}")

if __name__ == "__main__":
    # To use the real GEE script, you would provide coordinate lists here.
    # For now, we will use the mock generator to instantly bootstrap the ML model.
    generate_mock_data(1000)
    print("Dataset generation complete. Next step -> train_model.py")
