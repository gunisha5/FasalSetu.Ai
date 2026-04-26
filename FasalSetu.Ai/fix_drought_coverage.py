import pandas as pd
import numpy as np
import os

def clean_name(name):
    if pd.isna(name): return ""
    return str(name).lower().strip()

def main():
    print("Fixing Drought Risk Coverage using Hierarchical Fallback...")
    
    # 1. Load Data
    intermediate_path = "district_risk_df.csv"
    final_path = "ai-engine/data/district_risk_dataset.csv"
    
    if not os.path.exists(intermediate_path) or not os.path.exists(final_path):
        print("Required datasets missing.")
        return
        
    df_inter = pd.read_csv(intermediate_path)
    df_final = pd.read_csv(final_path)
    
    # 2. Compute State-Level Averages for Drought Risk
    # We filter for districts that actually have calculated drought values (not default 0.5)
    # Based on our previous run, ICRISAT yielded ~311 districts.
    # In df_inter, the column was 'drought_risk'
    known_drought = df_inter[df_inter['drought_risk'].notna() & (df_inter['drought_risk'] != 0.5)]
    state_avg = known_drought.groupby('state')['drought_risk'].mean().to_dict()
    global_avg = known_drought['drought_risk'].mean()
    
    print(f"Computed averages for {len(state_avg)} states.")
    
    # 3. GLDAS Fallback (Specific local moisture data)
    gldas_path = "archive/groundwater_data/gldas_2018_2023.csv"
    gldas_map = {}
    if os.path.exists(gldas_path):
        g_df = pd.read_csv(gldas_path)
        g_agg = g_df.groupby('ADM2_NAME')['mean'].mean().reset_index()
        max_v, min_v = g_agg['mean'].max(), g_agg['mean'].min()
        g_agg['risk'] = 1 - ((g_agg['mean'] - min_v) / (max_v - min_v))
        gldas_map = dict(zip(g_agg['ADM2_NAME'].apply(clean_name), g_agg['risk']))

    # 4. Apply Logic to Final Dataset
    df_final['district_clean'] = df_final['district'].apply(clean_name)
    
    # Map district to state for fallback
    dist_to_state = dict(zip(df_inter['district'].apply(clean_name), df_inter['state']))
    
    fallback_stats = {"gldas": 0, "state": 0, "global": 0}
    
    def calculate_coverage(row):
        dist = row['district_clean']
        risk = row['drought_risk']
        
        # If it's the neutral 0.5, we apply hierarchy
        if risk == 0.5:
            # A. Check GLDAS (Climate Data)
            if dist in gldas_map:
                fallback_stats["gldas"] += 1
                return gldas_map[dist]
            
            # B. Check State Average
            state = dist_to_state.get(dist)
            if state in state_avg:
                fallback_stats["state"] += 1
                # Add a tiny bit of noise to avoid constant values per state
                return state_avg[state] + (np.random.random() * 0.02 - 0.01)
            
            # C. Check Global Average
            fallback_stats["global"] += 1
            return global_avg + (np.random.random() * 0.02 - 0.01)
            
        return risk

    df_final['drought_risk'] = df_final.apply(calculate_coverage, axis=1)
    
    # Final Normalization and Clean
    df_final['drought_risk'] = df_final['drought_risk'].clip(0, 1).round(4)
    
    # Save
    out_df = df_final[['district', 'flood_risk', 'drought_risk']]
    out_df.to_csv(final_path, index=False)
    
    print("\nCoverage Report:")
    print(f"- Updated via GLDAS: {fallback_stats['gldas']}")
    print(f"- Updated via State Average: {fallback_stats['state']}")
    print(f"- Updated via Global Average: {fallback_stats['global']}")
    print(f"Final dataset updated at {final_path}")

if __name__ == "__main__":
    main()
