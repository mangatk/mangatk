"""
Inpainter Service
==================
Removes text from manga pages using LaMa (Large Mask Inpainting).
Falls back to CV-based contour detection + color fill if LaMa fails.
"""

import cv2
import numpy as np
import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Mask dilation kernel size — controls how much the text mask is expanded
# before inpainting to ensure clean removal
MASK_DILATION = 7


class InpainterService:
    """Removes text from images. Tries LaMa first, falls back to CV-based method."""

    _instance: Optional['InpainterService'] = None

    def __init__(self):
        self.lama = None
        self._lama_available = False

        try:
            from simple_lama_inpainting import SimpleLama
            logger.info("Loading LaMa inpainting model...")
            self.lama = SimpleLama()
            self._lama_available = True
            logger.info("✅ LaMa inpainting model loaded.")
        except Exception as e:
            logger.warning(
                f"⚠️ LaMa model failed to load: {e}. "
                f"Using CV-based fallback inpainter."
            )

    @classmethod
    def get_instance(cls) -> 'InpainterService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def inpaint(
        self,
        image: Image.Image,
        mask: np.ndarray,
        boxes: np.ndarray = None
    ) -> Image.Image:
        """
        Remove text from image using LaMa or fallback.

        Args:
            image: PIL Image (RGB) of the original page.
            mask: Binary mask (numpy uint8 array, same HxW as image).
                  White (255) = areas to inpaint, Black (0) = keep.
            boxes: Bubble bounding boxes (xyxy). Used by fallback method.

        Returns:
            PIL Image with text removed (inpainted).
        """
        if not np.any(mask):
            logger.info("Empty mask — skipping inpainting.")
            return image.copy()

        # Try LaMa first
        if self._lama_available:
            try:
                kernel = np.ones((MASK_DILATION, MASK_DILATION), np.uint8)
                dilated_mask = cv2.dilate(mask, kernel, iterations=1)
                mask_pil = Image.fromarray(dilated_mask)
                result = self.lama(image, mask_pil)
                return result
            except Exception as e:
                logger.warning(f"⚠️ LaMa inpainting failed: {e}. Using fallback.")

        # Fallback: CV-based method
        if boxes is not None and len(boxes) > 0:
            from .fallback_inpainter import fallback_inpaint_page
            logger.info("Using CV-based fallback inpainter.")
            return fallback_inpaint_page(image, boxes)

        # Last resort: just return original
        logger.warning("No inpainting method available. Returning original image.")
        return image.copy()

    @staticmethod
    def build_text_mask(
        image_shape: tuple,
        boxes: np.ndarray,
        text_regions_per_box: dict,
    ) -> np.ndarray:
        """
        Build a global text mask from detected text regions inside bubbles.

        Args:
            image_shape: (height, width) of the original image.
            boxes: Array of bubble bounding boxes (xyxy format).
            text_regions_per_box: Dict mapping box index to list of
                                  (bbox_points, text) from EasyOCR.

        Returns:
            Binary mask (numpy uint8 array) with text regions marked as 255.
        """
        global_mask = np.zeros(image_shape[:2], dtype=np.uint8)

        for box_idx, detections in text_regions_per_box.items():
            box = boxes[box_idx]
            px1, py1 = int(box[0]), int(box[1])

            for (bbox_pts, _text) in detections:
                pts = np.array(bbox_pts, dtype=np.int32)
                # Offset from crop coordinates to global coordinates
                pts[:, 0] += px1
                pts[:, 1] += py1
                cv2.fillPoly(global_mask, [pts], 255)

                # Flood fill from center to catch interior
                center_x = int(np.mean(pts[:, 0]))
                center_y = int(np.mean(pts[:, 1]))
                try:
                    cv2.floodFill(
                        global_mask, None,
                        (center_x, center_y), 255,
                        loDiff=10, upDiff=10,
                        flags=cv2.FLOODFILL_FIXED_RANGE
                    )
                except Exception:
                    pass

        return global_mask
