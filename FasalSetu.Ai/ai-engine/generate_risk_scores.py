import pandas as pd
import numpy as np
from pathlib import Path
import os

# Paths
AI_DIR = Path(__file__).parent
FLOOD_CSV = AI_DIR / "data" / "India_Flood_Inventory_v3.csv"
# Use relative path from the script's directory
ICRISAT_CSV = AI_DIR / "data" / "ICRISAT-District Level Data.csv"
OUTPUT_CSV = AI_DIR / "data" / "district_risk_dataset.csv"

def generate_risk():
    print("Starting risk calculation...")
    
    # 1. FLOOD RISK CALCULATION
    print("Processing Flood Inventory...")
    flood_df = pd.read_csv(FLOOD_CSV)
    district_flood_counts = {}
    
    for dist_str in flood_df['Districts'].dropna():
        districts = [d.strip().lower() for d in str(dist_str).split(',')]
        for d in districts:
            if d and d != 'none':
                district_flood_counts[d] = district_flood_counts.get(d, 0) + 1
                
    max_floods = max(district_flood_counts.values()) if district_flood_counts else 1
    flood_risks = {d: round(count / max_floods, 3) for d, count in district_flood_counts.items()}
    
    # 2. DROUGHT RISK CALCULATION (ICRISAT)
    print("Processing ICRISAT Yield Data...")
    icrisat_df = pd.read_csv(ICRISAT_CSV)
    # We'll use Rice Yield as a proxy for drought impact
    yield_col = "RICE YIELD (Kg per ha)"
    
    drought_risks = {}
    grouped = icrisat_df.groupby('Dist Name')
    
    for dist, group in grouped:
        dist_name = str(dist).lower().strip()
        yields = group[yield_col].dropna()
        if len(yields) < 5: continue
        
        # Calculate YoY changes
        changes = yields.pct_change().dropna()
        # Count years where yield dropped by more than 25% (indicator of drought/stress)
        bad_years = len(changes[changes < -0.25])
        total_years = len(changes)
        
        risk_score = round(bad_years / total_years, 3) if total_years > 0 else 0.1
        drought_risks[dist_name] = min(1.0, risk_score * 2) # Scale up slightly for better contrast

    # 3. MERGE AND SAVE
    print("Merging datasets...")
    all_districts = set(list(flood_risks.keys()) + list(drought_risks.keys()))
    
    rows = []
    for d in sorted(all_districts):
        # Default to 0.1 if no data, or keep neutral 0.5 if completely unknown?
        # Let's use 0.2 as a safe baseline for known regions.
        f_risk = flood_risks.get(d, 0.1)
        d_risk = drought_risks.get(d, 0.1)
        
        # Ensure minimum visibility
        f_risk = max(0.05, f_risk)
        d_risk = max(0.05, d_risk)
        
        rows.append({"district": d, "flood_risk": f_risk, "drought_risk": d_risk})
        
    final_df = pd.DataFrame(rows)
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    final_df.to_csv(OUTPUT_CSV, index=False)
    print(f"Success! Risk dataset generated with {len(final_df)} districts at {OUTPUT_CSV}")

if __name__ == "__main__":
    generate_risk()
