import ee
import sys
import os

# Add parent directory to path so we can import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_gee")

def test_connection():
    try:
        print(f"Testing GEE with Project ID: {config.GEE_PROJECT_ID}")
        print(f"Service Account: {config.GEE_SERVICE_ACCOUNT}")
        print(f"Key File: {config.GEE_KEY_FILE}")
        
        credentials = ee.ServiceAccountCredentials(config.GEE_SERVICE_ACCOUNT, config.GEE_KEY_FILE)
        ee.Initialize(credentials, project=config.GEE_PROJECT_ID)
        
        print("GEE Initialized successfully!")
        
        # Test a simple query (Sentinel-2 image)
        pt = ee.Geometry.Point([77.1025, 28.7041]) # Delhi coordinates
        img = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").filterBounds(pt).first()
        info = img.getInfo()
        
        if info:
            print("Successfully fetched a test satellite image!")
            print(f"Image ID: {info['id']}")
        else:
            print("Initialized, but failed to fetch image data.")
            
    except Exception as e:
        print(f"GEE Test failed: {e}")

if __name__ == "__main__":
    test_connection()
