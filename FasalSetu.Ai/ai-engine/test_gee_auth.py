import ee
import config
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fasalsetu.gee_test")

def test_gee():
    print("--- FasalSetu GEE Diagnostic Tool ---")
    print(f"Service Account: {config.GEE_SERVICE_ACCOUNT}")
    print(f"Key File: {config.GEE_KEY_FILE}")
    print(f"Project ID: {config.GEE_PROJECT_ID}")
    
    if not os.path.exists(config.GEE_KEY_FILE):
        print(f"ERROR: Key file NOT FOUND at {config.GEE_KEY_FILE}")
        return

    try:
        credentials = ee.ServiceAccountCredentials(config.GEE_SERVICE_ACCOUNT, config.GEE_KEY_FILE)
        ee.Initialize(credentials, project=config.GEE_PROJECT_ID)
        print("SUCCESS: GEE Initialization successful!")
        
        # Test a simple query
        print("Testing dataset access (Sentinel-2)...")
        pt = ee.Geometry.Point([77.5946, 12.9716]) # Bangalore
        col = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").filterBounds(pt).limit(1)
        size = col.size().getInfo()
        print(f"SUCCESS: Found {size} image(s) in collection.")
        
    except Exception as e:
        print(f"FAILURE: GEE test failed: {e}")

if __name__ == "__main__":
    test_gee()
