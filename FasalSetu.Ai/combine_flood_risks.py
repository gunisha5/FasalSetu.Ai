import pandas as pd

def main():
    print("Combining Flood Frequency and Magnitude Risks...")
    
    # 1. Load Datasets
    try:
        df_freq = pd.read_csv("district_flood_frequency.csv")
        df_area = pd.read_csv("district_flood_area_risk.csv")
    except FileNotFoundError as e:
        print(f"Error: Required risk file missing: {e}")
        return
        
    # 2. Merge on district
    combined_df = pd.merge(df_freq, df_area, on='district', how='outer')
    
    # 3. Handle Missing Values
    combined_df = combined_df.fillna(0)
    
    # 4. Compute Unified Flood Risk
    combined_df['flood_risk'] = (combined_df.get('flood_risk_freq', 0) + combined_df.get('flood_risk_area', 0)) / 2
    
    # Round for precision
    combined_df['flood_risk'] = combined_df['flood_risk'].round(4)
    
    # Sort by unified risk
    combined_df = combined_df.sort_values(by='flood_risk', ascending=False)
    
    # 5. Save Results
    output_path = "district_combined_flood_risk.csv"
    combined_df.to_csv(output_path, index=False)
    
    print(f"Risk consolidation complete. Total districts: {len(combined_df)}")
    print("\nTop 10 High-Risk Flood Districts (Unified Index):")
    # Dynamically select columns that exist to avoid KeyError
    cols = [c for c in ['district', 'flood_risk_freq', 'flood_risk_area', 'flood_risk'] if c in combined_df.columns]
    print(combined_df[cols].head(10))

if __name__ == "__main__":
    main()
