
"""
Django management command to RE-populate chapter images using REAL mock data
Assigns images from 'I Killed an Academy Player' Chapter 1 to ALL chapters in the DB
as requested by the user.
"""
import os
from django.core.management.base import BaseCommand
from manga.models import Manga, Chapter, ChapterImage
from django.conf import settings

class Command(BaseCommand):
    help = 'Repopulate chapter images using specific mock data from frontend'

    def handle(self, *args, **options):
        # 1. Define source directory for mock images
        # We know the path is d:\gndhn\mangatk\frontend\public\uploads\I Killed an Academy Player\1
        # But let's try to be dynamic relative to backend if possible, or just hardcode for this env
        
        # Going up from backend/manga/management/commands to backend/manga/management to backend/manga to backend to root
        base_dir = settings.BASE_DIR # d:\gndhn\mangatk\backend
        project_root = os.path.dirname(base_dir) # d:\gndhn\mangatk
        
        mock_images_dir = os.path.join(
            project_root, 
            'frontend', 'public', 'uploads', 
            'I Killed an Academy Player', '1'
        )
        
        if not os.path.exists(mock_images_dir):
            self.stdout.write(self.style.ERROR(f'Mock images directory not found: {mock_images_dir}'))
            return

        # 2. clear existing images
        self.stdout.write(self.style.WARNING('Deleting existing chapter images...'))
        ChapterImage.objects.all().delete()
        
        # 3. Get list of image files
        image_files = sorted([f for f in os.listdir(mock_images_dir) if f.lower().endswith('.jpg')])
        
        if not image_files:
            self.stdout.write(self.style.ERROR('No .jpg images found in mock directory'))
            return
            
        self.stdout.write(self.style.SUCCESS(f'Found {len(image_files)} mock images'))
        
        # 4. Populate all chapters
        chapters = Chapter.objects.all()
        total_chapters = chapters.count()
        self.stdout.write(f'Populating {total_chapters} chapters...')
        
        chapter_image_objects = []
        
        for chapter in chapters:
            for index, filename in enumerate(image_files):
                # Construct URL path relative to frontend public folder
                # URL should be /uploads/I Killed an Academy Player/1/filename
                # Browsers handle spaces in URLs usually, but let's see. 
                # Ideally should be URL encoded but Next.js serving static files handles space?
                # Let's keep it simplest: raw string. If fails, we might need %20
                
                # Note: frontend mock data used: /uploads/I Killed an Academy Player/1/001__001.jpg
                # validating that spaces work in Next.js public folder serving.
                
                url_path = f"/uploads/I Killed an Academy Player/1/{filename}"
                
                chapter_image_objects.append(
                    ChapterImage(
                        chapter=chapter,
                        page_number=index + 1,
                        image_url=url_path,
                        width=800, # Mock dimensions
                        height=1200,
                        original_filename=filename
                    )
                )
        
        # Bulk create for performance
        batch_size = 5000
        total_images = len(chapter_image_objects)
        self.stdout.write(f'Creating {total_images} image records...')
        
        for i in range(0, total_images, batch_size):
            ChapterImage.objects.bulk_create(chapter_image_objects[i:i+batch_size])
            self.stdout.write(f'Processed {min(i+batch_size, total_images)}/{total_images}')
            
        self.stdout.write(self.style.SUCCESS('Successfully repopulated all chapters with mock images!'))
