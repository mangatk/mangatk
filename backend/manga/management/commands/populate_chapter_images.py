"""
Django management command to populate chapter images
Adds placeholder images (using manga cover) to chapters that have no images
so the reader functionality can be tested
"""
from django.core.management.base import BaseCommand
from manga.models import Manga, Chapter, ChapterImage


class Command(BaseCommand):
    help = 'Populate chapter images for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Checking chapter images...'))
        
        updated_chapters = 0
        total_images = 0
        
        for manga in Manga.objects.all():
            # Use manga cover as placeholder page if available
            placeholder_url = manga.cover_image_url
            if not placeholder_url:
                continue
                
            for chapter in manga.chapters.all():
                if chapter.images.count() == 0:
                    # Create 5-8 placeholder pages per chapter
                    for page_num in range(1, 6):
                        ChapterImage.objects.create(
                            chapter=chapter,
                            page_number=page_num,
                            image_url=placeholder_url, # Reusing cover as page for demo
                            width=800,
                            height=1200,
                            original_filename=f"page_{page_num}.jpg"
                        )
                        total_images += 1
                    updated_chapters += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'Added {total_images} images to {updated_chapters} chapters using manga covers as placeholders'
        ))
