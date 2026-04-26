import pandas as pd
import numpy as np

def clean_name(name):
    """Standardize district and state names."""
    if pd.isna(name):
        return None
    return str(name).lower().strip()

def process_flood_inventory(file_path):
    """Process India Flood Inventory dataset."""
    df = pd.read_csv(file_path)
    
    # Selecting relevant columns
    # 'Districts' can be comma-separated
    df = df[['Districts', 'State']].copy()
    df.columns = ['district', 'state']
    
    # Drop rows with no district info
    df = df.dropna(subset=['district'])
    
    # Split comma-separated districts and explode
    df['district'] = df['district'].str.split(',')
    df = df.explode('district')
    
    # Clean names
    df['district'] = df['district'].apply(clean_name)
    df['state'] = df['state'].apply(clean_name)
    
    # Filter out empty strings
    df = df[df['district'] != '']
    
    # Calculate flood frequency
    flood_freq = df.groupby(['district', 'state']).size().reset_index(name='flood_frequency')
    
    return flood_freq

def process_flooded_area(file_path):
    """Process District Flooded Area dataset."""
    df = pd.read_csv(file_path)
    
    # Standardize columns
    df = df[['Dist_Name', 'Corrected_Percent_Flooded_Area']].copy()
    df.columns = ['district', 'flooded_area']
    
    # Clean district names
    df['district'] = df['district'].apply(clean_name)
    
    # Remove duplicates if any (keep max flooded area)
    df = df.groupby('district')['flooded_area'].max().reset_index()
    
    return df

def process_icrisat_data(file_path):
    """Process ICRISAT District Level Data."""
    df = pd.read_csv(file_path)
    print("Dataset loaded:", df.shape)
    
    # Standardize columns
    df = df[['Dist Name', 'State Name', 'RICE YIELD (Kg per ha)', 'WHEAT YIELD (Kg per ha)']].copy()
    df.columns = ['district', 'state', 'rice_yield', 'wheat_yield']
    
    # Clean names
    df['district'] = df['district'].apply(clean_name)
    df['state'] = df['state'].apply(clean_name)
    
    # Calculate drought indicators using normalized availability
    # We map 'WHEAT YIELD' to rainfall proxy and 'RICE YIELD' to irrigation proxy
    df['rainfall_norm'] = df['wheat_yield'] / df['wheat_yield'].max()
    df['irrigation_norm'] = df['rice_yield'] / df['rice_yield'].max()
    
    # Formula: 1 - ((RainNorm + IrrigNorm) / 2)
    df['drought_risk'] = 1 - ((df['rainfall_norm'] + df['irrigation_norm']) / 2)
    
    # Aggregate by district/state
    result = df.groupby(['district', 'state'])['drought_risk'].mean().reset_index()
    
    # 5. Debug Print
    print("Sample drought values:", result[["district", "drought_risk"]].head(10))
    
    return result

def main():
    print("Loading datasets...")
    
    # File paths
    flood_inventory_path = 'India_Flood_Inventory_v3.csv'
    flooded_area_path = 'District_FloodedArea.csv'
    icrisat_path = r"C:\Users\manya\Downloads\FasalSetu.Ai\FasalSetu.Ai\ICRISAT-District Level Data.csv"
    
    # Process datasets
    print("Processing Flood Inventory...")
    flood_freq_df = process_flood_inventory(flood_inventory_path)
    
    print("Processing Flooded Area data...")
    flooded_area_df = process_flooded_area(flooded_area_path)
    
    print("Processing ICRISAT data...")
    icrisat_risk_df = process_icrisat_data(icrisat_path)
    
    # Merging Datasets
    print("Merging datasets...")
    
    # First merge: Flood Frequency + ICRISAT (both have state info)
    district_risk_df = pd.merge(icrisat_risk_df, flood_freq_df, on=['district', 'state'], how='outer')
    
    # Second merge: Add Flooded Area (only has district info)
    # Note: Merging on district might cause duplicates if multiple states have same district name,
    # but for risk intelligence we often aggregate or assume unique district names if state is missing.
    district_risk_df = pd.merge(district_risk_df, flooded_area_df, on='district', how='left')
    
    # Final cleaning
    district_risk_df['flood_frequency'] = district_risk_df['flood_frequency'].fillna(0)
    district_risk_df['flooded_area'] = district_risk_df['flooded_area'].fillna(0)
    
    # Save output
    district_risk_df.to_csv('district_risk_df.csv', index=False)
    
    print("\nMerge complete. Final dataframe shape:", district_risk_df.shape)
    print("Top 5 rows:")
    print(district_risk_df.head())
    
    # Display columns for verification
    print("\nColumns in district_risk_df:")
    print(district_risk_df.columns.tolist())

if __name__ == "__main__":
    main()
