"""
Custom Translation Service - User Implementation Template
=========================================================

هذا الملف قالب يجب على المستخدم تنفيذه.

يجب أن يحتوي على:
1. دالة تستقبل ملف ZIP/CBZ
2. تقوم بترجمة الصور
3. تعيد مسارات الصور المترجمة
"""

from typing import List, Dict, Callable, Optional
from pathlib import Path
import logging
import threading
from .ai.pipeline import MangaTranslationPipeline

logger = logging.getLogger(__name__)


class CustomTranslator:
    """
    Advanced AI Translation Service using the 5-model pipeline.
    Connects to Modal.com (Remote GPU) or local AI models.
    """
    
    @classmethod
    def translate_chapter(cls, input_zip_path: str, output_dir: str) -> List[str]:
        """
        Translate a chapter using the AI Pipeline.
        
        Args:
            input_zip_path: Path to original ZIP/CBZ
            output_dir: Directory for translated images
            
        Returns:
            List of translated image paths
        """
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
        """
        Asynchronous translation with progress callbacks.
        """
        
        def worker():
            try:
                pipeline = MangaTranslationPipeline.get_instance()
                result = pipeline.translate_chapter(
                    input_zip_path, 
                    output_dir, 
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
        """Test health of local/remote models."""
        pipeline = MangaTranslationPipeline.get_instance()
        if pipeline.modal_client:
            health = pipeline.modal_client.health_check()
            return {
                'status': health.get('status', 'unknown'),
                'message': health.get('message', 'Remote Modal.com connection tested'),
                'model_name': 'Modal GPU Cluster',
                'ready': health.get('status') == 'ready',
                'async_supported': True
            }
        
        # Test local models
        results = pipeline.test_models()
        return {
            'status': results['overall']['status'],
            'message': results['overall']['message'],
            'model_name': 'Local AI Pipeline',
            'ready': results['overall']['status'] == 'ok',
            'async_supported': True
        }

