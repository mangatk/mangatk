"""
Django management command to upload mock chapter images to ImgBB
and assign them to ALL chapters in the database.
"""
import os
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from manga.models import Chapter, ChapterImage
from manga.services.imgbb import ImgBBService

class Command(BaseCommand):
    help = 'Upload mock chapter images to ImgBB and assign to all chapters'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting upload process to ImgBB... This might take time.'))

        # 1. تحديد مسار الصور الوهمية (Mock Data)
        # نستخدم الفصل 1 من المانجا المتوفرة كنموذج
        base_dir = settings.BASE_DIR
        project_root = os.path.dirname(base_dir)
        mock_images_dir = os.path.join(
            project_root, 
            'frontend', 'public', 'uploads', 
            'I Killed an Academy Player', '1'
        )
        
        if not os.path.exists(mock_images_dir):
            self.stdout.write(self.style.ERROR(f'Mock images directory not found: {mock_images_dir}'))
            return

        # 2. قراءة ملفات الصور
        image_files = sorted([f for f in os.listdir(mock_images_dir) if f.lower().endswith('.jpg')])
        if not image_files:
            self.stdout.write(self.style.ERROR('No images found in mock directory.'))
            return

        self.stdout.write(f'Found {len(image_files)} images to use as template.')

        # 3. رفع الصور مرة واحدة فقط لتوفير الوقت والBandwidth
        # سنرفع الصور مرة واحدة ونحتفظ بروابطها لاستخدامها في كل الفصول
        uploaded_links = []
        self.stdout.write('Uploading template images to ImgBB (One time only)...')
        
        for index, filename in enumerate(image_files):
            file_path = os.path.join(mock_images_dir, filename)
            try:
                # نرفع الصورة
                self.stdout.write(f'  Uploading image {index + 1}/{len(image_files)}: {filename}...')
                result = ImgBBService.upload_image(
                    file_path, 
                    name=f"mock_chapter_page_{index + 1}"
                )
                
                if result and 'display_url' in result:
                    uploaded_links.append({
                        'url': result['display_url'],
                        'width': result.get('width', 800),
                        'height': result.get('height', 1200),
                        'filename': filename,
                        'page_number': index + 1
                    })
                    # انتظار بسيط لتجنب تجاوز حدود الـ API
                    time.sleep(5) 
                else:
                    self.stdout.write(self.style.ERROR(f'Failed to upload {filename}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error uploading {filename}: {str(e)}'))

        if not uploaded_links:
            self.stdout.write(self.style.ERROR('No images were uploaded successfully. Aborting.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Successfully uploaded {len(uploaded_links)} template images.'))

        # 4. توزيع الروابط على جميع الفصول
        chapters = Chapter.objects.all()
        total_chapters = chapters.count()
        
        self.stdout.write(self.style.WARNING(f'Clearing old local images and assigning ImgBB links to {total_chapters} chapters...'))

        # حذف الصور القديمة (المحلية)
        ChapterImage.objects.all().delete()

        new_image_objects = []
        for chapter in chapters:
            for link_data in uploaded_links:
                new_image_objects.append(
                    ChapterImage(
                        chapter=chapter,
                        page_number=link_data['page_number'],
                        image_url=link_data['url'], # رابط ImgBB المباشر
                        width=link_data['width'],
                        height=link_data['height'],
                        original_filename=link_data['filename']
                    )
                )

        # الحفظ في قاعدة البيانات دفعة واحدة (Bulk Create)
        batch_size = 5000
        for i in range(0, len(new_image_objects), batch_size):
            ChapterImage.objects.bulk_create(new_image_objects[i:i+batch_size])
            self.stdout.write(f'  Processed batch {i}...')

        self.stdout.write(self.style.SUCCESS(f'DONE! All {total_chapters} chapters now use ImgBB images.'))