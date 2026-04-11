"""
Translation Service for Manga Chapters
=======================================

🎯 ضع نموذج الترجمة الخاص بك هنا

هذا الملف مخصص لسكريبت الترجمة المخصص الذي ستقوم بإنشائه.
السكريبت يجب أن يستقبل ملف ZIP/CBZ ويعيد ملف ZIP/CBZ مترجم.
"""

import os
import zipfile
import tempfile
from pathlib import Path
from typing import Optional, Tuple
import logging
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Security Constants
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB per image
MAX_TOTAL_UNCOMPRESSED_SIZE = 300 * 1024 * 1024  # 300 MB per chapter ZIP
ALLOWED_IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')


class TranslationService:
    """
    خدمة الترجمة للفصول
    
    المتطلبات:
    - استقبال ملف ZIP/CBZ يحتوي على صور الفصل الأصلي
    - معالجة الصور باستخدام نموذج الترجمة
    - إرجاع ملف ZIP/CBZ يحتوي على الصور المترجمة
    
    الملاحظات المهمة:
    - يجب الحفاظ على ترتيب الصور
    - يجب أن تكون أسماء الملفات واضحة ومرتبة
    - يجب معالجة الأخطاء بشكل صحيح
    """
    
    @staticmethod
    def translate_chapter(input_zip_path: str, output_dir: Optional[str] = None) -> Tuple[str, dict]:
        """
        🚀 الدالة الرئيسية للترجمة - ضع كودك هنا
        
        Args:
            input_zip_path (str): المسار الكامل لملف ZIP/CBZ الأصلي
            output_dir (str, optional): مجلد حفظ النتيجة (افتراضي: temp)
            
        Returns:
            Tuple[str, dict]: (مسار الملف المترجم, معلومات إضافية)
            
        Example:
            >>> translated_path, info = TranslationService.translate_chapter('/path/to/chapter.zip')
            >>> print(f"Translated file: {translated_path}")
            >>> print(f"Images processed: {info['total_images']}")
        
        ⚠️ التنفيذ الحالي هو مثال فقط - استبدله بنموذجك الخاص
        """
        try:
            logger.info(f"Starting translation for: {input_zip_path}")
            
            from .services.custom_translator import CustomTranslator
            
            # 1. إنشاء مجلد وجهة للصور المترجمة
            temp_translated = tempfile.mkdtemp(prefix='manga_translated_')
            
            # 2. إرسال الفصل إلى خط الذكاء الاصطناعي للترجمة
            logger.info("Routing to CustomTranslator AI pipeline...")
            translated_images = CustomTranslator.translate_chapter(
                input_zip_path,
                temp_translated
            )
            
            # 3. إنشاء ملف ZIP المترجم
            if output_dir is None:
                output_dir = tempfile.gettempdir()
            
            output_filename = f"translated_{os.path.basename(input_zip_path)}"
            output_path = os.path.join(output_dir, output_filename)
            
            # 4. حفظ الصور الجديدة في ملف مضغوط
            TranslationService._create_zip(translated_images, output_path)
            logger.info(f"Created translated ZIP: {output_path}")
            
            # 5. معلومات النتيجة
            result_info = {
                'total_images': len(translated_images),
                'translated_images': len(translated_images),
                'failed_images': 0,
                'output_path': output_path,
                'original_size': os.path.getsize(input_zip_path),
                'translated_size': os.path.getsize(output_path)
            }
            
            # 6. تنظيف الملفات المؤقتة
            import shutil
            shutil.rmtree(temp_translated, ignore_errors=True)
            
            return output_path, result_info
            
        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            raise Exception(f"فشل في ترجمة الفصل: {str(e)}")
    
    
    @staticmethod
    def _extract_images(zip_path: str, extract_to: str) -> list:
        """
        استخراج الصور من ملف ZIP/CBZ
        
        Args:
            zip_path: مسار ملف ZIP
            extract_to: مجلد الاستخراج
            
        Returns:
            list: قائمة بمسارات الصور المستخرجة (مرتبة)
        """
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')
        images = []
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # الحصول على جميع الملفات
            all_files = zip_ref.namelist()
            
            # فلترة الصور فقط
            image_files = [
                f for f in all_files
                if f.lower().endswith(ALLOWED_IMAGE_EXTENSIONS)
                and not f.startswith('__MACOSX')
                and not f.startswith('.')
            ]
            
            # ترتيب الصور
            image_files.sort()
            
            # استخراج الصور
            for img_file in image_files:
                # 🛡️ الحماية من ZipSlip (التأكد من أن المسار داخل مجلد الاستخراج)
                filename = os.path.basename(img_file)
                if not filename: continue
                
                target_path = os.path.join(extract_to, filename)
                
                # استخراج الملف بأمان
                with zip_ref.open(img_file) as source, open(target_path, 'wb') as target:
                    import shutil
                    shutil.copyfileobj(source, target)
                
                images.append(target_path)
        
        return images
    
    
    @staticmethod
    def _create_zip(image_paths: list, output_path: str) -> None:
        """
        إنشاء ملف ZIP من قائمة صور
        
        Args:
            image_paths: قائمة مسارات الصور
            output_path: مسار ملف ZIP الناتج
        """
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
            for i, img_path in enumerate(image_paths):
                # تسمية الملفات بترتيب واضح
                ext = os.path.splitext(img_path)[1]
                arcname = f"page_{i+1:03d}{ext}"
                zip_ref.write(img_path, arcname)
    
    
    @staticmethod
    def _is_valid_image(file_data: bytes) -> bool:
        """التحقق من أن البيانات هي فعلاً صورة حقيقية وليست ملفاً ضاراً متنكراً"""
        try:
            with Image.open(io.BytesIO(file_data)) as img:
                img.verify()  # فحص سلامة الصورة
            return True
        except Exception:
            return False

    @staticmethod
    def validate_zip(zip_path: str) -> Tuple[bool, str]:
        """
        التحقق الأمني والتقني من صحة ملف ZIP
        """
        try:
            if not os.path.exists(zip_path):
                return False, "الملف غير موجود"

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # 1. فحص سلامة الـ ZIP
                bad_file = zip_ref.testzip()
                if bad_file:
                    return False, f"ملف تالف داخلياً: {bad_file}"
                
                # 2. فحص الحجم الإجمالي (الحماية من قنابل الضغط)
                total_uncompressed_size = sum(zinfo.file_size for zinfo in zip_ref.infolist())
                if total_uncompressed_size > MAX_TOTAL_UNCOMPRESSED_SIZE:
                    return False, f"حجم الملف بعد الاستخراج كبير جداً ({total_uncompressed_size / 1024 / 1024:.1f}MB)"

                # 3. التحقق من وجود صور وفحص كل صورة أمنياً
                image_files = [
                    f for f in zip_ref.namelist()
                    if f.lower().endswith(ALLOWED_IMAGE_EXTENSIONS)
                    and not f.startswith('__MACOSX')
                ]
                
                if not image_files:
                    return False, "لا يحتوي الملف على صور صالحة"
                
                # 4. فحص عينة من الصور (أو جميعها إذا كان العدد معقولاً) لضمان عدم وجود ملفات ضارة
                for filename in image_files:
                    zinfo = zip_ref.getinfo(filename)
                    if zinfo.file_size > MAX_IMAGE_SIZE:
                        return False, f"الصورة {filename} تتجاوز الحجم المسموح به"
                    
                    # فحص أمني للمحتوى
                    with zip_ref.open(filename) as f:
                        if not TranslationService._is_valid_image(f.read()):
                            return False, f"الملف {filename} ليس صورة صالحة أو قد يكون تالفاً/ضاراً"
                
                return True, "الملف آمن وصحيح"
                
        except zipfile.BadZipFile:
            return False, "ملف ZIP تالف أو غير مدعوم"
        except Exception as e:
            logger.error(f"ZIP Validation Error: {str(e)}")
            return False, f"عذراً، حدث خطأ أثناء فحص الملف أمنياً"


# =====================================
# 📌 دوال إضافية يمكن استخدامها
# =====================================

def get_translation_progress_callback():
    """
    دالة callback لتتبع تقدم الترجمة (اختياري)
    يمكن استخدامها لإرسال تحديثات للمستخدم
    """
    def callback(current: int, total: int, message: str = ""):
        progress = (current / total * 100) if total > 0 else 0
        logger.info(f"Translation Progress: {progress:.1f}% ({current}/{total}) - {message}")
    return callback


# =====================================
# 🧪 اختبار الخدمة
# =====================================

if __name__ == "__main__":
    # مثال للاستخدام
    logging.basicConfig(level=logging.INFO)
    
    # test_zip = "/path/to/your/chapter.zip"
    # translated_zip, info = TranslationService.translate_chapter(test_zip)
    # print(f"✓ Translation complete: {translated_zip}")
    # print(f"✓ Info: {info}")
    
    print("📍 Translation service ready. Place your translation model here.")
