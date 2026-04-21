import pandas as pd
import numpy as np
import logging
from datetime import datetime, date
from pathlib import Path
import config

logger = logging.getLogger("fasalsetu.historical_validator")

class HistoricalValidator:
    """
    Phase 2: Historical Ground-Truth Parser.
    Provides rule-based validation using public CSV datasets for Indian districts.
    """

    def __init__(self):
        self.icrisat_df = None
        self.flood_df = None
        self._load_datasets()

    def _load_datasets(self):
        """Load and optimally cache the CSVs into Pandas DataFrames."""
        # Note: In a production setup with GBs of data, these would be in a SQL DB.
        # But for Phase 2 MVP, we load them into memory.

        # 1. Load Flood Inventory
        try:
            # Fixing the path based on previous ls output
            icrisat_path = config.DATA_DIR / "ICRISAT-District Level Data.csv" / "ICRISAT-District Level Data.csv"
            logger.info(f"Loading ICRISAT dataset from {icrisat_path}...")
            self.icrisat_df = pd.read_csv(icrisat_path)
            self.icrisat_df['Dist Name'] = self.icrisat_df['Dist Name'].str.lower().str.strip()
            
            logger.info(f"Loading Flood Inventory from {config.FLOOD_CSV}...")
            self.flood_df = pd.read_csv(config.FLOOD_CSV)
            
            # Normalize dates in flood dataset
            self.flood_df['Start_dt'] = pd.to_datetime(self.flood_df['Start Date'], errors='coerce', format='%d-%m-%Y', exact=False)
            self.flood_df['End_dt'] = pd.to_datetime(self.flood_df['End Date'], errors='coerce', format='%d-%m-%Y', exact=False)
            # Also fill missing End_dt with Start_dt
            self.flood_df['End_dt'] = self.flood_df['End_dt'].fillna(self.flood_df['Start_dt'])
            self.flood_df['Districts'] = self.flood_df['Districts'].astype(str).str.lower()
            
            logger.info("Datasets loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load datasets: {e}")
            self.icrisat_df = pd.DataFrame()
            self.flood_df = pd.DataFrame()

    def validate_flood(self, district: str, claim_date: date) -> bool:
        """
        Query India_Flood_Inventory_v3.csv to verify if a catastrophic 
        flood occurred in the provided district on/around the given date.
        Returns True if a flood match is found.
        """
        if self.flood_df.empty:
            logger.warning("Flood dataframe is missing, skipping validation.")
            return False

        dist_lower = district.lower().strip()
        claim_dt = pd.to_datetime(claim_date)

        # Look for the district string inside the Districts column
        # and see if the claim_date falls between Start_dt and End_dt + padding
        # (Floods have lingering effects, we allow up to 30 days after End_dt)
        matches = self.flood_df[self.flood_df['Districts'].str.contains(dist_lower, na=False)]
        
        for _, row in matches.iterrows():
            start = row['Start_dt']
            end = row['End_dt']
            
            if pd.isna(start) or pd.isna(end):
                continue
                
            # Allow a window (15 days before start, 30 days after end) 
            # to account for reporting delays and lingering flood impact
            window_start = start - pd.Timedelta(days=15)
            window_end = end + pd.Timedelta(days=30)
            
            if window_start <= claim_dt <= window_end:
                logger.info(f"Flood validated for {district} around {claim_date}. Record: {start.date()} to {end.date()}")
                return True
                
        return False

    def validate_drought(self, district: str, crop: str) -> bool:
        """
        Parse ICRISAT data to check year-over-year yield drops for a given district.
        Returns True if historical data indicates severe volatility / drought potential.
        (Since we don't have current real-time yield in the CSV, we look at the historical 
        variance/drops to validate if droughts are *common* here, adding confidence).
        """
        if self.icrisat_df.empty or not crop:
            return False

        dist_lower = district.lower().strip()
        crop_upper = crop.upper().strip()

        # Try to find the corresponding Yield column
        col_name = f"{crop_upper} YIELD (Kg per ha)"
        if col_name not in self.icrisat_df.columns:
            logger.warning(f"Crop '{crop}' yield column not found in ICRISAT data.")
            return False

        # Get district data
        dist_data = self.icrisat_df[self.icrisat_df['Dist Name'] == dist_lower]
        if dist_data.empty:
            logger.warning(f"District '{district}' not found in ICRISAT data.")
            return False

        # Sort by year to calculate YoY drop
        dist_data = dist_data.sort_values(by='Year')
        yields = dist_data[col_name].dropna()
        
        if len(yields) < 2:
            return False

        # Calculate maximum historical year-over-year drop %
        diffs = yields.pct_change()
        max_drop = diffs.min()

        # If historically the district has suffered > 30% yield drops, 
        # it is a drought-prone region which adds weight to satellite drought signals.
        if max_drop < -0.30:
            logger.info(f"Historical drought vulnerability validated for {district} with max drop {max_drop:.0%}")
            return True

        return False

    def get_historical_match(self, district: str, claim_date: date, crop: str, presumed_type: str = "FLOOD") -> bool:
        """
        Main interface function. Returns whether the CSVs support the claim.
        """
        if presumed_type == "FLOOD":
            return self.validate_flood(district, claim_date)
        elif presumed_type == "DROUGHT":
            return self.validate_drought(district, crop)
        return False


# Singleton instance so we don't reload CSVs on every request
validator_instance = HistoricalValidator()
