"""
Manga Translation Pipeline
============================
Main orchestrator that chains all 5 AI models to translate manga pages:

1. Bubble Detection (YOLOv8)
2. OCR (manga-ocr / EasyOCR)
3. Sentiment Analysis (BERT)
4. Translation (Local Seq2Seq)
5. Inpainting (LaMa)
6. Text Rendering (Arabic RTL)

Usage:
    pipeline = MangaTranslationPipeline.get_instance()
    translated_images = pipeline.translate_chapter('/path/to/chapter.zip', '/output/dir')
"""

import os
import zipfile
import shutil
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Callable, Tuple
from PIL import Image

logger = logging.getLogger(__name__)

# Pipeline constants (from Colab config)
CROP_PADDING = 4
SOURCE_LANG = "ja"
TARGET_LANG = "ar"


class MangaTranslationPipeline:
    """
    Orchestrates the full manga translation pipeline.
    Uses lazy-loaded singletons for each model service.
    """

    _instance: Optional['MangaTranslationPipeline'] = None
    _initialized: bool = False

    def __init__(self):
        # Configure Modal endpoint
        self.modal_url = None
        try:
            from django.conf import settings
            self.modal_url = getattr(settings, 'MODAL_ENDPOINT_URL', os.getenv('MODAL_ENDPOINT_URL', ''))
        except Exception:
            self.modal_url = os.getenv('MODAL_ENDPOINT_URL', '')

        # Services are loaded lazily on first use
        self._bubble_detector = None
        self._ocr_service = None
        self._sentiment_service = None
        self._translator_service = None
        self._inpainter_service = None
        self._modal_client = None

    @classmethod
    def get_instance(cls) -> 'MangaTranslationPipeline':
        """Get or create the singleton pipeline instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def modal_client(self):
        if self._modal_client is None and self.modal_url:
            from .modal_client import ModalTranslationClient
            try:
                self._modal_client = ModalTranslationClient(self.modal_url)
            except Exception as e:
                logger.error(f"Failed to initialize Modal client: {e}")
        return self._modal_client

    # --------------------------------------------------------
    # Lazy-loaded model services
    # --------------------------------------------------------

    @property
    def bubble_detector(self):
        if self._bubble_detector is None:
            from .bubble_detector import BubbleDetector
            self._bubble_detector = BubbleDetector.get_instance()
        return self._bubble_detector

    @property
    def ocr(self):
        if self._ocr_service is None:
            from .ocr_service import OCRService
            self._ocr_service = OCRService.get_instance()
        return self._ocr_service

    @property
    def sentiment(self):
        if self._sentiment_service is None:
            from .sentiment_service import SentimentService
            self._sentiment_service = SentimentService.get_instance()
        return self._sentiment_service

    @property
    def translator(self):
        if self._translator_service is None:
            from .translator_service import TranslatorService
            self._translator_service = TranslatorService.get_instance()
        return self._translator_service

    @property
    def inpainter(self):
        if self._inpainter_service is None:
            from .inpainter_service import InpainterService
            self._inpainter_service = InpainterService.get_instance()
        return self._inpainter_service

    # --------------------------------------------------------
    # Single Page Translation
    # --------------------------------------------------------

    def translate_page(self, image: Image.Image) -> Tuple[Image.Image, Dict]:
        """
        Translate a single manga page through the full pipeline.

        Args:
            image: PIL Image (RGB) of the manga page.

        Returns:
            (translated_image, page_info) tuple.
            page_info contains: bubbles_found, texts_extracted, translations, sentiments.
        """
        from .text_renderer import render_translated_text

        img_cv = np.array(image)
        page_info = {
            'bubbles_found': 0,
            'texts_extracted': 0,
            'translations': {},
            'sentiments': {},
        }

        # Step 1: Detect speech bubbles
        boxes = self.bubble_detector.detect(img_cv, confidence=0.25)
        page_info['bubbles_found'] = len(boxes)

        if len(boxes) == 0:
            return image.copy(), page_info

        # Step 2-4: For each bubble → OCR → Sentiment → Translate
        translations = {}
        sentiments = {}
        text_regions_per_box = {}

        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = box

            # Crop with padding
            px1 = max(0, x1 - CROP_PADDING)
            py1 = max(0, y1 - CROP_PADDING)
            px2 = min(img_cv.shape[1], x2 + CROP_PADDING)
            py2 = min(img_cv.shape[0], y2 + CROP_PADDING)

            bubble_crop = img_cv[py1:py2, px1:px2]

            # Skip tiny bubbles
            if bubble_crop.shape[0] < 20 or bubble_crop.shape[1] < 20:
                continue

            # Step 2: OCR — extract text
            source_text = self.ocr.extract_text(bubble_crop, SOURCE_LANG)

            if not self.ocr.is_valid_source_text(source_text, SOURCE_LANG):
                logger.debug(f"Bubble {i+1}: skipped (invalid text: {source_text})")
                continue

            # Step 4: Translate
            target_text = self.translator.translate(source_text)
            if "[Translation Error]" in target_text:
                continue

            translations[i] = target_text

            # Step 3: Sentiment analysis (on translated text)
            bubble_sentiment = self.sentiment.analyze(target_text)
            sentiments[i] = bubble_sentiment

            page_info['texts_extracted'] += 1
            logger.info(
                f"Bubble {i+1} [{bubble_sentiment.upper()}]: "
                f"{source_text} --> {target_text}"
            )

            # Get text mask regions for inpainting
            detections = self.ocr.get_text_mask_regions(bubble_crop)
            if detections:
                # Store with bubble index for global mask building
                # Need to remap coordinates to use the padded crop offsets
                remapped = []
                for (bbox_pts, text) in detections:
                    remapped.append((bbox_pts, text))
                text_regions_per_box[i] = remapped
                # Adjust box reference to padded coords
                boxes[i] = [px1, py1, px2, py2]

        page_info['translations'] = translations
        page_info['sentiments'] = sentiments

        # Step 5: Inpainting — remove original text
        from .inpainter_service import InpainterService
        global_mask = InpainterService.build_text_mask(
            img_cv.shape, boxes, text_regions_per_box
        )
        cleaned_img = self.inpainter.inpaint(image, global_mask, boxes=boxes)

        # Step 6: Render translated text
        # Reset boxes to original (non-padded) for text rendering
        final_img = render_translated_text(
            cleaned_img, boxes, translations, sentiments, TARGET_LANG
        )

        return final_img, page_info

    # --------------------------------------------------------
    # Chapter Translation (ZIP/CBZ → translated images)
    # --------------------------------------------------------

    def translate_chapter(
        self,
        input_zip_path: str,
        output_dir: str,
        on_progress: Optional[Callable[[int, int], None]] = None
    ) -> List[str]:
        """
        Translate an entire chapter from a ZIP/CBZ file.

        Args:
            input_zip_path: Path to ZIP/CBZ containing manga page images.
            output_dir: Directory to save translated page images.
            on_progress: Optional callback(current_page, total_pages).

        Returns:
            List of file paths to translated page images (sorted).
        """
        if self.modal_client:
            logger.info("Using Modal.com for chapter translation")
            # Handle possible language overrides from environment/settings if desired
            return self.modal_client.translate_chapter(
                input_zip_path, 
                output_dir, 
                on_progress=on_progress,
                source_lang=SOURCE_LANG,
                target_lang=TARGET_LANG
            )

        logger.info(f"=== Starting local chapter translation ===")
        logger.info(f"Input: {input_zip_path}")
        logger.info(f"Output: {output_dir}")

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Extract images from ZIP
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')
        extracted_images = []

        with zipfile.ZipFile(input_zip_path, 'r') as zip_ref:
            image_files = sorted([
                f for f in zip_ref.namelist()
                if f.lower().endswith(image_extensions)
                and not f.startswith('__MACOSX')
                and not f.startswith('.')
            ])

            # Extract to temp dir
            temp_dir = output_path / 'temp_extract'
            temp_dir.mkdir(parents=True, exist_ok=True)

            for filename in image_files:
                zip_ref.extract(filename, temp_dir)
                extracted_images.append(str(temp_dir / filename))

        total_pages = len(extracted_images)
        logger.info(f"Extracted {total_pages} images from ZIP.")

        if total_pages == 0:
            logger.warning("No images found in ZIP file.")
            return []

        # Process each page through the pipeline
        translated_paths = []

        for idx, img_path in enumerate(extracted_images, 1):
            try:
                image_pil = Image.open(img_path).convert("RGB")
                translated_img, page_info = self.translate_page(image_pil)

                # Save translated image
                file_ext = Path(img_path).suffix
                output_file = output_path / f'page_{idx:03d}{file_ext}'
                translated_img.save(str(output_file))
                translated_paths.append(str(output_file))

                logger.info(
                    f"✓ Page {idx}/{total_pages}: "
                    f"{page_info['bubbles_found']} bubbles, "
                    f"{page_info['texts_extracted']} translated"
                )

                if on_progress:
                    on_progress(idx, total_pages)

            except Exception as e:
                logger.error(f"Error processing page {idx}: {e}")
                # On error, copy original image as fallback
                try:
                    file_ext = Path(img_path).suffix
                    output_file = output_path / f'page_{idx:03d}{file_ext}'
                    shutil.copy2(img_path, str(output_file))
                    translated_paths.append(str(output_file))
                except Exception:
                    pass

        # Cleanup temp extraction directory
        temp_dir = output_path / 'temp_extract'
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)

        logger.info(f"=== Chapter translation complete: {len(translated_paths)} pages ===")
        return translated_paths

    # --------------------------------------------------------
    # Model Health Check
    # --------------------------------------------------------

    def test_models(self) -> Dict:
        """
        Test that all models can be loaded.

        Returns:
            Dict with status for each model.
        """
        results = {}

        model_tests = [
            ('bubble_detector', lambda: self.bubble_detector),
            ('ocr', lambda: self.ocr),
            ('sentiment', lambda: self.sentiment),
            ('translator', lambda: self.translator),
            ('inpainter', lambda: self.inpainter),
        ]

        for name, loader in model_tests:
            try:
                loader()
                results[name] = {'status': 'ok', 'message': 'Model loaded successfully'}
            except Exception as e:
                results[name] = {'status': 'error', 'message': str(e)}

        all_ok = all(r['status'] == 'ok' for r in results.values())
        results['overall'] = {
            'status': 'ok' if all_ok else 'error',
            'message': 'All models ready' if all_ok else 'Some models failed to load'
        }

        return results
