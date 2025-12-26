
"""
Django management command to ensure all manga have complete data (covers, chapters, images)
Fixes 404s and empty screens by filling in gaps with mock I Killed an Academy Player data.
"""
import os
import random
from django.core.management.base import BaseCommand
from manga.models import Manga, Chapter, ChapterImage
from django.conf import settings
from django.utils import timezone

class Command(BaseCommand):
    help = 'Ensure all manga have covers and chapters with images'

    def handle(self, *args, **options):
        # 1. Setup paths
        base_dir = settings.BASE_DIR
        project_root = os.path.dirname(base_dir)
        mock_images_dir = os.path.join(
            project_root, 
            'frontend', 'public', 'uploads', 
            'I Killed an Academy Player', '1'
        )
        
        # This is the URL path for the cover of "I Killed an Academy Player" (assuming it exists or using a chapter image as cover)
        # Using the first page as a fallback cover if needed
        default_cover_url = "/uploads/I Killed an Academy Player/1/001__001.jpg" 
        
        # Get list of mock images for chapters
        if not os.path.exists(mock_images_dir):
            self.stdout.write(self.style.ERROR('Mock images directory not found'))
            return

        mock_page_files = sorted([f for f in os.listdir(mock_images_dir) if f.lower().endswith('.jpg')])
        
        # 2. Fix Manga Covers
        manga_without_covers = Manga.objects.filter(cover_image_url__exact='')
        self.stdout.write(f'Found {manga_without_covers.count()} manga without covers. Fixing...')
        
        for manga in manga_without_covers:
            manga.cover_image_url = default_cover_url
            manga.save()
            self.stdout.write(f' - Set default cover for: {manga.title}')
            
        # 3. Create Chapters for Manga with FEW chapters (ensure at least 3)
        all_manga = Manga.objects.all()
        for manga in all_manga:
            current_count = manga.chapters.count()
            if current_count < 3:
                needed = 3 - current_count
                self.stdout.write(f'Manga "{manga.title}" has {current_count} chapters. Creating {needed} mock chapters...')
                
                # Get last chapter number
                last_ch = manga.chapters.order_by('-number').first()
                start_num = (last_ch.number + 1) if last_ch else 1
                
                for i in range(needed):
                    num = start_num + i
                    Chapter.objects.create(
                        manga=manga,
                        number=num,
                        title=f"الفصل {num}",
                        release_date=timezone.now().date()
                    )
        
        # 4. Ensure ALL chapters have images
        
        # Easier: iterate all chapters, if images.count() == 0, populate.
        # Since I just created new chapters, they definitely have 0 images.
        
        all_chapters = Chapter.objects.all()
        chapters_fixed = 0
        total_images_created = 0
        
        self.stdout.write('Checking chapters for missing images...')
        
        formatted_images = []
        for index, filename in enumerate(mock_page_files):
             formatted_images.append({
                 'url': f"/uploads/I Killed an Academy Player/1/{filename}",
                 'filename': filename,
                 'page': index + 1
             })
             
        # Batch insert list
        new_image_objects = []
        
        for chapter in all_chapters:
            if chapter.images.count() == 0:
                # Add images
                for img_data in formatted_images:
                    new_image_objects.append(
                        ChapterImage(
                            chapter=chapter,
                            page_number=img_data['page'],
                            image_url=img_data['url'],
                            width=800,
                            height=1200,
                            original_filename=img_data['filename']
                        )
                    )
                chapters_fixed += 1
                
                # Batch create every 10 chapters to save memory
                if len(new_image_objects) > 5000:
                    ChapterImage.objects.bulk_create(new_image_objects)
                    total_images_created += len(new_image_objects)
                    new_image_objects = []
                    self.stdout.write(f' .. saving batch ..')

        # Final batch
        if new_image_objects:
             ChapterImage.objects.bulk_create(new_image_objects)
             total_images_created += len(new_image_objects)
             
        self.stdout.write(self.style.SUCCESS(f'Fixed {chapters_fixed} chapters by adding {total_images_created} images.'))
