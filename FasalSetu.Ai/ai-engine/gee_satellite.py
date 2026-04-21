"""
gee_satellite.py — Phase 3: Satellite Geospatial Core

Extracts specific micro-level features (NDVI, NDWI, SAR) using Google Earth Engine
from the coordinates of a farm.
"""

import ee
import logging
from datetime import date, timedelta
import config

logger = logging.getLogger("fasalsetu.gee_satellite")

class GEESatelliteCore:
    def __init__(self):
        """Initializes the Phase 3 feature extraction logic."""
        self._authenticate()
        
    def _authenticate(self):
        """
        1. Authentication Engine: Configure ee.Authenticate() and ee.Initialize()
        using service accounts or local tokens safely.
        """
        try:
            if config.GEE_SERVICE_ACCOUNT and config.GEE_KEY_FILE:
                logger.info(f"Authenticating GEE using service account: {config.GEE_SERVICE_ACCOUNT}")
                credentials = ee.ServiceAccountCredentials(config.GEE_SERVICE_ACCOUNT, config.GEE_KEY_FILE)
                ee.Initialize(credentials, project=config.GEE_PROJECT_ID)
            else:
                logger.info(f"Initializing GEE with project: {config.GEE_PROJECT_ID}")
                # For interactive auth (ee.Authenticate), we must pass the project ID here
                ee.Initialize(project=config.GEE_PROJECT_ID)
            logger.info("GEE successfully initialized.")
        except Exception as e:
            logger.error(f"GEE Authentication failed: {e}. Please configure GEE credentials.")
            # Depending on use case we might not raise to prevent app crash on boot
            # raise e

    def get_satellite_deltas(self, latitude: float, longitude: float, claim_date: date):
        """
        Extracts Delta-NDVI, Delta-NDWI, and Delta-SAR backscatter for a coordinate.
        """
        pt = ee.Geometry.Point([longitude, latitude])
        
        pre_start = (claim_date - timedelta(days=config.PRE_EVENT_DAYS)).strftime("%Y-%m-%d")
        pre_end = claim_date.strftime("%Y-%m-%d")
        post_start = claim_date.strftime("%Y-%m-%d")
        post_end = (claim_date + timedelta(days=config.POST_EVENT_DAYS)).strftime("%Y-%m-%d")
        
        delta_ndvi = None
        delta_ndwi = None
        delta_sar = None
        
        # 2 & 3. Optical (Sentinel-2) for NDVI/NDWI
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
               .filterBounds(pt) \
               .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80))
               
        try:
            pre_img = s2.filterDate(pre_start, pre_end).median()
            post_img = s2.filterDate(post_start, post_end).median()
            
            # NDVI = (NIR - Red) / (NIR + Red) 
            # Sentinel-2: NIR is B8, Red is B4
            pre_ndvi_img = pre_img.normalizedDifference(['B8', 'B4'])
            post_ndvi_img = post_img.normalizedDifference(['B8', 'B4'])
            
            # NDWI = (Green - NIR) / (Green + NIR)
            # Sentinel-2: Green is B3, NIR is B8
            pre_ndwi_img = pre_img.normalizedDifference(['B3', 'B8'])
            post_ndwi_img = post_img.normalizedDifference(['B3', 'B8'])
            
            # Extract values precisely at point (scale 10m for S2)
            pre_ndvi_val = pre_ndvi_img.reduceRegion(ee.Reducer.mean(), pt, 10).get('nd').getInfo()
            post_ndvi_val = post_ndvi_img.reduceRegion(ee.Reducer.mean(), pt, 10).get('nd').getInfo()
            
            pre_ndwi_val = pre_ndwi_img.reduceRegion(ee.Reducer.mean(), pt, 10).get('nd').getInfo()
            post_ndwi_val = post_ndwi_img.reduceRegion(ee.Reducer.mean(), pt, 10).get('nd').getInfo()
            
            if pre_ndvi_val is not None and post_ndvi_val is not None:
                delta_ndvi = post_ndvi_val - pre_ndvi_val
            
            if pre_ndwi_val is not None and post_ndwi_val is not None:
                delta_ndwi = post_ndwi_val - pre_ndwi_val
                
        except Exception as e:
            logger.warning(f"Error processing Optical (S2) data (cloud coverage or auth issue): {e}")

        # 4. Weather Resilience (SAR - Sentinel-1)
        s1 = ee.ImageCollection("COPERNICUS/S1_GRD") \
               .filterBounds(pt) \
               .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) \
               .filter(ee.Filter.eq('instrumentMode', 'IW')) \
               .select('VV')

        try:
            pre_sar = s1.filterDate(pre_start, pre_end).median()
            post_sar = s1.filterDate(post_start, post_end).median()
            
            # Sentinel-1 resolution is typically 10m
            pre_sar_val = pre_sar.reduceRegion(ee.Reducer.mean(), pt, 10).get('VV').getInfo()
            post_sar_val = post_sar.reduceRegion(ee.Reducer.mean(), pt, 10).get('VV').getInfo()
            
            if pre_sar_val is not None and post_sar_val is not None:
                # Decrease in VV backscatter indicates potential flooding
                delta_sar = post_sar_val - pre_sar_val
        except Exception as e:
            logger.warning(f"Error processing SAR (S1) data: {e}")

        return delta_ndvi, delta_ndwi, delta_sar

# Export a configured singleton
gee_instance = GEESatelliteCore()
