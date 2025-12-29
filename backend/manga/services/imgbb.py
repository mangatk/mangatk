import requests
from typing import Optional, Dict, List
import os
from django.conf import settings

class ImgBBService:
    """Service for uploading images to ImgBB API using Multipart Upload"""
    
    API_URL = "https://api.imgbb.com/1/upload"
    API_KEY = settings.IMGBB_API_KEY
    
    @classmethod
    def upload_image(cls, image_file, name: str = None) -> Optional[Dict]:
        """
        Upload a single image to ImgBB using standard file upload (Binary)
        This prevents corrupted images caused by Base64 encoding errors.
        """
        try:
            # Validate API key
            if not cls.API_KEY:
                print("Error: IMGBB_API_KEY is not set in settings")
                return None
            
            # Prepare file for upload
            files = {}
            
            # التعامل مع الملف سواء كان مساراً (string) أو ملفاً مفتوحاً
            if isinstance(image_file, str):
                if not os.path.exists(image_file):
                    print(f"File not found: {image_file}")
                    return None
                # نفتح الملف في وضع القراءة الثنائية (Binary)
                files = {'image': open(image_file, 'rb')}
            else:
                # إذا كان كائناً بالفعل (مثل InMemoryUploadedFile أو BytesIO)
                # تأكد من أن المؤشر في البداية
                if hasattr(image_file, 'seek'):
                    image_file.seek(0)
                files = {'image': image_file}
            
            # إعداد البيانات - فقط key (لا name في data)
            data = {
                'key': cls.API_KEY,
            }
            
            # أضف name كمعامل منفصل إذا كان موجوداً
            if name:
                data['name'] = name
            
            # عملية الرفع
            response = requests.post(
                cls.API_URL, 
                data=data, 
                files=files, 
                timeout=300
            )
            
            # إغلاق الملف إذا قمنا بفتحه
            if isinstance(image_file, str) and 'image' in files:
                files['image'].close()

            # Check response
            if response.status_code != 200:
                error_detail = response.text[:200] if response.text else 'No error details'
                print(f"ImgBB API Error {response.status_code}: {error_detail}")
                response.raise_for_status()
            
            result = response.json()
            
            if result.get('success'):
                data = result['data']
                return {
                    'url': data['url'],
                    'display_url': data['display_url'],
                    'delete_url': data['delete_url'],
                    'width': data.get('width'),
                    'height': data.get('height'),
                    'size': data.get('size'),
                    'title': data.get('title', name)
                }
            else:
                print(f"ImgBB upload failed: {result.get('error', {}).get('message', 'Unknown error')}")
                return None
            
        except Exception as e:
            print(f"Error uploading image to ImgBB: {e}")
            return None
    
    @classmethod
    def upload_cover_image(cls, manga_title: str, image_file) -> Optional[Dict]:
        slug = cls._create_slug(manga_title)
        name = f"{slug}_cover"
        return cls.upload_image(image_file, name)
    
    @classmethod
    def upload_chapter_images(cls, manga_title: str, chapter_number: int, image_files: List, start_page: int = 1) -> List[Dict]:
        slug = cls._create_slug(manga_title)
        uploaded_images = []
        
        for idx, image_file in enumerate(image_files):
            page_number = start_page + idx
            name = f"{slug}_ch{chapter_number:03d}_page{page_number:03d}"
            
            result = cls.upload_image(image_file, name)
            if result:
                result['page_number'] = page_number
                # Handle filename based on input type
                if hasattr(image_file, 'name'):
                     result['original_filename'] = image_file.name
                elif isinstance(image_file, str):
                     result['original_filename'] = os.path.basename(image_file)
                else:
                     result['original_filename'] = f'page_{page_number}'

                uploaded_images.append(result)
        
        return uploaded_images
    
    @classmethod
    def _create_slug(cls, text: str) -> str:
        import re
        slug = re.sub(r'[^\w\s-]', '', text.lower())
        slug = re.sub(r'[-\s]+', '_', slug)
        return slug.strip('-_')[:50]