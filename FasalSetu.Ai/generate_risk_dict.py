import pandas as pd
import json

def main():
    print("Converting Risk Dataframe to O(1) Lookup Dictionary...")
    
    # 1. Load the final dataset
    path = "ai-engine/data/district_risk_dataset.csv"
    try:
        df = pd.read_csv(path)
    except FileNotFoundError:
        print(f"Error: {path} not found. Run create_final_dataset.py first.")
        return
        
    # 2. Conversion Logic
    # We set 'district' as the index and convert the remaining columns to a dictionary
    # 'index' orient creates the {index: {col: value}} structure requested
    risk_dict = df.set_index('district')[['flood_risk', 'drought_risk']].to_dict(orient='index')
    
    # 3. Demonstration
    sample_district = "adilabad"
    if sample_district in risk_dict:
        print(f"\nLookup Success [{sample_district}]:")
        print(json.dumps(risk_dict[sample_district], indent=2))
    
    # 4. Save as JSON for backend caching (optional but good practice)
    output_path = "ai-engine/data/district_risk_lookup.json"
    with open(output_path, 'w') as f:
        json.dump(risk_dict, f, indent=2)
        
    print(f"\n✅ Dictionary conversion complete. Total districts indexed: {len(risk_dict)}")
    print(f"Dictionary cache saved to: {output_path}")

if __name__ == "__main__":
    main()
