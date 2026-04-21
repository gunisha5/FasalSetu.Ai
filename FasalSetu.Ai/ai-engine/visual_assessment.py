"""
visual_assessment.py — Core Visual Analysis Layer

Performs scientific color-histogram analysis on field photos to detect
signatures of drought (low green, high brown/yellow) or flood (high blue/muddy).
"""

import io
import base64
import logging
from PIL import Image
import numpy as np

logger = logging.getLogger("fasalsetu.visual_assessment")

class VisualAssessmentEngine:
    """
    Analyzes claim photos using colorimetric signatures.
    
    Sigantures:
    - Drought: High ratio of straw/brown (burnt vegetation).
    - Flood: Detection of water/mud reflective indices in standard RGB.
    """

    def analyze_from_base64(self, b64_string: str):
        """Main entry point for analysis via API."""
        try:
            # Strip header if present (e.g. data:image/png;base64,)
            if "," in b64_string:
                b64_string = b64_string.split(",")[1]
            
            img_data = base64.b64decode(b64_string)
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            
            # Resize for performance
            img.thumbnail((300, 300))
            
            return self.analyze_image(img)
        except Exception as e:
            logger.error(f"Visual analysis failed: {e}")
            return None, None

    def analyze_image(self, img: Image.Image):
        """
        Performs RGB histogram analysis to determine drought/flood scores.
        Returns (flood_score, drought_score) in 0.0–1.0.
        """
        arr = np.array(img)
        
        # 1. Normalize and flatten
        r = arr[:, :, 0].flatten() / 255.0
        g = arr[:, :, 1].flatten() / 255.0
        b = arr[:, :, 2].flatten() / 255.0
        
        # 2. Drought Signature: High R/G relative to B (Brown/Yellow)
        # Healthy green has high G. Dead crops have R and G close (Yellow) or higher R (Brown).
        # We look for pixels where R > 0.4 and G > 0.4 and B < 0.3
        drought_pixels = np.sum((r > 0.4) & (g > 0.4) & (b < 0.4))
        drought_ratio = drought_pixels / len(r)
        
        # 3. Flood Signature: High B or dark gray/muddy
        # Water/Mud usually has higher B relative to G/R, or very low overall brightness
        flood_pixels = np.sum((b > r) & (b > g) & (b > 0.2)) + np.sum((r < 0.2) & (g < 0.2) & (b < 0.2))
        flood_ratio = flood_pixels / len(r)
        
        # 4. Calibration
        # We multiply by a factor to make the score representative
        drought_score = min(1.0, drought_ratio * 2.5)
        flood_score = min(1.0, (flood_ratio * 1.5))
        
        logger.info(f"Visual Analysis → drought_score={drought_score:.3f} flood_score={flood_score:.3f}")
        return flood_score, drought_score

# Singleton
visual_processor = VisualAssessmentEngine()
