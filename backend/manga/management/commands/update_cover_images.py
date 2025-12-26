"""
Update manga cover images with local paths
"""
from django.core.management.base import BaseCommand
from manga.models import Manga


class Command(BaseCommand):
    help = 'Update manga cover images with local paths'

    def handle(self, *args, **kwargs):
        self.stdout.write('Updating manga cover images...')
        
        # Mapping of manga titles to image filenames
        image_mapping = {
            'One Piece': '/images/one-pice.jpg',
            'Naruto': '/images/naroto1.webp',
            'Childhood Friend of the Zenith': '/images/ch.jpg',
            'الخطايا السبع': '/images/mal.jpg',
            'How to Get My Husband on My Side': '/images/69.webp',
            'Naruto Shippuden': '/images/naroto.jpg',
            'Escort Warrior': '/images/Escort Warrior.jpg',
            'Heavenly Inquisition Sword': '/images/Heavenly Inquisition Sword.jpg',
            'Heavenly Demon Cultivation Simulation': '/images/Heavenly Demon Cultivation Simulation.jpg',
            'Infinite Level up in Murim': '/images/Infinite Level up in Murim.jpg',
            'I Will Seduce The Northern Duke': '/images/I Will Seduce The Northern Duke.jpg',
            'Reincarnation of the Suicidal Battle God': '/images/Reincarnation of the Suicidal Battle God.jpg',
            'The Beginning After The End': '/images/The Beginning After The End.jpg',
            'Terminally-Ill Genius Dark Knight': '/images/Terminally-Ill Genius Dark Knight.jpg',
            'Weak Teacher': '/images/Weak Teacher.jpg',
            'Warrior Grandpa and Supreme Granddaughter': '/images/Warrior Grandpa and Supreme Granddaughter.jpg',
            'Under the Oak Tree': '/images/Under the Oak Tree.jpg',
            "The Extra's Academy Survival Guide": "/images/The Extra's Academy Survival Guide.jpg",
        }
        
        updated_count = 0
        for title, image_path in image_mapping.items():
            try:
                manga = Manga.objects.get(title=title)
                manga.cover_image_url = image_path
                manga.save()
                self.stdout.write(f'  Updated: {title}')
                updated_count += 1
            except Manga.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Not found: {title}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nUpdated {updated_count} manga cover images!'))
