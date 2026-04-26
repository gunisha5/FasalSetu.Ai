import pandas as pd
import re

def clean_district_string(text):
    if pd.isna(text):
        return None
    
    # Standardize to lowercase and strip
    text = str(text).lower().strip()
    
    # 1. Remove phrases like "parts of", "various parts of", "districts of"
    text = re.sub(r'(&\s*)?(various\s+)?parts\s+of\s+', '', text)
    text = re.sub(r'\d+\s+districts?\s+(of\s+)?', '', text)
    
    # 2. Remove purely numeric counts like "11 districts"
    if re.match(r'^\d+\s+districts?$', text):
        return None
    
    # 3. Remove leading/trailing symbols and numbers
    text = re.sub(r'^[^a-z]+', '', text)
    text = re.sub(r'[^a-z]+$', '', text)
    
    # 4. Final strip
    text = text.strip()
    
    # If the remaining string is too short or just a number, it's likely noise
    if len(text) < 2 or text.isdigit():
        return None
        
    return text

def main():
    print("Starting Deep Clean of District Dataset...")
    
    # Load the current dataset
    input_path = 'ai-engine/data/district_risk_dataset.csv'
    try:
        df = pd.read_csv(input_path)
    except FileNotFoundError:
        print(f"Error: {input_path} not found.")
        return
    
    # Apply cleaning
    df['clean_district'] = df['district'].apply(clean_district_string)
    
    # Drop rows that couldn't be cleaned (noise)
    df_clean = df.dropna(subset=['clean_district']).copy()
    
    # Update the district column with the clean version
    df_clean['district'] = df_clean['clean_district']
    
    # Drop the helper column and any other noise
    df_final = df_clean.drop(columns=['clean_district'])
    
    # Drop state if it's purely numeric or noisy
    if 'state' in df_final.columns:
        df_final['state'] = df_final['state'].astype(str).str.lower().str.strip()
    
    # Group by clean district name to handle duplicates created by cleaning
    # (e.g. "& parts of assam" and "assam" both becoming "assam")
    # Identify numeric columns for mean aggregation
    numeric_cols = df_final.select_dtypes(include=['number']).columns.tolist()
    df_final = df_final.groupby('district')[numeric_cols].mean().reset_index()
    
    # Save the cleaned dataset
    output_path = 'ai-engine/data/district_risk_dataset_clean.csv'
    df_final.to_csv(output_path, index=False)
    
    # Overwrite the original for the service to use
    df_final.to_csv(input_path, index=False)
    
    print(f"Cleaning complete. Records processed: {len(df_final)}")
    print("\nSample Cleaned Districts:")
    print(df_final['district'].head(10).tolist())

if __name__ == "__main__":
    main()
