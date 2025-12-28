"""
Mock Translator for Testing
============================
هذا المترجم الوهمي يُستخدم للاختبار فقط.
يأخذ الفصل ويعيده كما هو (بدون ترجمة فعلية)

الغرض: اختبار باقي سير العمل (رفع، معاينة، تنزيل CBZ)
"""

from typing import List
from pathlib import Path
import logging
import zipfile
import shutil

logger = logging.getLogger(__name__)


class MockTranslator:
    """
    مترجم وهمي للاختبار - يعيد الصور كما هي
    """
    
    @classmethod
    def translate_chapter(cls, input_zip_path: str, output_dir: str) -> List[str]:
        """
        ترجمة وهمية - تعيد الصور الأصلية كما هي
        
        Args:
            input_zip_path: مسار ملف ZIP/CBZ الأصلي
            output_dir: المجلد لحفظ "الصور المترجمة"
            
        Returns:
            قائمة بمسارات الصور (نفس الصور الأصلية منسوخة)
        """
        
        logger.info("=== بدء الترجمة الوهمية (Mock Translation) ===")
        logger.info(f"ملف الإدخال: {input_zip_path}")
        logger.info(f"مجلد الإخراج: {output_dir}")
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        translated_images = []
        
        try:
            with zipfile.ZipFile(input_zip_path, 'r') as zip_ref:
                # استخراج الصور
                image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')
                image_files = sorted([
                    f for f in zip_ref.namelist()
                    if f.lower().endswith(image_extensions) and not f.startswith('__MACOSX')
                ])
                
                logger.info(f"عدد الصور المستخرجة: {len(image_files)}")
                
                for idx, filename in enumerate(image_files, 1):
                    # استخراج الصورة الأصلية
                    source = zip_ref.extract(filename, output_path / 'temp')
                    
                    # ======================================================
                    # هنا نقوم فقط بنسخ الصورة (بدون ترجمة فعلية)
                    # ======================================================
                    file_ext = Path(filename).suffix
                    translated_path = output_path / f'page_{idx:03d}{file_ext}'
                    
                    # نسخ الصورة
                    shutil.copy2(source, translated_path)
                    
                    translated_images.append(str(translated_path))
                    
                    logger.info(f"✓ تمت معالجة الصفحة {idx}/{len(image_files)}: {translated_path.name}")
                
                # حذف المجلد المؤقت
                shutil.rmtree(output_path / 'temp', ignore_errors=True)
                
        except Exception as e:
            logger.error(f"خطأ في الترجمة الوهمية: {e}")
            raise
        
        logger.info(f"=== اكتملت الترجمة الوهمية: {len(translated_images)} صورة ===")
        
        return translated_images


    @classmethod
    def test_model(cls):
        """
        اختبار النموذج
        """
        return {
            'status': 'mock',
            'message': 'Mock Translator - يعيد الصور كما هي للاختبار',
            'model_name': 'Mock Translation Model (Testing)',
            'ready': True,
            'async_supported': False  # المترجم الوهمي بسيط ولا يحتاج async
        }


# تصدير للاستخدام
translate_chapter = MockTranslator.translate_chapter
test_model = MockTranslator.test_model
