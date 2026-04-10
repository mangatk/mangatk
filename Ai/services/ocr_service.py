"""
OCR Service
============
Extracts text from manga speech bubbles using manga-ocr (Japanese)
and EasyOCR (other languages).
"""

import re
import numpy as np
import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)


class OCRService:
    """Extracts text from cropped bubble images."""

    _instance: Optional['OCRService'] = None

    def __init__(self):
        from manga_ocr import MangaOcr
        import easyocr

        logger.info("Loading OCR models (manga-ocr + easyocr)...")
        self.manga_ocr = MangaOcr()
        self.easyocr_reader = easyocr.Reader(['ja', 'en'])
        logger.info("✅ OCR models loaded.")

    @classmethod
    def get_instance(cls) -> 'OCRService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def extract_text(self, bubble_crop: np.ndarray, source_lang: str = 'ja') -> str:
        """
        Extract text from a cropped bubble image.

        Args:
            bubble_crop: BGR/RGB numpy array of the cropped bubble region.
            source_lang: Source language code ('ja', 'en', etc.)

        Returns:
            Extracted text string, or empty string if extraction fails.
        """
        try:
            if source_lang == 'ja':
                roi_pil = Image.fromarray(bubble_crop)
                text = self.manga_ocr(roi_pil)
            else:
                detections = self.easyocr_reader.readtext(bubble_crop)
                text = " ".join([t[1] for t in detections])

            return text.strip()
        except Exception as e:
            logger.warning(f"OCR extraction failed: {e}")
            return ""

    def get_text_mask_regions(self, bubble_crop: np.ndarray) -> list:
        """
        Get text bounding polygons for mask generation (used by inpainter).

        Args:
            bubble_crop: BGR/RGB numpy array of the cropped bubble region.

        Returns:
            List of (bbox_points, text) tuples from EasyOCR paragraph detection.
        """
        try:
            detections = self.easyocr_reader.readtext(
                bubble_crop,
                paragraph=True,
                link_threshold=0.3,
                low_text=0.3
            )
            return detections
        except Exception as e:
            logger.warning(f"Text region detection failed: {e}")
            return []

    @staticmethod
    def is_valid_source_text(text: str, source_lang: str) -> bool:
        """
        Validate that extracted text is meaningful (not noise/artifacts).

        Args:
            text: Extracted text to validate.
            source_lang: Source language code.

        Returns:
            True if text appears to be valid source language text.
        """
        if not text or len(text.strip()) == 0:
            return False

        if source_lang == 'ja':
            clean_text = re.sub(r'[^\w\s]', '', text).replace(" ", "")
            if len(clean_text) == 0:
                return False

            jp_chars = re.findall(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', text)
            jp_count = len(jp_chars)

            if len(clean_text) <= 2 and jp_count > 0:
                return True

            ratio = jp_count / len(clean_text)
            return ratio > 0.3

        elif source_lang == 'en':
            en_chars = re.findall(r'[a-zA-Z]', text)
            return len(en_chars) > 0

        return True
