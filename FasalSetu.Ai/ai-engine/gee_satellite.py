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
        1. Authentication Engine: Configure ee.Initialize() using service accounts.
        """
        try:
            import os
            if config.GEE_SERVICE_ACCOUNT and config.GEE_KEY_FILE:
                if not os.path.exists(config.GEE_KEY_FILE):
                    logger.error(f"GEE Key file not found at: {config.GEE_KEY_FILE}")
                    return

                logger.info(f"Authenticating GEE using service account: {config.GEE_SERVICE_ACCOUNT}")
                credentials = ee.ServiceAccountCredentials(config.GEE_SERVICE_ACCOUNT, config.GEE_KEY_FILE)
                ee.Initialize(credentials, project=config.GEE_PROJECT_ID)
            else:
                logger.info(f"Initializing GEE with project: {config.GEE_PROJECT_ID}")
                ee.Initialize(project=config.GEE_PROJECT_ID)
            logger.info("GEE successfully initialized.")
        except Exception as e:
            logger.error(f"GEE Authentication failure: {type(e).__name__}: {e}")

    def get_satellite_deltas(self, latitude: float, longitude: float, claim_date: date):
        """
        Extracts Delta-NDVI, Delta-NDWI, and Delta-SAR backscatter for a coordinate.
        """
        # 1. Coordinate Validation
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            logger.error(f"Invalid coordinates: lat={latitude}, lon={longitude}")
            return None, None, None

        logger.info(f"Fetching satellite data for Lat: {latitude}, Lon: {longitude}, Date: {claim_date}")
        pt = ee.Geometry.Point([longitude, latitude])
        
        pre_start = (claim_date - timedelta(days=config.PRE_EVENT_DAYS)).strftime("%Y-%m-%d")
        pre_end = claim_date.strftime("%Y-%m-%d")
        post_start = claim_date.strftime("%Y-%m-%d")
        post_end = (claim_date + timedelta(days=config.POST_EVENT_DAYS)).strftime("%Y-%m-%d")

        logger.info(f"Query windows: Pre=[{pre_start} to {pre_end}], Post=[{post_start} to {post_end}]")
        
        delta_ndvi = None
        delta_ndwi = None
        delta_sar = None
        
        # 2 & 3. Optical (Sentinel-2) for NDVI/NDWI
        s2_col = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
                   .filterBounds(pt) \
                   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', config.GEE_MAX_CLOUD_COVER))
               
        try:
            pre_s2 = s2_col.filterDate(pre_start, pre_end)
            post_s2 = s2_col.filterDate(post_start, post_end)
            
            pre_size = pre_s2.size().getInfo()
            post_size = post_s2.size().getInfo()
            
            if pre_size > 0 and post_size > 0:
                logger.info(f"Sentinel-2 images found: Pre={pre_size}, Post={post_size}")
                pre_img = pre_s2.median()
                post_img = post_s2.median()
                
                # NDVI = (NIR - Red) / (NIR + Red) 
                pre_ndvi_img = pre_img.normalizedDifference(['B8', 'B4'])
                post_ndvi_img = post_img.normalizedDifference(['B8', 'B4'])
                
                # NDWI = (Green - NIR) / (Green + NIR)
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
                
                logger.info(f"Optical deltas extracted: NDVI={delta_ndvi}, NDWI={delta_ndwi}")
            else:
                logger.warning(f"Sentinel-2 imagery missing for date range. Pre={pre_size}, Post={post_size}")
                
        except Exception as e:
            logger.error(f"Error processing Optical (S2) data: {e}", exc_info=True)

        # 4. Weather Resilience (SAR - Sentinel-1)
        s1 = ee.ImageCollection("COPERNICUS/S1_GRD") \
               .filterBounds(pt) \
               .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) \
               .filter(ee.Filter.eq('instrumentMode', 'IW')) \
               .select('VV')

        try:
            pre_s1 = s1_col.filterDate(pre_start, pre_end)
            post_s1 = s1_col.filterDate(post_start, post_end)
            
            pre_s1_size = pre_s1.size().getInfo()
            post_s1_size = post_s1.size().getInfo()
            
            if pre_s1_size > 0 and post_s1_size > 0:
                logger.info(f"Sentinel-1 images found: Pre={pre_s1_size}, Post={post_s1_size}")
                pre_sar = pre_s1.median()
                post_sar = post_s1.median()
                
                # Sentinel-1 resolution is typically 10m
                pre_sar_val = pre_sar.reduceRegion(ee.Reducer.mean(), pt, 10).get('VV').getInfo()
                post_sar_val = post_sar.reduceRegion(ee.Reducer.mean(), pt, 10).get('VV').getInfo()
                
                if pre_sar_val is not None and post_sar_val is not None:
                    delta_sar = post_sar_val - pre_sar_val
                
                logger.info(f"SAR delta extracted: {delta_sar}")
            else:
                 logger.warning(f"Sentinel-1 imagery missing for date range. Pre={pre_s1_size}, Post={post_s1_size}")

        except Exception as e:
            logger.error(f"Error processing SAR (S1) data: {e}", exc_info=True)

        return delta_ndvi, delta_ndwi, delta_sar

# Export a configured singleton
gee_instance = GEESatelliteCore()
