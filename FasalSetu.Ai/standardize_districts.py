import pandas as pd
import re

def clean_district(name):
    if pd.isna(name):
        return None
    
    # 1. Lowercase and strip
    name = str(name).lower().strip()
    
    # 2. Blacklist of invalid entries/phrases
    blacklist = [
        'affected', 'adjoining areas', 'various districts', 
        'parts of', 'and parts', 'district', 'districts'
    ]
    for b in blacklist:
        name = name.replace(b, '').strip()
            
    # 3. Remove symbols and numbers
    name = re.sub(r'[^a-z\s]', '', name).strip()
    
    # 4. Filter out purely numeric or too short strings
    if not name or len(name) < 3 or name.isdigit():
        return None
        
    return name

def process_dataset(path, district_col, name):
    print(f"\nProcessing {name}...")
    df = pd.read_csv(path)
    
    # Special handling for Flood Inventory (comma separated)
    if name == "Flood Inventory":
        # Extract individual districts from comma separated strings
        df[district_col] = df[district_col].astype(str).str.split(r'\s*,\s*')
        df = df.explode(district_col)
    
    # Apply cleaning
    df['clean_district'] = df[district_col].apply(clean_district)
        
    # Drop invalid and get unique
    unique_districts = df['clean_district'].dropna().unique().tolist()
    unique_districts = sorted([str(d) for d in unique_districts])
    
    print(f"Cleaned unique districts in {name}: {len(unique_districts)}")
    return set(unique_districts)

def main():
    datasets = [
        (r"C:\Users\manya\Downloads\FasalSetu.Ai\FasalSetu.Ai\ICRISAT-District Level Data.csv", "Dist Name", "ICRISAT"),
        ("District_FloodedArea.csv", "Dist_Name", "Flooded Area"),
        ("India_Flood_Inventory_v3.csv", "Districts", "Flood Inventory")
    ]
    
    all_clean_districts = set()
    
    for path, col, name in datasets:
        try:
            cleaned = process_dataset(path, col, name)
            all_clean_districts.update(cleaned)
        except Exception as e:
            print(f"Error processing {name}: {e}")
            
    print("\n" + "="*40)
    print("MASTER LIST OF CLEANED DISTRICT NAMES (Sample 50):")
    master_list = sorted(list(all_clean_districts))
    print(master_list[:50])
    print(f"\nTotal Unique Standardized Districts: {len(master_list)}")

if __name__ == "__main__":
    main()
