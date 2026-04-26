import pandas as pd
import os

def main():
    print("Building Final District Risk Intelligence Dataset...")
    
    # 1. Load Components
    try:
        df_flood = pd.read_csv("district_combined_flood_risk.csv")
        df_drought = pd.read_csv("district_drought_risk.csv")
    except FileNotFoundError as e:
        print(f"Error: Required component file missing: {e}")
        return
        
    # 2. Merge on district
    # Outer join to ensure we capture all districts from both risk vectors
    final_df = pd.merge(df_flood, df_drought, on='district', how='outer')
    
    # 3. Handle Data Gaps
    # Fill missing values with 0.5 (Neutral Risk baseline)
    final_df = final_df.fillna(0.5)
    
    # 4. Final Field Selection
    # Output: district, flood_risk, drought_risk
    final_output = final_df[['district', 'flood_risk', 'drought_risk']].copy()
    
    # 5. Save to Application Data Directory
    # Ensure directory exists
    os.makedirs('ai-engine/data', exist_ok=True)
    
    output_path = 'ai-engine/data/district_risk_dataset.csv'
    final_output.to_csv(output_path, index=False)
    
    # Also save a copy for normalized lookup (standardizing naming)
    final_output.to_csv('normalized_district_risk.csv', index=False)
    
    print(f"Dataset creation complete. Intelligence available for {len(final_output)} districts.")
    print("\nSample Intelligence Records:")
    print(final_output.head(10))

if __name__ == "__main__":
    main()
