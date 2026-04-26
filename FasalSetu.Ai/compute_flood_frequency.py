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
    print("Computing Flood Risk by Frequency...")
    
    # 1. Load Dataset
    path = "India_Flood_Inventory_v3.csv"
    try:
        df = pd.read_csv(path)
    except FileNotFoundError:
        print(f"Error: {path} not found.")
        return
        
    # 2. Extract and Standardize Districts
    # The inventory often has multiple districts in one cell
    df['district_list'] = df['Districts'].astype(str).str.split(r'\s*,\s*')
    df_exploded = df.explode('district_list')
    
    # Apply cleaning
    df_exploded['clean_district'] = df_exploded['district_list'].apply(clean_district)
    
    # Drop invalid entries
    df_clean = df_exploded.dropna(subset=['clean_district'])
    
    # 3. Calculate Frequency
    # Count occurrences per standardized district
    freq_df = df_clean.groupby('clean_district').size().reset_index(name='flood_count')
    
    # 4. Normalize
    if not freq_df.empty:
        max_events = freq_df['flood_count'].max()
        freq_df['flood_risk_freq'] = freq_df['flood_count'] / max_events
        
        # 5. Clean up for output
        freq_df = freq_df.rename(columns={'clean_district': 'district'})
        
        # Sort by risk (descending)
        freq_df = freq_df.sort_values(by='flood_risk_freq', ascending=False)
        
        # Save results
        output_path = "district_flood_frequency.csv"
        freq_df.to_csv(output_path, index=False)
        
        print(f"Frequency analysis complete. Max flood events in a single district: {max_events}")
        print("\nTop 10 High-Frequency Flood Districts:")
        print(freq_df.head(10)[['district', 'flood_count', 'flood_risk_freq']])
    else:
        print("No valid districts found for frequency analysis.")

if __name__ == "__main__":
    main()
