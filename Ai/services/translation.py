"""
Translation Service for handling file uploads, extraction, and cleanup
Supports ZIP and CBZ files only
"""
import os
import zipfile
from pathlib import Path
from django.conf import settings

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
        فك ضغط ملف ZIP/CBZ واستخراج الصور
        Args:
            archive_path: Path to archive file
            job_id: UUID of the translation job
        Returns:
            list: Sorted list of image file paths
        """
        extract_dir = TranslationService.UPLOAD_DIR / str(job_id) / 'extracted'
        extract_dir.mkdir(parents=True, exist_ok=True)
        
        # فك الضغط
        with zipfile.ZipFile(archive_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # جمع ملفات الصور فقط
        images = []
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if Path(file).suffix.lower() in TranslationService.ALLOWED_IMAGES:
                    images.append(os.path.join(root, file))
        
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
    def validate_archive(file):
        """
        التحقق من صحة الملف المرفوع
        Args:
            file: UploadedFile object
        Returns:
            tuple: (is_valid: bool, error_message: str)
        """
        # التحقق من الامتداد
        ext = Path(file.name).suffix.lower()
        if ext not in TranslationService.ALLOWED_ARCHIVES:
            return False, f"نوع الملف غير مدعوم. الأنواع المسموحة: {', '.join(TranslationService.ALLOWED_ARCHIVES)}"
        
        # التحقق من الحجم (مثلاً 100MB)
        max_size = 100 * 1024 * 1024  # 100MB
        if file.size > max_size:
            return False, f"حجم الملف كبير جداً. الحد الأقصى: {max_size // (1024*1024)}MB"
        
        return True, ""
