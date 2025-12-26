"""
Django Management Command to Import Chapters from Mock Data
Creates chapters and chapter images for all manga in database
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from manga.models import Manga, Chapter, ChapterImage


class Command(BaseCommand):
    help = 'Import chapters and chapter images from mock data structure'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=5,
            help='Limit chapters per manga (default: 5, use 0 for all)'
        )
        parser.add_argument(
            '--pages',
            type=int,
            default=30,
            help='Number of pages per chapter (default: 30)'
        )
        parser.add_argument(
            '--manga-id',
            type=str,
            help='Only import chapters for specific manga UUID'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing chapters before importing'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        pages_per_chapter = options['pages']
        manga_id = options['manga_id']
        clear = options['clear']
        
        self.stdout.write(self.style.SUCCESS('Starting chapter import...'))
        
        # Get manga queryset
        if manga_id:
            manga_qs = Manga.objects.filter(id=manga_id)
            if not manga_qs.exists():
                self.stdout.write(self.style.ERROR(f'Manga with ID {manga_id} not found'))
                return
        else:
            manga_qs = Manga.objects.all()
        
        total_chapters_created = 0
        total_images_created = 0
        
        for manga in manga_qs:
            self.stdout.write(f'\nProcessing: {manga.title}')
            
            # Optionally clear existing chapters
            if clear:
                deleted_count = manga.chapters.all().delete()[0]
                self.stdout.write(f'  Deleted {deleted_count} existing chapter records')
            
            # Create folder name from title (similar to mock data)
            manga_folder = manga.title
            
            # Determine how many chapters to create
            # Use stored chapterCount from mock data if available, else default to limit
            chapter_count = limit if limit > 0 else 10
            
            chapters_created = 0
            images_created = 0
            
            for chapter_num in range(1, chapter_count + 1):
                # Check if chapter already exists
                chapter, created = Chapter.objects.get_or_create(
                    manga=manga,
                    number=chapter_num,
                    defaults={
                        'title': f'{manga.title} - الفصل {chapter_num}'
                    }
                )
                
                if created:
                    chapters_created += 1
                
                # Create chapter images
                for page_num in range(1, pages_per_chapter + 1):
                    # Generate image URL matching mock data pattern
                    # Pattern: /uploads/{manga_folder}/{chapter_num}/{chapter_num_padded}__{page_num_padded}.jpg
                    chapter_padded = str(chapter_num).zfill(3)
                    page_padded = str(page_num).zfill(3)
                    
                    image_url = f'/uploads/{manga_folder}/{chapter_num}/{chapter_padded}__{page_padded}.jpg'
                    
                    image, img_created = ChapterImage.objects.get_or_create(
                        chapter=chapter,
                        page_number=page_num,
                        defaults={
                            'image_url': image_url,
                            'width': 800,
                            'height': 1200,
                            'original_filename': f'{chapter_padded}__{page_padded}.jpg'
                        }
                    )
                    
                    if img_created:
                        images_created += 1
            
            self.stdout.write(f'  Created {chapters_created} chapters, {images_created} images')
            total_chapters_created += chapters_created
            total_images_created += images_created
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Import completed!'
            f'\n   Total chapters created: {total_chapters_created}'
            f'\n   Total images created: {total_images_created}'
        ))
