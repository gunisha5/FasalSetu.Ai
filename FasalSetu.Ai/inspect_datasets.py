import pandas as pd
import os

def inspect_csv(file_path, name):
    print(f"\n{'='*20} INSPECTING: {name} {'='*20}")
    if not os.path.exists(file_path):
        print(f"ERROR: File not found at {file_path}")
        return
    
    try:
        # Load dataset
        df = pd.read_csv(file_path, nrows=5) 
        full_df = pd.read_csv(file_path, nrows=1) # Get columns only
        
        print(f"Shape (Estimated): {pd.read_csv(file_path).shape}")
        print("\nColumns (Total count: {}):".format(len(full_df.columns)))
        # For ICRISAT, just show a few key ones or search
        cols = full_df.columns.tolist()
        
        print("\nFirst 5 Rows:")
        print(df.head())
        
        # Identification Logic
        district_col = [c for c in cols if any(k in c.lower() for k in ['district', 'dist_name', 'districts'])]
        rainfall_col = [c for c in cols if any(k in c.lower() for k in ['rain', 'precip'])]
        irrigation_col = [c for c in cols if any(k in c.lower() for k in ['irrig'])]
        flooded_area_col = [c for c in cols if any(k in c.lower() for k in ['flood', 'flooded']) and 'area' in c.lower()]
        flood_event_col = [c for c in cols if any(k in c.lower() for k in ['flood', 'event', 'cause'])]
        
        print("\nIdentification Candidates:")
        print(f"- District Columns: {district_col}")
        print(f"- Rainfall Columns: {rainfall_col}")
        print(f"- Irrigation Columns: {irrigation_col}")
        print(f"- Flooded Area Columns: {flooded_area_col}")
        print(f"- Potential Event Indicators: {flood_event_col}")
        
    except Exception as e:
        print(f"Error loading {name}: {e}")

def main():
    files = {
        "ICRISAT": r"C:\Users\manya\Downloads\FasalSetu.Ai\FasalSetu.Ai\ICRISAT-District Level Data.csv",
        "FloodedArea": "District_FloodedArea.csv",
        "FloodInventory": "India_Flood_Inventory_v3.csv"
    }
    
    for name, path in files.items():
        inspect_csv(path, name)

if __name__ == "__main__":
    main()
