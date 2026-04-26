import requests
import logging
from datetime import timedelta, date

logger = logging.getLogger("fasalsetu.nasa_weather")

def get_historical_weather(latitude: float, longitude: float, claim_date: date):
    """
    Fetches historical rainfall (PRECTOT) and temperature (T2M) from NASA POWER API.
    Window: claim_date - 7 days to claim_date.
    """
    try:
        # Calculate start and end dates
        start_date = claim_date - timedelta(days=7)
        end_date = claim_date

        # Format: YYYYMMDD
        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")

        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            "parameters": "PRECTOTCORR,T2M",
            "community": "AG",
            "longitude": longitude,
            "latitude": latitude,
            "start": start_str,
            "end": end_str,
            "format": "JSON"
        }

        logger.info(f"Fetching NASA Weather for [{latitude}, {longitude}] from {start_str} to {end_str}")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        properties = data.get("properties", {}).get("parameter", {})
        
        rainfall_data = properties.get("PRECTOTCORR", {})
        temp_data = properties.get("T2M", {})

        # Calculate totals/averages
        total_rainfall = sum(rainfall_data.values()) if rainfall_data else 0.0
        avg_temp = (sum(temp_data.values()) / len(temp_data)) if temp_data else 25.0

        return {
            "rainfall_7d": round(total_rainfall, 2),
            "temp_avg": round(avg_temp, 2)
        }

    except Exception as e:
        logger.error("NASA POWER API Error: %s", str(e))
        return {
            "rainfall_7d": 0.0,
            "temp_avg": 25.0 # Default fallback
        }
