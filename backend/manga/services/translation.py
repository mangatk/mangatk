"""
Translation Service for handling file uploads, extraction, and cleanup
Supports ZIP and CBZ files only
"""
import os
import zipfile
import io
import shutil
from pathlib import Path
from django.conf import settings
from PIL import Image

# Security Constants
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB per image
MAX_TOTAL_UNCOMPRESSED_SIZE = 300 * 1024 * 1024  # 300 MB per chapter ZIP
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}


class TranslationService:
    """Service for handling translation file operations"""
    
    UPLOAD_DIR = Path(settings.MEDIA_ROOT) / 'translation_temp'
    ALLOWED_ARCHIVES = {'.zip', '.cbz'}
    ALLOWED_IMAGES = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    
    @staticmethod
    def save_uploaded_file(file, job_id):
        """
        حفظ الملف المرفوع
        Args:
            file: UploadedFile object
            job_id: UUID of the translation job
        Returns:
            str: Path to saved file
        """
        job_dir = TranslationService.UPLOAD_DIR / str(job_id)
        job_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = job_dir / file.name
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        return str(file_path)
    
    @staticmethod
    def extract_archive(archive_path, job_id):
        """
        فك ضغط ملف ZIP/CBZ واستخراج الصور بأمان
        Args:
            archive_path: Path to archive file
            job_id: UUID of the translation job
        Returns:
            list: Sorted list of image file paths
        """
        extract_dir = TranslationService.UPLOAD_DIR / str(job_id) / 'extracted'
        extract_dir.mkdir(parents=True, exist_ok=True)
        
        # فك الضغط بأمان
        images = []
        try:
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                # جمع ملفات الصور التي سنستخرجها
                image_files = [
                    f for f in zip_ref.namelist()
                    if Path(f).suffix.lower() in TranslationService.ALLOWED_IMAGES
                    and not f.startswith('__MACOSX')
                    and not f.startswith('.')
                ]
                
                for img_file in image_files:
                    # 🛡️ الحماية من ZipSlip: استخراج السطح فقط (basename)
                    filename = os.path.basename(img_file)
                    if not filename: continue
                    
                    target_path = extract_dir / filename
                    
                    # استخراج الملف يدوياً لضمان عدم وجود تلاعب في المسارات
                    with zip_ref.open(img_file) as source, open(target_path, 'wb') as target:
                        shutil.copyfileobj(source, target)
                    
                    images.append(str(target_path))
        except Exception as e:
            # تنظيف المخلفات في حال الفشل
            if extract_dir.exists():
                shutil.rmtree(extract_dir)
            raise e
        
        # ترتيب الصور حسب الاسم
        images.sort()
        
        return images
    
    @staticmethod
    def cleanup_job(job_id):
        """
        حذف الملفات المؤقتة للمهمة
        Args:
            job_id: UUID of the translation job
        """
        import shutil
        job_dir = TranslationService.UPLOAD_DIR / str(job_id)
        if job_dir.exists():
            shutil.rmtree(job_dir)
            
    @staticmethod
    def create_result_archive(job_id, image_paths):
        """
        إنشاء ملف ZIP نهائي يحتوي على الصور المترجمة
        Args:
            job_id: UUID of the translation job
            image_paths: List of absolute paths to the translated images
        Returns:
            str: Path to the created ZIP file
        """
        job_dir = TranslationService.UPLOAD_DIR / str(job_id)
        result_dir = job_dir / 'result'
        result_dir.mkdir(parents=True, exist_ok=True)
        
        archive_path = result_dir / f'translated_manga_{job_id}.cbz'
        
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for img_path in image_paths:
                zipf.write(img_path, arcname=os.path.basename(img_path))
                
        return str(archive_path)
    
    @staticmethod
    def _is_valid_image(file_data: bytes) -> bool:
        """التحقق من أن البيانات هي فعلاً صورة حقيقية"""
        try:
            with Image.open(io.BytesIO(file_data)) as img:
                img.verify()
            return True
        except Exception:
            return False

    @staticmethod
    def validate_archive(file):
        """
        التحقق الأمني من صحة الملف المرفوع
        Args:
            file: UploadedFile object
        Returns:
            tuple: (is_valid: bool, error_message: str)
        """
        # 1. التحقق من الامتداد
        ext = Path(file.name).suffix.lower()
        if ext not in TranslationService.ALLOWED_ARCHIVES:
            return False, f"نوع الملف غير مدعوم. الأنواع المسموحة: {', '.join(TranslationService.ALLOWED_ARCHIVES)}"
        
        # 2. التحقق من الحجم (مثلاً 150MB كحد أقصى للترجمة)
        max_size = 150 * 1024 * 1024
        if file.size > max_size:
            return False, f"حجم الملف كبير جداً. الحد الأقصى: {max_size // (1024*1024)}MB"
        
        # 3. فحص أمني لمحتويات الـ ZIP (بدون استخراج الكل)
        try:
            with zipfile.ZipFile(file, 'r') as zip_ref:
                # فحص الـ ZIP نفسه
                if zip_ref.testzip():
                    return False, "ملف تالف داخلياً"
                
                # فحص الحجم الإجمالي بعد فك الضغط (الحماية من قنابل الضغط)
                total_size = sum(zinfo.file_size for zinfo in zip_ref.infolist())
                if total_size > MAX_TOTAL_UNCOMPRESSED_SIZE:
                    return False, "حجم الملفات بعد الاستخراج كبير جداً"
                
                # فحص عينة من ملفات الصور
                found_images = False
                for zinfo in zip_ref.infolist():
                    if Path(zinfo.filename).suffix.lower() in TranslationService.ALLOWED_IMAGES:
                        found_images = True
                        if zinfo.file_size > MAX_IMAGE_SIZE:
                            return False, f"الصورة {zinfo.filename} كبيرة جداً"
                        
                        # فحص أمني للمحتوى
                        with zip_ref.open(zinfo.filename) as f:
                            if not TranslationService._is_valid_image(f.read()):
                                return False, f"الملف {zinfo.filename} ليس صورة صالحة"
                                
                if not found_images:
                    return False, "لا توجد صور في الملف"
                    
        except zipfile.BadZipFile:
            return False, "الملف ليس ملف ZIP/CBZ صالح"
        except Exception as e:
            return False, "فشل في فحص أمان الملف"
        
        return True, ""
