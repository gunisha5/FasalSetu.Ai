import pandas as pd
import re

def clean_district(name):
    if pd.isna(name): return None
    name = str(name).lower().strip()
    blacklist = ['affected', 'adjoining areas', 'various districts', 'parts of']
    for b in blacklist:
        name = name.replace(b, '').strip()
    name = re.sub(r'[^a-z\s]', '', name).strip()
    if not name or len(name) < 3: return None
    return name

def main():
    print("Computing Flood Risk by Area...")
    
    # 1. Load Dataset
    path = "District_FloodedArea.csv"
    try:
        df = pd.read_csv(path)
    except FileNotFoundError:
        print(f"Error: {path} not found.")
        return
        
    # 2. Extract and Standardize Districts
    df['district'] = df['Dist_Name'].apply(clean_district)
    
    # 3. Identify Flooded Area Column
    # Based on audit: 'Corrected_Percent_Flooded_Area'
    area_col = 'Corrected_Percent_Flooded_Area'
    
    # 4. Normalize
    df_clean = df.dropna(subset=['district', area_col])
    max_area = df_clean[area_col].max()
    
    df_clean['flood_risk_area'] = df_clean[area_col] / max_area
    
    # 5. Group and Average (if multiple entries per clean district exist)
    area_risk_df = df_clean.groupby('district')['flood_risk_area'].mean().reset_index()
    
    # Sort by risk
    area_risk_df = area_risk_df.sort_values(by='flood_risk_area', ascending=False)
    
    # Save results
    output_path = "district_flood_area_risk.csv"
    area_risk_df.to_csv(output_path, index=False)
    
    print(f"Area risk analysis complete. Max Flooded Area %: {max_area:.2f}%")
    print("\nTop 10 High-Impact Flooded Districts:")
    print(area_risk_df.head(10))

if __name__ == "__main__":
    main()
