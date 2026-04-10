"""
Text Renderer Service
======================
Renders translated Arabic (or English) text back onto inpainted manga pages.
Supports RTL text, sentiment-based fonts/colors, and auto-fitting text to bubbles.
"""

import os
import logging
import urllib.request
import ssl
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# ============================================================
# Font Configuration
# ============================================================
FONTS_DIR = Path(__file__).parent / 'fonts'

# Sentiment → Arabic font mapping
FONT_FILES_AR = {
    "neutral":  "NotoNaskhArabic-Regular.ttf",
    "positive": "Lalezar-Regular.ttf",
    "negative": "ArefRuqaa-Regular.ttf",
}

FONT_FILE_EN = "DejaVuSans.ttf"

# Download URLs for fonts (GitHub raw)
FONT_URLS = {
    "NotoNaskhArabic-Regular.ttf": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Regular.ttf",
    "Lalezar-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/lalezar/Lalezar-Regular.ttf",
    "ArefRuqaa-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/arefruqaa/ArefRuqaa-Regular.ttf",
    "DejaVuSans.ttf": "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf",
}


def ensure_fonts_downloaded():
    """Download fonts if they don't exist locally."""
    FONTS_DIR.mkdir(parents=True, exist_ok=True)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    for filename, url in FONT_URLS.items():
        filepath = FONTS_DIR / filename
        if not filepath.exists():
            logger.info(f"Downloading font: {filename}...")
            try:
                urllib.request.urlretrieve(url, str(filepath), context=ctx)
                logger.info(f"✅ Downloaded {filename}")
            except Exception as e:
                logger.warning(f"Failed to download {filename}: {e}")


def get_font_path(sentiment: str, language: str) -> str:
    """Get font file path based on sentiment and language."""
    if language == 'ar':
        filename = FONT_FILES_AR.get(sentiment, FONT_FILES_AR["neutral"])
    else:
        filename = FONT_FILE_EN

    return str(FONTS_DIR / filename)


# ============================================================
# Text Wrapping and Fitting
# ============================================================

def wrap_text(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
    draw: ImageDraw.ImageDraw,
    language: str
) -> List[str]:
    """Wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current = []
    direction = 'rtl' if language == 'ar' else 'ltr'

    for word in words:
        test_line = " ".join(current + [word])
        bbox = draw.textbbox(
            (0, 0), test_line, font=font,
            direction=direction, language=language
        )
        if bbox[2] - bbox[0] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]

    if current:
        lines.append(" ".join(current))

    return lines if lines else [text]


def get_fitted_font(
    text: str,
    font_path: str,
    box_w: int,
    box_h: int,
    draw: ImageDraw.ImageDraw,
    language: str,
    min_size: int = 12
) -> Tuple[ImageFont.FreeTypeFont, List[str], int]:
    """
    Find the largest font size that fits text inside a bubble.

    Returns:
        (font, lines, line_spacing)
    """
    direction = 'rtl' if language == 'ar' else 'ltr'
    safe_w = int(box_w * 0.65)
    safe_h = int(box_h * 0.70)
    start_size = min(int(box_w * 0.25), int(box_h * 0.25), 36)

    for size in range(start_size, min_size - 1, -1):
        try:
            font = ImageFont.truetype(font_path, size)
        except Exception:
            font = ImageFont.load_default()

        lines = wrap_text(text, font, safe_w, draw, language)
        line_spacing = int(size * 0.25)

        max_line_w = 0
        total_h = 0
        for line in lines:
            bbox = draw.textbbox(
                (0, 0), line, font=font,
                direction=direction, language=language
            )
            line_w = bbox[2] - bbox[0]
            if line_w > max_line_w:
                max_line_w = line_w
            total_h += (bbox[3] - bbox[1]) + line_spacing

        if total_h <= safe_h and max_line_w <= safe_w:
            return font, lines, line_spacing

    try:
        font = ImageFont.truetype(font_path, min_size)
    except Exception:
        font = ImageFont.load_default()

    return font, wrap_text(text, font, safe_w, draw, language), int(min_size * 0.25)


# ============================================================
# Main Text Rendering
# ============================================================

def render_translated_text(
    cleaned_img: Image.Image,
    boxes: np.ndarray,
    translations: Dict[int, str],
    sentiments: Dict[int, str],
    language: str = 'ar'
) -> Image.Image:
    """
    Render translated text onto the inpainted (cleaned) image.

    Args:
        cleaned_img: PIL Image with text already removed (inpainted).
        boxes: Array of bubble bounding boxes (xyxy format, int).
        translations: Dict mapping box index → translated text.
        sentiments: Dict mapping box index → sentiment label.
        language: Target language code ('ar' for Arabic RTL, 'en' for LTR).

    Returns:
        PIL Image with translated text rendered inside bubbles.
    """
    ensure_fonts_downloaded()

    result = cleaned_img.copy().convert("RGBA")
    overlay = Image.new("RGBA", result.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    cleaned_cv = np.array(cleaned_img.convert("L"))
    direction = 'rtl' if language == 'ar' else 'ltr'

    for i, box in enumerate(boxes):
        if i not in translations:
            continue

        x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
        box_w, box_h = x2 - x1, y2 - y1
        target_text = translations[i]
        sentiment = sentiments.get(i, "neutral")

        font_path = get_font_path(sentiment, language)

        # Detect bubble background brightness for text color selection
        bubble_crop = cleaned_cv[
            max(0, y1):min(cleaned_cv.shape[0], y2),
            max(0, x1):min(cleaned_cv.shape[1], x2)
        ]
        median_lightness = np.median(bubble_crop) if bubble_crop.size > 0 else 255

        # Scanlator standard colors based on background + sentiment
        if median_lightness < 127:
            # Dark background: white text, black outline
            text_color = (255, 255, 255, 255)
            outline_color = (0, 0, 0, 255)
            if sentiment == "negative":
                text_color = (255, 150, 150, 255)  # Pale red
        else:
            # Light background: near-black text, white outline
            text_color = (15, 15, 15, 255)
            outline_color = (255, 255, 255, 255)
            if sentiment == "negative":
                text_color = (139, 0, 0, 255)  # Deep blood red

        font, lines, line_spacing = get_fitted_font(
            target_text, font_path, box_w, box_h, draw, language
        )

        # Calculate line heights
        line_heights = []
        for line in lines:
            bbox = draw.textbbox(
                (0, 0), line, font=font,
                direction=direction, language=language
            )
            lh = (bbox[3] - bbox[1]) + line_spacing
            line_heights.append(lh)

        if line_heights:
            line_heights[-1] -= line_spacing

        total_h = sum(line_heights)
        cur_y = y1 + max(0, (box_h - total_h) // 2)

        for line, lh in zip(lines, line_heights):
            b = draw.textbbox(
                (0, 0), line, font=font,
                direction=direction, language=language
            )
            cur_x = x1 + max(0, (box_w - (b[2] - b[0])) // 2)

            # Outline rendering (8-directional)
            for dx, dy in [
                (-1, -1), (1, -1), (-1, 1), (1, 1),
                (0, -1), (0, 1), (-1, 0), (1, 0)
            ]:
                draw.text(
                    (cur_x + dx, cur_y + dy), line,
                    font=font, fill=outline_color,
                    direction=direction, language=language
                )

            # Main text
            draw.text(
                (cur_x, cur_y), line,
                font=font, fill=text_color,
                direction=direction, language=language
            )
            cur_y += lh + line_spacing

    return Image.alpha_composite(result, overlay).convert("RGB")
