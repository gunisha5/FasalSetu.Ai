import zipfile
import os
from tqdm import tqdm

def extract_zip(zip_path, extract_dir):
    print(f"Extracting {zip_path} to {extract_dir}...")
    if not os.path.exists(zip_path):
        print(f"File not found: {zip_path}")
        return
    
    os.makedirs(extract_dir, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Get total files for progress bar
        total_files = len(zip_ref.namelist())
        for file in tqdm(zip_ref.namelist(), total=total_files, desc=os.path.basename(zip_path)):
            zip_ref.extract(file, extract_dir)
            
    print(f"Extraction complete for {zip_path}!\n")

if __name__ == "__main__":
    # Define paths relative to the project root
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. STURM-Flood
    sturm_zip = os.path.join(base_dir, "data", "STURM_Flood_Subset", "Dataset.zip")
    sturm_extract = os.path.join(base_dir, "data", "STURM_Flood_Subset", "extracted")
    extract_zip(sturm_zip, sturm_extract)
    
    # 2. HAD-FCDR25
    had_zip = os.path.join(base_dir, "data", "HAD_FCDR25_Subset", "Data- Improved Integrated Framework for Flooded Crop Damage and Recovery.zip")
    had_extract = os.path.join(base_dir, "data", "HAD_FCDR25_Subset", "extracted")
    extract_zip(had_zip, had_extract)
    
    print("All datasets extracted successfully! You can now delete the original .zip files to save space.")
    print("Next step: We can start building the PyTorch model's data loaders (Phase 1.1) or move to the GEE data pipeline (Phase 1.2).")
