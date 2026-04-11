"""
Modal Client Service
=====================
Calls the Modal.com GPU endpoint for manga translation instead of
running AI models locally.

Setup:
    1. Deploy modal_app.py: `modal deploy modal_app.py`
    2. Set MODAL_ENDPOINT_URL in .env or settings.py
    3. The pipeline will automatically use Modal instead of local models.
"""

import io
import os
import zipfile
import shutil
import logging
import requests
from pathlib import Path
from typing import List, Optional, Callable
from PIL import Image

logger = logging.getLogger(__name__)


class ModalTranslationClient:
    """
    Sends manga pages to the Modal.com GPU endpoint for translation.
    Drop-in replacement for the local MangaTranslationPipeline.
    """

    def __init__(self, endpoint_url: str = None):
        if endpoint_url:
            self.base_url = endpoint_url.rstrip('/')
        else:
            # Try Django settings
            try:
                from django.conf import settings
                self.base_url = getattr(settings, 'MODAL_ENDPOINT_URL', '')
            except Exception:
                self.base_url = os.getenv('MODAL_ENDPOINT_URL', '')

        if not self.base_url:
            raise ValueError(
                "Modal endpoint URL not configured. Set MODAL_ENDPOINT_URL in .env "
                "or settings.py (e.g. 'https://YOUR_USER--mangatk-translation-translate.modal.run')"
            )

        # Derive health endpoint from translate endpoint
        self.translate_url = self.base_url
        parts = self.base_url.rsplit('translate', 1)
        if len(parts) == 2:
            self.health_url = parts[0] + 'health' + parts[1]
        else:
            self.health_url = self.base_url
        self.timeout = 120  # 2 minutes per page

    def health_check(self) -> dict:
        """Check if the Modal endpoint is healthy."""
        try:
            resp = requests.get(self.health_url, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def translate_page(
        self,
        image: Image.Image,
        source_lang: str = 'ja',
        target_lang: str = 'ar'
    ) -> Image.Image:
        """
        Send a single page to Modal for translation.

        Args:
            image: PIL Image of the manga page.
            source_lang: Source language code.
            target_lang: Target language code.

        Returns:
            Translated PIL Image.
        """
        # Convert PIL to bytes
        buf = io.BytesIO()
        image.save(buf, format='PNG')
        buf.seek(0)

        # Send to Modal
        files = {'image': ('page.png', buf, 'image/png')}
        data = {'source_lang': source_lang, 'target_lang': target_lang}

        logger.info(f"Sending page to Modal: {self.translate_url}")
        resp = requests.post(
            self.translate_url,
            files=files,
            data=data,
            timeout=self.timeout
        )
        resp.raise_for_status()

        # Parse response image
        return Image.open(io.BytesIO(resp.content)).convert('RGB')

    def translate_chapter(
        self,
        input_zip_path: str,
        output_dir: str,
        on_progress: Optional[Callable[[int, int], None]] = None,
        source_lang: str = 'ja',
        target_lang: str = 'ar'
    ) -> List[str]:
        """
        Translate an entire chapter ZIP/CBZ via Modal.

        Args:
            input_zip_path: Path to ZIP/CBZ file.
            output_dir: Directory to save translated images.
            on_progress: Optional callback(current_page, total_pages).
            source_lang: Source language code.
            target_lang: Target language code.

        Returns:
            List of translated image file paths.
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Extract images from ZIP
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')
        extracted = []

        with zipfile.ZipFile(input_zip_path, 'r') as zf:
            image_files = sorted([
                f for f in zf.namelist()
                if f.lower().endswith(image_extensions)
                and not f.startswith('__MACOSX')
                and not f.startswith('.')
            ])

            temp_dir = output_path / 'temp_extract'
            temp_dir.mkdir(parents=True, exist_ok=True)

            for filename in image_files:
                zf.extract(filename, temp_dir)
                extracted.append(str(temp_dir / filename))

        total = len(extracted)
        logger.info(f"Sending {total} pages to Modal for translation...")

        translated_paths = []
        for idx, img_path in enumerate(extracted, 1):
            try:
                image = Image.open(img_path).convert('RGB')
                translated = self.translate_page(image, source_lang, target_lang)

                ext = Path(img_path).suffix
                out_file = output_path / f'page_{idx:03d}{ext}'
                translated.save(str(out_file))
                translated_paths.append(str(out_file))

                logger.info(f"✓ Page {idx}/{total} translated via Modal")

                if on_progress:
                    on_progress(idx, total)

            except Exception as e:
                logger.error(f"Error translating page {idx}: {e}")
                # Fallback: copy original
                try:
                    ext = Path(img_path).suffix
                    out_file = output_path / f'page_{idx:03d}{ext}'
                    shutil.copy2(img_path, str(out_file))
                    translated_paths.append(str(out_file))
                except Exception:
                    pass

        # Cleanup
        temp_dir = output_path / 'temp_extract'
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)

        logger.info(f"Chapter translation complete: {len(translated_paths)} pages")
        return translated_paths
