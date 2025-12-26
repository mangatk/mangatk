"""
Django Management Command to Import Mock Data
Imports manga data from TypeScript mock files into database
"""
from django.core.management.base import BaseCommand
from manga.models import Genre, Category, Manga, Chapter, ChapterImage
import json
from datetime import datetime


class Command(BaseCommand):
    help = 'Import mock manga data into database'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data import...'))
        
        # Import categories
        self.import_categories()
        
        # Import genres
        self.import_genres()
        
        # Import manga
        self.import_manga()
        
        self.stdout.write(self.style.SUCCESS('Data import completed successfully!'))
    
    def import_categories(self):
        """Import categories from mock data"""
        self.stdout.write('Importing categories...')
        
        categories_data = {
            'best-webtoon': {
                'title': 'Best Webtoon',
                'description': 'أفضل المانغا والويبتون حسب التقييمات'
            },
            'golden-week': {
                'title': 'Golden Week',
                'description': 'مانغا الأسبوع الذهبي الأكثر شهرة'
            },
            'new-releases': {
                'title': 'New Releases',
                'description': 'أحدث الإصدارات والمانغا الجديدة'
            },
            'action-fantasy': {
                'title': 'Action & Fantasy',
                'description': 'أقوى مانغا الأكشن والخيال'
            },
            'romance-drama': {
                'title': 'Romance & Drama',
                'description': 'أجمل قصص الرومانسية والدراما'
            }
        }
        
        for slug, data in categories_data.items():
            category, created = Category.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': slug,
                    'title_ar': data['title'],
                    'description_ar': data['description']
                }
            )
            if created:
                self.stdout.write(f'  Created category: {category.title_ar}')
    
    def import_genres(self):
        """Import genres from mock data"""
        self.stdout.write('Importing genres...')
        
        genre_names = [
            'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
            'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
            'Martial Arts', 'Supernatural', 'Isekai', 'Historical'
        ]
        
        for name in genre_names:
            genre, created = Genre.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f'  Created genre: {name}')
    
    def import_manga(self):
        """Import manga from mock data"""
        self.stdout.write('Importing manga...')
        
        # Note: Image URLs will need to be updated manually or via separate script
        # For now, we'll use placeholder URLs
        
        manga_data = [
            {
                'id': '1',
                'title': 'One Piece',
                'description': 'Adventure manga about pirates',
                'imageUrl': '/images/one-pice.jpg',
                'chapterCount': 1100,
                'avgRating': 4.8,
                'genres': ['Action', 'Adventure', 'Comedy'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-01',
                'author': 'Eiichiro Oda',
                'views': 5000000,
                'category': 'best-webtoon'
            },
            {
                'id': '2',
                'title': 'Naruto',
                'description': 'Ninja adventure story',
                'imageUrl': '/images/naroto1.webp',
                'chapterCount': 700,
                'avgRating': 4.7,
                'genres': ['Action', 'Adventure', 'Fantasy'],
                'status': 'completed',
                'lastUpdated': '2023-12-01',
                'author': 'Masashi Kishimoto',
                'views': 4500000,
                'category': 'best-webtoon'
            },
            {
                'id': '3',
                'title': 'Childhood Friend of the Zenith',
                'description': 'Humanity fights giant humanoid creatures',
                'imageUrl': '/images/ch.jpg',
                'chapterCount': 139,
                'avgRating': 3.9,
                'genres': ['Action', 'Drama', 'Fantasy'],
                'status': 'completed',
                'lastUpdated': '2023-11-01',
                'author': 'Hajime Isayama',
                'views': 4000000,
                'category': 'golden-week'
            },
            {
                'id': '4',
                'title': 'الخطايا السبع',
                'description': 'Adventure manga about 7 deadly sins',
                'imageUrl': '/images/mal.jpg',
                'chapterCount': 400,
                'avgRating': 4.5,
                'genres': ['Action', 'Adventure', 'Comedy'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-01',
                'author': 'Eiichiro Oda',
                'views': 5033,
                'category': 'golden-week'
            },
            {
                'id': '5',
                'title': 'How to Get My Husband on My Side',
                'description': 'Romance manhwa about lord of north',
                'imageUrl': '/images/69.webp',
                'chapterCount': 120,
                'avgRating': 5,
                'genres': ['Romance', 'Slice of Life', 'Comedy'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-01',
                'author': 'Eiichiro Oda',
                'views': 5033,
                'category': 'golden-week'
            },
            {
                'id': '6',
                'title': 'Naruto Shippuden',
                'description': 'A young orphan ninja who seeks recognition from his peers and dreams of becoming the Hokage',
                'imageUrl': '/images/naroto.jpg',
                'chapterCount': 700,
                'avgRating': 4.8,
                'genres': ['Adventure', 'Action', 'Comedy', 'Fantasy'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-01',
                'author': 'Masashi Kishimoto',
                'views': 9539,
                'category': 'golden-week'
            },
            {
                'id': '11',
                'title': 'Escort Warrior',
                'description': 'محارب مرافق يحمي الضعفاء في عالم مليء بالمخاطر والأعداء الأقوياء',
                'imageUrl': '/images/Escort Warrior.jpg',
                'chapterCount': 78,
                'avgRating': 4.3,
                'genres': ['Action', 'Adventure', 'Martial Arts'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-15',
                'author': 'Lee Hwa',
                'views': 1850000,
                'category': 'action-fantasy'
            },
            {
                'id': '12',
                'title': 'Heavenly Inquisition Sword',
                'description': 'سيف التحقيق السماوي الذي يبحث عن الحقيقة وينصف المظلومين',
                'imageUrl': '/images/Heavenly Inquisition Sword.jpg',
                'chapterCount': 120,
                'avgRating': 4.6,
                'genres': ['Action', 'Fantasy', 'Supernatural'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-14',
                'author': 'Zhang Wei',
                'views': 2450000,
                'category': 'action-fantasy'
            },
            {
                'id': '13',
                'title': 'Heavenly Demon Cultivation Simulation',
                'description': 'محاكاة لطريق الشيطان السماوي في عالم cultivation الفريد',
                'imageUrl': '/images/Heavenly Demon Cultivation Simulation.jpg',
                'chapterCount': 95,
                'avgRating': 4.4,
                'genres': ['Fantasy', 'Action', 'Supernatural'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-13',
                'author': 'Ming Yu',
                'views': 2100000,
                'category': 'action-fantasy'
            },
            {
                'id': '14',
                'title': 'Infinite Level up in Murim',
                'description': 'صعود لا نهائي في عالم المريام مع نظام leveling فريد',
                'imageUrl': '/images/Infinite Level up in Murim.jpg',
                'chapterCount': 150,
                'avgRating': 4.8,
                'genres': ['Action', 'Martial Arts', 'Fantasy'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-16',
                'author': 'Jin Yong',
                'views': 3200000,
                'category': 'best-webtoon'
            },
            {
                'id': '15',
                'title': 'I Will Seduce The Northern Duke',
                'description': 'قصة فتاة عازمة على إغواء دوق الشمال البارد والغامض',
                'imageUrl': '/images/I Will Seduce The Northern Duke.jpg',
                'chapterCount': 65,
                'avgRating': 4.2,
                'genres': ['Romance', 'Drama', 'Fantasy'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-12',
                'author': 'Luna Rose',
                'views': 1680000,
                'category': 'romance-drama'
            },
            {
                'id': '16',
                'title': 'Reincarnation of the Suicidal Battle God',
                'description': 'إعادة تجسد إله المعركة الانتحاري في عالم جديد',
                'imageUrl': '/images/Reincarnation of the Suicidal Battle God.jpg',
                'chapterCount': 85,
                'avgRating': 4.7,
                'genres': ['Action', 'Fantasy', 'Supernatural'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-15',
                'author': 'Thor Odinson',
                'views': 2780000,
                'category': 'golden-week'
            },
            {
                'id': '17',
                'title': 'The Beginning After The End',
                'description': 'البداية بعد النهاية، رحلة ملك في عالم جديد',
                'imageUrl': '/images/The Beginning After The End.jpg',
                'chapterCount': 180,
                'avgRating': 4.9,
                'genres': ['Fantasy', 'Action', 'Adventure'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-17',
                'author': 'TurtleMe',
                'views': 4500000,
                'category': 'best-webtoon'
            },
            {
                'id': '18',
                'title': 'Terminally-Ill Genius Dark Knight',
                'description': 'فارس الظلام العبقري المصاب بمرض عضال في رحلته الأخيرة',
                'imageUrl': '/images/Terminally-Ill Genius Dark Knight.jpg',
                'chapterCount': 72,
                'avgRating': 4.5,
                'genres': ['Action', 'Drama', 'Fantasy'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-11',
                'author': 'Arthur Black',
                'views': 1950000,
                'category': 'action-fantasy'
            },
            {
                'id': '19',
                'title': 'Weak Teacher',
                'description': 'معلم ضعيف يحاول إثبات نفسه في عالم قاسي من الأقوياء',
                'imageUrl': '/images/Weak Teacher.jpg',
                'chapterCount': 58,
                'avgRating': 4.1,
                'genres': ['Comedy', 'Drama', 'Slice of Life'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-10',
                'author': 'Park Min Ho',
                'views': 1420000,
                'category': 'new-releases'
            },
            {
                'id': '20',
                'title': 'Warrior Grandpa and Supreme Granddaughter',
                'description': 'جندي عجوز وحفيدته المتفوقة في مغامرات مثيرة',
                'imageUrl': '/images/Warrior Grandpa and Supreme Granddaughter.jpg',
                'chapterCount': 45,
                'avgRating': 4.0,
                'genres': ['Comedy', 'Action', 'Slice of Life'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-09',
                'author': 'Kim Ji Hoon',
                'views': 1280000,
                'category': 'new-releases'
            },
            {
                'id': '21',
                'title': 'Under the Oak Tree',
                'description': 'قصة حب تحت شجرة البلوط، رومانسية مؤثرة ودرامية',
                'imageUrl': '/images/Under the Oak Tree.jpg',
                'chapterCount': 110,
                'avgRating': 4.6,
                'genres': ['Romance', 'Drama', 'Historical'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-14',
                'author': 'Kim Suji',
                'views': 2650000,
                'category': 'romance-drama'
            },
            {
                'id': '22',
                'title': "The Extra's Academy Survival Guide",
                'description': 'دليل البقاء للأشخاص الإضافيين في أكاديمية مليئة بالمخاطر',
                'imageUrl': "/images/The Extra's Academy Survival Guide.jpg",
                'chapterCount': 88,
                'avgRating': 4.4,
                'genres': ['Comedy', 'Fantasy', 'Adventure'],
                'status': 'ongoing',
                'lastUpdated': '2024-01-13',
                'author': 'Extra Writer',
                'views': 1980000,
                'category': 'new-releases'
            }
        ]
        
        for data in manga_data:
            # Get category
            category = None
            if data.get('category'):
                category = Category.objects.filter(slug=data['category']).first()
            
            # Create or update manga
            manga, created = Manga.objects.update_or_create(
                title=data['title'],
                defaults={
                    'description': data['description'],
                    'author': data['author'],
                    'status': data['status'],
                    'views': data['views'],
                    'category': category,
                    # Will be updated later with ImgBB URLs
                    'cover_image_url': '',  
                }
            )
            
            # Add genres
            genre_objs = Genre.objects.filter(name__in=data['genres'])
            manga.genres.set(genre_objs)
            
            if created:
                self.stdout.write(f'  Created manga: {manga.title}')
            else:
                self.stdout.write(f'  Updated manga: {manga.title}')
