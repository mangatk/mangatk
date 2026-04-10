"""
Fallback Inpainter Service
=============================
CV-based text removal using contour detection, solidity analysis,
and dominant color fill. Used as a backup when LaMa inpainting fails.

This does NOT use any ML model — it uses OpenCV algorithms:
  - Adaptive thresholding to detect shapes
  - Contour analysis with solidity to distinguish bubbles from panels
  - Connected component analysis to separate border lines from text
  - Dominant color fill to erase text cleanly
"""

import cv2
import numpy as np
import logging
from PIL import Image
from typing import Tuple

logger = logging.getLogger(__name__)

# Configuration
PADDING = 10
LARGE_MARGIN = 14
SMALL_MARGIN = 2
SOLIDITY_THRESHOLD = 0.70


def get_dominant_color(image_roi: np.ndarray, mask: np.ndarray = None) -> Tuple[int, int, int]:
    """
    Get the dominant (background) color of an ROI.
    If background is bright, forces pure white for a clean look.
    """
    if mask is not None:
        masked_pixels = image_roi[mask == 255]
        if len(masked_pixels) == 0:
            return (255, 255, 255)
        median_color = np.median(masked_pixels, axis=0)
    else:
        median_color = np.median(image_roi, axis=(0, 1))

    if np.mean(median_color) > 200:
        return (255, 255, 255)
    return tuple(map(int, median_color))


def fallback_inpaint_page(image: Image.Image, boxes: np.ndarray) -> Image.Image:
    """
    Remove text from detected speech bubbles using CV-based methods.
    No ML model required — uses contour detection + color fill.

    Args:
        image: PIL Image (RGB) of the manga page.
        boxes: Array of bubble bounding boxes in xyxy format (int).

    Returns:
        PIL Image with text removed from bubbles.
    """
    original_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    H, W = original_cv.shape[:2]
    final_cv = original_cv.copy()

    for box in boxes:
        x1, y1, x2, y2 = box

        # Add padding
        x1 = max(0, x1 - PADDING)
        y1 = max(0, y1 - PADDING)
        x2 = min(W, x2 + PADDING)
        y2 = min(H, y2 + PADDING)

        roi = final_cv[y1:y2, x1:x2]
        roi_h, roi_w = roi.shape[:2]
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # Detection logic
        gray_thick = cv2.erode(gray, np.ones((2, 2), np.uint8), iterations=1)
        blurred = cv2.GaussianBlur(gray_thick, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(
            blurred, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 15, 3
        )
        cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not cnts:
            continue

        largest_cnt = max(cnts, key=cv2.contourArea)
        area = cv2.contourArea(largest_cnt)
        roi_area = roi_w * roi_h

        # Leaky check: contour covers >90% of the box → detected box, not bubble
        is_leaky = area > (0.90 * roi_area)

        # =============================================================
        # PATH A: Leaky/Border Bubbles — general purpose fix
        # =============================================================
        if is_leaky:
            bg_color = np.median(roi, axis=(0, 1)).astype(np.uint8)

            # Difference mask — find "ink" of any color
            diff = cv2.absdiff(roi, bg_color)
            diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
            _, ink_mask = cv2.threshold(diff_gray, 30, 255, cv2.THRESH_BINARY)

            # Filter blobs — keep borders, remove text
            num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
                ink_mask, connectivity=8
            )
            text_mask = np.zeros_like(gray, dtype=np.uint8)

            for i in range(1, num_labels):
                x_blob = stats[i, cv2.CC_STAT_LEFT]
                y_blob = stats[i, cv2.CC_STAT_TOP]
                w_blob = stats[i, cv2.CC_STAT_WIDTH]
                h_blob = stats[i, cv2.CC_STAT_HEIGHT]

                # Does it touch the padding edge?
                touches_edge = (
                    x_blob <= 1 or y_blob <= 1 or
                    x_blob + w_blob >= roi_w - 1 or
                    y_blob + h_blob >= roi_h - 1
                )

                if not touches_edge:
                    # Floating inside → it is text → remove it
                    text_mask[labels == i] = 255

            # Clean & fill
            text_mask = cv2.dilate(text_mask, np.ones((3, 3), np.uint8), iterations=1)
            fill_color = get_dominant_color(roi, cv2.bitwise_not(ink_mask))
            roi[text_mask == 255] = fill_color
            final_cv[y1:y2, x1:x2] = roi
            continue

        # =============================================================
        # PATH B: Normal Bubbles — solidity-based approach
        # =============================================================
        if area < 500:
            continue

        hull = cv2.convexHull(largest_cnt)
        hull_area = cv2.contourArea(hull)
        solidity = float(area) / hull_area if hull_area > 0 else 0

        margin = LARGE_MARGIN if solidity < SOLIDITY_THRESHOLD else SMALL_MARGIN

        mask_roi = np.zeros(gray.shape, dtype=np.uint8)
        cv2.drawContours(mask_roi, [largest_cnt], -1, 255, -1)

        iterations = max(1, margin)
        mask_eroded = cv2.erode(mask_roi, np.ones((3, 3), np.uint8), iterations=iterations)

        fill_color = get_dominant_color(roi, mask_eroded)

        mask_3ch = cv2.merge([mask_eroded, mask_eroded, mask_eroded])
        color_block = np.full_like(roi, fill_color)
        final_roi = np.where(mask_3ch == 255, color_block, roi)

        final_cv[y1:y2, x1:x2] = final_roi

    # Convert back to PIL
    result_rgb = cv2.cvtColor(final_cv, cv2.COLOR_BGR2RGB)
    return Image.fromarray(result_rgb)
