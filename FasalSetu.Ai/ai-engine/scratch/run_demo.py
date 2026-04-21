import sys
import os
from datetime import date

# Add parent directory to path so we can import the engine modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the core logic (assuming dependencies are installed)
try:
    from main import analyze_damage
    import config
    print("AI Engine modules loaded successfully.\n")
except ImportError as e:
    print(f"Error importing AI Engine: {e}")
    sys.exit(1)

def run_sample():
    # Patna, Bihar - Known flood-prone area
    sample_request = {
        "latitude": 25.5941,
        "longitude": 85.1376,
        "claim_date": date(2024, 8, 10),
        "district": "Patna",
        "crop": "Rice",
        "farmer_id": "DEMO-001"
    }

    print(f"--- FasalSetu AI Engine Demo ---")
    print(f"Analyzing claim for {sample_request['district']} on {sample_request['claim_date']}")
    print(f"Coordinates: ({sample_request['latitude']}, {sample_request['longitude']})")
    print("-" * 40)

    try:
        # Run the full pipeline
        response = analyze_damage(
            latitude=sample_request['latitude'],
            longitude=sample_request['longitude'],
            claim_date=sample_request['claim_date'],
            district=sample_request['district'],
            crop=sample_request['crop'],
            farmer_id=sample_request['farmer_id']
        )

        print("\n--- ANALYSIS COMPLETE ---")
        print(f"STATUS:      {response.status}")
        print(f"CONFIDENCE:  {response.confidence:.2%}")
        print(f"REASONING:   {response.reasoning}")
        print("-" * 40)
        
        print("\n--- DETAILED SIGNALS ---")
        print(f"Satellite Delta NDVI: {response.delta_ndvi}")
        print(f"Satellite Delta NDWI: {response.delta_ndwi}")
        print(f"Satellite Delta SAR:  {response.delta_sar}")
        
        if response.weather_available:
            print(f"Weather Rainfall:     {response.rainfall_mm} mm")
            print(f"Weather Flood Risk:   {response.weather_flood_risk}")
        else:
            print("Weather: DATA UNAVAILABLE")
            
        print(f"Historical Match:     {response.historical_match}")
        print("-" * 40)

    except Exception as e:
        print(f"Validation failed: {e}")

if __name__ == "__main__":
    run_sample()
