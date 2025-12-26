"""
Django management command to upload manga cover images to ImgBB
Reads local images and uploads them to ImgBB, then updates database URLs
"""
from django.core.management.base import BaseCommand
from manga.models import Manga
from manga.services.imgbb import ImgBBService
import os
from pathlib import Path


class Command(BaseCommand):
    help = 'Upload manga cover images to ImgBB and update database URLs'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting image upload to ImgBB...'))
        
        # Define image paths mapping
        image_paths = {
            'One Piece': 'one-pice.jpg',
            'Naruto': 'naroto1.webp',
            'Childhood Friend of the Zenith': 'ch.jpg',
            'الخطايا السبع': 'mal.jpg',
            'How to Get My Husband on My Side': '69.webp',
            'Naruto Shippuden': 'naroto.jpg',
            'Escort Warrior': 'Escort Warrior.jpg',
            'Heavenly Inquisition Sword': 'Heavenly Inquisition Sword.jpg',
            'Heavenly Demon Cultivation Simulation': 'Heavenly Demon Cultivation Simulation.jpg',
            'Infinite Level up in Murim': 'Infinite Level up in Murim.jpg',
            'I Will Seduce The Northern Duke': 'I Will Seduce The Northern Duke.jpg',
            'Reincarnation of the Suicidal Battle God': 'Reincarnation of the Suicidal Battle God.jpg',
            'The Beginning After The End': 'The Beginning After The End.jpg',
            'Terminally-Ill Genius Dark Knight': 'Terminally-Ill Genius Dark Knight.jpg',
            'Weak Teacher': 'Weak Teacher.jpg',
            'Warrior Grandpa and Supreme Granddaughter': 'Warrior Grandpa and Supreme Granddaughter.jpg',
            'Under the Oak Tree': 'Under the Oak Tree.jpg',
            "The Extra's Academy Survival Guide": "The Extra's Academy Survival Guide.jpg",
        }
        
        # Get frontend images directory - fixed path
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        frontend_images_dir = base_dir / 'frontend' / 'public' / 'images'
        
        self.stdout.write(f'Looking for images in: {frontend_images_dir}')
        
        uploaded_count = 0
        failed_count = 0
        
        for manga in Manga.objects.all():
            if manga.title not in image_paths:
                self.stdout.write(self.style.WARNING(f'  No image mapping for: {manga.title}'))
                continue
            
            image_filename = image_paths[manga.title]
            image_path = frontend_images_dir / image_filename
            
            if not image_path.exists():
                self.stdout.write(self.style.ERROR(f'  Image not found: {image_path}'))
                failed_count += 1
                continue
            
            try:
                # Read image file
                # Upload to ImgBB - passing file path directly as supported by service
                result = ImgBBService.upload_image(
                    image_file=str(image_path),
                    name=f"{manga.slug}_cover"
                )
                
                if result:
                    # Update manga with ImgBB URL
                    manga.cover_image_url = result['display_url']
                    manga.save() 
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'  + Uploaded {manga.title}: {result["display_url"]}'
                    ))
                    uploaded_count += 1
                else:
                    self.stdout.write(self.style.ERROR(f'  - Failed to upload {manga.title}'))
                    failed_count += 1
                        
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ! Error with {manga.title}: {str(e)}'))
                failed_count += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'\nUpload complete: {uploaded_count} succeeded, {failed_count} failed'
        ))
