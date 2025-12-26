"""
Django Management Command to fix chapter images
Updates all chapter images to use "I Killed an Academy Player" folder
and adds this manga to the database if not exists
"""
from django.core.management.base import BaseCommand
from manga.models import Manga, Chapter, ChapterImage, Genre, Category


class Command(BaseCommand):
    help = 'Fix chapter images to use existing local images and add missing manga'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting image fix...'))
        
        # Step 1: Add "I Killed an Academy Player" manga if not exists
        self.add_ikap_manga()
        
        # Step 2: Update all chapter images to use IKAP folder
        self.fix_chapter_images()
        
        self.stdout.write(self.style.SUCCESS('\n✅ All done!'))
    
    def add_ikap_manga(self):
        """Add I Killed an Academy Player manga"""
        self.stdout.write('\nAdding "I Killed an Academy Player" manga...')
        
        # Get or create category
        category, _ = Category.objects.get_or_create(
            slug='action-fantasy',
            defaults={
                'name': 'action-fantasy',
                'title_ar': 'Action & Fantasy',
                'description_ar': 'أقوى مانغا الأكشن والخيال'
            }
        )
        
        # Create manga
        manga, created = Manga.objects.get_or_create(
            title='I Killed an Academy Player',
            defaults={
                'description': 'قتلت لاعب أكاديمية - قصة إعادة ولادة في عالم لعبة أكاديمية مليء بالمخاطر',
                'author': 'Unknown',
                'status': 'ongoing',
                'views': 500000,
                'category': category,
                'cover_image_url': '/uploads/I Killed an Academy Player/1/001__001.jpg',
            }
        )
        
        if created:
            # Add genres
            genres = ['Action', 'Fantasy', 'Adventure']
            for genre_name in genres:
                genre, _ = Genre.objects.get_or_create(name=genre_name)
                manga.genres.add(genre)
            self.stdout.write(self.style.SUCCESS(f'  Created manga: {manga.title}'))
        else:
            self.stdout.write(f'  Manga already exists: {manga.title}')
        
        # Create chapters for this manga (12 chapters based on folders)
        self.stdout.write('  Creating chapters for IKAP...')
        for chapter_num in range(1, 13):  # 12 chapters
            chapter, ch_created = Chapter.objects.get_or_create(
                manga=manga,
                number=chapter_num,
                defaults={
                    'title': f'I Killed an Academy Player - الفصل {chapter_num}'
                }
            )
            
            if ch_created:
                # Create images - use the actual file naming pattern found
                # Files are: 001__001.jpg, 001__002.jpg, etc (chapter__page)
                # We have ~20+ images per chapter (based on file count)
                for page_num in range(1, 25):  # ~24 images per chapter
                    chapter_padded = str(chapter_num).zfill(3)
                    page_padded = str(page_num).zfill(3)
                    
                    # For chapter 1, all images are in folder 1
                    # The filename pattern is {chapter}__00{page}.jpg
                    image_url = f'/uploads/I Killed an Academy Player/1/{chapter_padded}__{page_padded}.jpg'
                    
                    ChapterImage.objects.get_or_create(
                        chapter=chapter,
                        page_number=page_num,
                        defaults={
                            'image_url': image_url,
                            'width': 800,
                            'height': 1200,
                            'original_filename': f'{chapter_padded}__{page_padded}.jpg'
                        }
                    )
        
        self.stdout.write(self.style.SUCCESS('  IKAP chapters created!'))
    
    def fix_chapter_images(self):
        """Update all existing chapter images to point to IKAP folder"""
        self.stdout.write('\nUpdating all chapter images to use IKAP folder...')
        
        # Fixed source folder
        source_folder = 'I Killed an Academy Player'
        
        # Get all chapter images
        images = ChapterImage.objects.all()
        updated = 0
        
        for img in images:
            # Get page number (1-24 range, cycling)
            page_in_range = ((img.page_number - 1) % 24) + 1
            
            # Use chapter 1 folder and map pages to available images
            # Images are named: 001__001.jpg to 024__003.jpg (chapter__subpage)
            # We'll map to: "chapter number" (cycling 1-24) and "sub-page" (1-3)
            chapter_part = ((page_in_range - 1) // 3) + 1  # 1-8
            sub_page = ((page_in_range - 1) % 3) + 1  # 1-3
            
            chapter_padded = str(chapter_part).zfill(3)
            page_padded = str(sub_page).zfill(3)
            
            new_url = f'/uploads/{source_folder}/1/{chapter_padded}__{page_padded}.jpg'
            
            if img.image_url != new_url:
                img.image_url = new_url
                img.save()
                updated += 1
        
        self.stdout.write(self.style.SUCCESS(f'  Updated {updated} image records'))
