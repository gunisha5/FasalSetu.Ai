import pandas as pd
import numpy as np
import json

def normalize(series):
    """Scales values between 0 and 1 using max-scaling as per user example."""
    max_val = series.max()
    if max_val == 0 or pd.isna(max_val):
        return series.fillna(0)
    return (series / max_val).clip(0, 1)

def main():
    print("Loading combined district data...")
    # Load the dataframe created in the previous step
    df = pd.read_csv('district_risk_df.csv')
    
    # 1. Normalize components
    print("Normalizing raw metrics...")
    df['norm_flood_freq'] = normalize(df['flood_frequency'])
    df['norm_flooded_area'] = normalize(df['flooded_area'])
    df['norm_drought_index'] = normalize(df['drought_risk'])
    
    # 2. Calculate Combined Flood Risk
    # We weight frequency and historical area impact equally (50/50)
    df['flood_risk'] = (df['norm_flood_freq'] + df['norm_flooded_area']) / 2
    
    # 3. Calculate Drought Risk
    # Directly based on the normalized yield variation index
    df['drought_risk'] = df['norm_drought_index']
    
    # Final normalization of the risks to ensure they are strictly 0-1
    df['flood_risk'] = normalize(df['flood_risk'])
    df['drought_risk'] = normalize(df['drought_risk'])
    
    # 4. Prepare Output
    output_df = df[['district', 'state', 'flood_risk', 'drought_risk']].copy()
    
    # Fill any remaining NaNs with 0 (low risk)
    output_df = output_df.fillna(0)
    
    # Save to CSV
    output_df.to_csv('normalized_district_risk.csv', index=False)
    
    # Generate JSON sample for the user
    sample_json = output_df.head(5).to_dict(orient='records')
    
    print("\nNormalization Complete.")
    print("\nSample Output (JSON Format):")
    print(json.dumps(sample_json, indent=2))
    
    # Print summary statistics
    print("\nRisk Score Summary:")
    print(output_df[['flood_risk', 'drought_risk']].describe())

if __name__ == "__main__":
    main()
