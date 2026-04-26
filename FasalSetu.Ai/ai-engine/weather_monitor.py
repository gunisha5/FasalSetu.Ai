"""
weather_monitor.py — Real-Time Weather Monitoring Layer

Fetches current weather conditions from OpenWeatherMap API using farm coordinates.
Acts as an intermediate validation layer between Historical CSV checks and GEE
satellite extraction.

Inserted in the pipeline:
  Historical Validator → [Weather Monitor] → GEE Satellite Core → ML/Rule Engine

If the API is unavailable or the key is missing, all weather risk flags default
to None so that the remaining pipeline continues gracefully.
"""

import logging
import requests
from dataclasses import dataclass, field
from typing import Optional
import config

logger = logging.getLogger("fasalsetu.weather_monitor")

# ── Data Structures ───────────────────────────────────────────────────────────

@dataclass
class WeatherIndicators:
    """
    Structured output of the weather monitor.
    All fields are Optional — None means data was unavailable.
    """
    weather_flood_risk:   Optional[bool]  = None   # True if rainfall > flood threshold
    weather_drought_risk: Optional[bool]  = None   # True if rainfall < drought threshold
    rainfall_mm:          Optional[float] = None   # Precipitation in last hour (mm)
    rainfall_3h_mm:       Optional[float] = None   # Precipitation in last 3 hours (mm)
    temperature:          Optional[float] = None   # Temperature in °C
    humidity:             Optional[int]   = None   # Relative humidity in %
    weather_available:    bool            = False  # Set True when API returns valid data
    weather_description:  Optional[str]   = None   # Human-readable weather summary


# ── Monitor Class ─────────────────────────────────────────────────────────────

class WeatherMonitor:
    """
    Fetches and interprets real-time weather data from OpenWeatherMap.

    Uses the /weather (current) endpoint for immediate conditions and
    /forecast for extended rainfall accumulation estimation.
    """

    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

    def __init__(self):
        self.api_key = config.OPENWEATHER_API_KEY
        if not self.api_key:
            logger.warning(
                "OPENWEATHER_API_KEY is not set. Weather monitor will run in "
                "degraded mode — all weather signals will be None."
            )

    def fetch(self, latitude: float, longitude: float) -> WeatherIndicators:
        """
        Primary entry-point: fetch weather data for a coordinate pair.
        """
        indicators = WeatherIndicators()

        if not self.api_key:
            logger.info("Skipping weather fetch — no API key configured.")
            return indicators

        try:
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": "metric",
            }
            response = requests.get(
                self.BASE_URL,
                params=params,
                timeout=config.WEATHER_API_TIMEOUT_SECS,
            )
            response.raise_for_status()
            data = response.json()

            # 1. Print full API response (as requested)
            print("Full Weather Response:", data)

            indicators = self._parse(data)
            logger.info("Weather fetch success.")

        except Exception as e:
            logger.error("Weather fetch error: %s", e)

        return indicators

    def _parse(self, data: dict) -> WeatherIndicators:
        """
        Parse the raw OpenWeatherMap /weather JSON response into WeatherIndicators.
        """
        # 2. Extract rainfall correctly (as requested)
        rain_block = data.get("rain", {})
        rainfall_current = rain_block.get("1h") or rain_block.get("3h") or 0
            
        # 3. Add debug (as requested)
        print("Rainfall extracted:", rainfall_current)

        main_block = data.get("main", {})
        temperature = main_block.get("temp")
        humidity    = main_block.get("humidity")

        weather_desc = ""
        weather_list = data.get("weather", [])
        if weather_list:
            weather_desc = weather_list[0].get("description", "")

        # ── Risk Assessment ──────────────────────────────────────────────────
        weather_flood_risk = float(rainfall_current) >= config.WEATHER_FLOOD_RAIN_THRESHOLD_MM

        weather_drought_risk = (
            (humidity is not None and humidity <= config.WEATHER_DROUGHT_HUMIDITY_MAX)
            and float(rainfall_current) <= config.WEATHER_DROUGHT_RAIN_MAX_MM
        )

        return WeatherIndicators(
            weather_flood_risk=weather_flood_risk,
            weather_drought_risk=weather_drought_risk,
            rainfall_mm=round(float(rainfall_current), 2),
            rainfall_3h_mm=round(float(rain_block.get("3h", 0)), 2),
            temperature=round(temperature, 1) if temperature is not None else None,
            humidity=int(humidity) if humidity is not None else None,
            weather_available=True,
            weather_description=weather_desc,
        )


# ── Singleton ─────────────────────────────────────────────────────────────────
weather_monitor_instance = WeatherMonitor()
