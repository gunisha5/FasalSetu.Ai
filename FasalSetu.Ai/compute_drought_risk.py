import pandas as pd
import numpy as np

def clean_district(name):
    if pd.isna(name): return None
    return str(name).lower().strip()

def main():
    print("Fixing Drought Risk Calculation Logic...")
    
    # 1. Load Dataset
    path = "ICRISAT-District Level Data.csv"
    try:
        df = pd.read_csv(path)
    except FileNotFoundError:
        print(f"Error: {path} not found.")
        return
        
    # 2. Identify Proxy Columns
    rain_proxy_col = 'WHEAT YIELD (Kg per ha)'
    irrig_proxy_col = 'RICE YIELD (Kg per ha)'
    
    # Pre-process
    df['district'] = df['Dist Name'].apply(clean_district)
    agg_df = df.groupby('district')[[rain_proxy_col, irrig_proxy_col]].mean().reset_index()
    
    # 3. Normalization
    max_rain = agg_df[rain_proxy_col].max()
    max_irrig = agg_df[irrig_proxy_col].max()
    
    agg_df['rainfall_norm'] = agg_df[rain_proxy_col] / max_rain
    agg_df['irrigation_norm'] = agg_df[irrig_proxy_col] / max_irrig
    
    # 4. Compute Drought Risk
    agg_df['drought_risk'] = 1 - ((agg_df['rainfall_norm'] + agg_df['irrigation_norm']) / 2)
    
    # Clamp and Round
    agg_df['drought_risk'] = agg_df['drought_risk'].clip(0, 1).round(4)
    
    # 5. Add Debug
    print("\n[DEBUG] Drought Calculation Sample:")
    sample = agg_df.sort_values(by='drought_risk', ascending=False).head(5)
    for _, row in sample.iterrows():
        print(f"District: {row['district']} | RainNorm: {row['rainfall_norm']:.2f} | IrrigNorm: {row['irrigation_norm']:.2f} | Drought Risk: {row['drought_risk']}")
    
    # 6. Save Results
    output_path = "district_drought_risk.csv"
    agg_df[['district', 'drought_risk']].to_csv(output_path, index=False)
    
    print(f"\nCalculation complete. {len(agg_df)} districts updated.")

if __name__ == "__main__":
    main()
