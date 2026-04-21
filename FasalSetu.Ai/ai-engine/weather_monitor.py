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

        Parameters
        ----------
        latitude  : float — Farm latitude
        longitude : float — Farm longitude

        Returns
        -------
        WeatherIndicators dataclass (with weather_available=False on any error)
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
                "units": "metric",   # Temperatures in °C
            }
            response = requests.get(
                self.BASE_URL,
                params=params,
                timeout=config.WEATHER_API_TIMEOUT_SECS,
            )
            response.raise_for_status()
            data = response.json()

            indicators = self._parse(data)
            logger.info(
                "Weather fetch success | temp=%.1f°C humidity=%d%% "
                "rain_1h=%.2fmm flood_risk=%s drought_risk=%s",
                indicators.temperature or 0.0,
                indicators.humidity or 0,
                indicators.rainfall_mm or 0.0,
                indicators.weather_flood_risk,
                indicators.weather_drought_risk,
            )

        except requests.exceptions.Timeout:
            logger.warning("OpenWeatherMap API timed out. Continuing without weather data.")
        except requests.exceptions.HTTPError as e:
            logger.warning("OpenWeatherMap HTTP error: %s. Continuing without weather data.", e)
        except requests.exceptions.ConnectionError:
            logger.warning("Cannot reach OpenWeatherMap (network error). Continuing without weather data.")
        except Exception as e:
            logger.error("Unexpected weather fetch error: %s", e, exc_info=True)

        return indicators

    def _parse(self, data: dict) -> WeatherIndicators:
        """
        Parse the raw OpenWeatherMap /weather JSON response into WeatherIndicators.
        """
        # Rainfall — OWM exposes rain.1h and rain.3h (mm).  Both are optional fields.
        rain_block = data.get("rain", {})
        rainfall_1h  = rain_block.get("1h", 0.0)
        rainfall_3h  = rain_block.get("3h", 0.0)

        main_block = data.get("main", {})
        temperature = main_block.get("temp")
        humidity    = main_block.get("humidity")

        weather_desc = ""
        weather_list = data.get("weather", [])
        if weather_list:
            weather_desc = weather_list[0].get("description", "")

        # ── Risk Assessment ──────────────────────────────────────────────────
        # Flood risk: 1-hour rainfall exceeds configurable threshold
        weather_flood_risk = rainfall_1h >= config.WEATHER_FLOOD_RAIN_THRESHOLD_MM

        # Drought risk proxy: humidity below minimum AND rainfall essentially zero
        weather_drought_risk = (
            (humidity is not None and humidity <= config.WEATHER_DROUGHT_HUMIDITY_MAX)
            and rainfall_1h <= config.WEATHER_DROUGHT_RAIN_MAX_MM
        )

        return WeatherIndicators(
            weather_flood_risk=weather_flood_risk,
            weather_drought_risk=weather_drought_risk,
            rainfall_mm=round(rainfall_1h, 2),
            rainfall_3h_mm=round(rainfall_3h, 2),
            temperature=round(temperature, 1) if temperature is not None else None,
            humidity=int(humidity) if humidity is not None else None,
            weather_available=True,
            weather_description=weather_desc,
        )


# ── Singleton ─────────────────────────────────────────────────────────────────
weather_monitor_instance = WeatherMonitor()
