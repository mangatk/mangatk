"""
CBZ Creation Service for translated manga chapters
"""
import os
import zipfile
from pathlib import Path
import requests
from io import BytesIO

class CBZService:
    """Service for creating CBZ files from translated images"""
    
    @staticmethod
    def create_cbz_from_urls(image_urls, output_path, job_id):
        """
        إنشاء ملف CBZ من روابط الصور المترجمة
        
        Args:
            image_urls: List of dicts [{url, page_number}]
            output_path: Path where CBZ will be saved
            job_id: Translation job ID for naming
            
        Returns:
            str: Path to created CBZ file
        """
        # Sort by page number
        sorted_images = sorted(image_urls, key=lambda x: x.get('page_number', 0))
        
        # Create CBZ (which is just a ZIP file)
        cbz_path = Path(output_path) / f"translated_{job_id}.cbz"
        cbz_path.parent.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(cbz_path, 'w', zipfile.ZIP_DEFLATED) as cbz:
            for idx, img_data in enumerate(sorted_images, 1):
                url = img_data.get('translated_url')
                if not url:
                    continue
                
                try:
                    # Download image from URL
                    response = requests.get(url, timeout=30)
                    response.raise_for_status()
                    
                    # Get file extension from URL or default to jpg
                    ext = Path(url).suffix or '.jpg'
                    if not ext.startswith('.'):
                        ext = '.' + ext
                    
                    # Create filename with page number
                    filename = f"page_{idx:04d}{ext}"
                    
                    # Add to CBZ
                    cbz.writestr(filename, response.content)
                    
                except Exception as e:
                    print(f"Error downloading image {url}: {e}")
                    continue
        
        return str(cbz_path)
    
    @staticmethod
    def create_cbz_from_local_files(image_paths, output_path, job_id):
        """
        إنشاء ملف CBZ من ملفات محلية
        
        Args:
            image_paths: List of local file paths
            output_path: Path where CBZ will be saved
            job_id: Translation job ID for naming
            
        Returns:
            str: Path to created CBZ file
        """
        cbz_path = Path(output_path) / f"translated_{job_id}.cbz"
        cbz_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Sort image paths
        sorted_paths = sorted(image_paths)
        
        with zipfile.ZipFile(cbz_path, 'w', zipfile.ZIP_DEFLATED) as cbz:
            for idx, img_path in enumerate(sorted_paths, 1):
                if not os.path.exists(img_path):
                    continue
                
                ext = Path(img_path).suffix
                filename = f"page_{idx:04d}{ext}"
                
                cbz.write(img_path, filename)
        
        return str(cbz_path)
