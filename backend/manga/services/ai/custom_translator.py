"""
Custom Translation Service
============================
Routes translation to either:
  - Modal.com GPU endpoint (if MODAL_ENDPOINT_URL is configured)
  - Local AI pipeline (if running models locally)

Pipeline: Bubble Detection → OCR → Sentiment → Translation → Inpainting → Text Rendering
"""

from typing import List, Dict, Callable, Optional
from pathlib import Path
import logging
import threading
import os

logger = logging.getLogger(__name__)


def _use_modal() -> bool:
    """Check if Modal endpoint is configured."""
    try:
        from django.conf import settings
        url = getattr(settings, 'MODAL_ENDPOINT_URL', '')
        if url:
            return True
    except Exception:
        pass
    return bool(os.getenv('MODAL_ENDPOINT_URL', ''))


class CustomTranslator:
    """
    Production translator. Auto-selects backend:
      - Modal.com GPU endpoint (remote, fast, GPU-powered)
      - Local pipeline (requires local GPU/CPU + model weights)
    """

    @classmethod
    def translate_chapter(cls, input_zip_path: str, output_dir: str) -> List[str]:
        """
        Translate a chapter from a ZIP/CBZ file.
        Auto-routes to Modal or local pipeline.
        """
        if _use_modal():
            from .modal_client import ModalTranslationClient
            logger.info(f"🌐 Using Modal.com GPU for translation")
            client = ModalTranslationClient()
            return client.translate_chapter(input_zip_path, output_dir)
        else:
            from .pipeline import MangaTranslationPipeline
            logger.info(f"🖥️ Using local pipeline for translation")
            pipeline = MangaTranslationPipeline.get_instance()
            return pipeline.translate_chapter(input_zip_path, output_dir)

    @classmethod
    def translate_chapter_async(
        cls,
        input_zip_path: str,
        output_dir: str,
        on_progress: Optional[Callable[[int, int], None]] = None,
        on_complete: Optional[Callable[[List[str]], None]] = None,
        on_error: Optional[Callable[[str], None]] = None
    ) -> threading.Thread:
        """Async translation with progress callbacks."""

        def worker():
            try:
                if _use_modal():
                    from .modal_client import ModalTranslationClient
                    client = ModalTranslationClient()
                    result = client.translate_chapter(
                        input_zip_path, output_dir,
                        on_progress=on_progress
                    )
                else:
                    from .pipeline import MangaTranslationPipeline
                    pipeline = MangaTranslationPipeline.get_instance()
                    result = pipeline.translate_chapter(
                        input_zip_path, output_dir,
                        on_progress=on_progress
                    )

                if on_complete:
                    on_complete(result)

            except Exception as e:
                logger.error(f"Async translation error: {e}")
                if on_error:
                    on_error(str(e))

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        return thread

    @classmethod
    def test_model(cls) -> Dict:
        """Test the configured translation backend."""
        if _use_modal():
            try:
                from .modal_client import ModalTranslationClient
                client = ModalTranslationClient()
                health = client.health_check()
                is_ok = health.get('status') == 'ready'
                return {
                    'status': 'ready' if is_ok else 'error',
                    'message': f"Modal GPU: {health.get('status', 'unknown')}",
                    'model_name': 'Modal.com GPU Pipeline',
                    'ready': is_ok,
                    'async_supported': True,
                    'backend': 'modal',
                    'details': health
                }
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f'Modal connection failed: {str(e)}',
                    'model_name': 'Modal.com GPU Pipeline',
                    'ready': False,
                    'async_supported': True,
                    'backend': 'modal'
                }
        else:
            try:
                from .pipeline import MangaTranslationPipeline
                pipeline = MangaTranslationPipeline.get_instance()
                results = pipeline.test_models()
                all_ok = results.get('overall', {}).get('status') == 'ok'
                return {
                    'status': 'ready' if all_ok else 'error',
                    'message': 'Local AI Pipeline Ready' if all_ok else 'Some models failed',
                    'model_name': 'Local Pipeline (5 AI Models)',
                    'ready': all_ok,
                    'async_supported': True,
                    'backend': 'local',
                    'details': results
                }
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f'Pipeline failed: {str(e)}',
                    'model_name': 'Local Pipeline',
                    'ready': False,
                    'async_supported': True,
                    'backend': 'local'
                }
