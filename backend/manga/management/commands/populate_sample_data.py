"""
Django management command to populate database with sample data
Creates users, ratings, comments, achievements, and bookmarks
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from manga.models import (
    User, Genre, Category, Manga, Chapter, ChapterImage,
    Rating, Comment, CommentLike, UserBookmark, ReadingHistory,
    Achievement, UserAchievement
)
import random


class Command(BaseCommand):
    help = 'Populate database with sample data including users, ratings, comments, and achievements'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting data population...'))
        
        # Create sample users
        self.create_users()
        
        # Create achievements
        self.create_achievements()
        
        # Re-import manga data
        self.import_manga_data()
        
        # Create ratings
        self.create_ratings()
        
        # Create comments
        self.create_comments()
        
        # Create bookmarks
        self.create_bookmarks()
        
        # Create reading history
        self.create_reading_history()
        
        # Assign achievements
        self.assign_achievements()
        
        self.stdout.write(self.style.SUCCESS('Data population completed!'))

    def create_users(self):
        """Create sample users"""
        self.stdout.write('Creating users...')
        
        # Superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@mangatk.com',
                password='admin123',
                bio='المسؤول الأول عن المنصة'
            )
        
        # Regular users
        users_data = [
            {'username': 'ahmed', 'email': 'ahmed@example.com', 'bio': 'أحب مانجا الأكشن والخيال'},
            {'username': 'fatima', 'email': 'fatima@example.com', 'bio': 'مهتمة بالرومانسية والدراما'},
            {'username': 'omar', 'email': 'omar@example.com', 'bio': 'قارئ محترف منذ 5 سنوات'},
            {'username': 'leila', 'email': 'leila@example.com', 'bio': 'أبحث عن المانجا المكتملة'},
            {'username': 'yassin', 'email': 'yassin@example.com', 'bio': 'أحب المانجا اليابانية الأصلية', 'is_premium': True},
        ]
        
        for data in users_data:
            if not User.objects.filter(username=data['username']).exists():
                user = User.objects.create_user(
                    username=data['username'],
                    email=data['email'],
                    password='password123',
                    bio=data.get('bio', ''),
                    is_premium=data.get('is_premium', False),
                    theme_preference=random.choice(['light', 'dark', 'auto'])
                )
                # Random stats
                user.chapters_read = random.randint(10, 200)
                user.total_reading_time = random.randint(300, 5000)
                user.save()
        
        self.stdout.write(self.style.SUCCESS(f'Created {User.objects.count()} users'))

    def create_achievements(self):
        """Create achievement definitions"""
        self.stdout.write('Creating achievements...')
        
        achievements_data = [
            {
                'name': 'First Steps',
                'name_ar': 'الخطوات الأولى',
                'description': 'Read your first chapter',
                'description_ar': 'اقرأ أول فصل لك',
                'category': 'reading',
                'requirement_type': 'chapters_read',
                'requirement_value': 1,
                'reward_points': 10
            },
            {
                'name': 'Bookworm',
                'name_ar': 'دودة الكتب',
                'description': 'Read 50 chapters',
                'description_ar': 'اقرأ 50 فصل',
                'category': 'reading',
                'requirement_type': 'chapters_read',
                'requirement_value': 50,
                'reward_points': 50
            },
            {
                'name': 'Manga Master',
                'name_ar': 'محترف المانجا',
                'description': 'Read 200 chapters',
                'description_ar': 'اقرأ 200 فصل',
                'category': 'reading',
                'requirement_type': 'chapters_read',
                'requirement_value': 200,
                'reward_points': 200
            },
            {
                'name': 'Critic',
                'name_ar': 'الناقد',
                'description': 'Rate 20 chapters',
                'description_ar': 'قيّم 20 فصل',
                'category': 'rating',
                'requirement_type': 'ratings_submitted',
                'requirement_value': 20,
                'reward_points': 30
            },
            {
                'name': 'Commenter',
                'name_ar': 'المعلق النشط',
                'description': 'Write 30 comments',
                'description_ar': 'اكتب 30 تعليق',
                'category': 'commenting',
                'requirement_type': 'comments_written',
                'requirement_value': 30,
                'reward_points': 40
            },
            {
                'name': 'Collector',
                'name_ar': 'جامع المانجا',
                'description': 'Bookmark 15 manga',
                'description_ar': 'أضف 15 مانجا للمفضلة',
                'category': 'bookmarking',
                'requirement_type': 'bookmarks_added',
                'requirement_value': 15,
                'reward_points': 25
            }
        ]
        
        for data in achievements_data:
            Achievement.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {Achievement.objects.count()} achievements'))

    def import_manga_data(self):
        """Re-import manga data from previous import"""
        self.stdout.write('Importing manga data...')
        
        # Create genres if not exist
        genres_data = [
            'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
            'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
            'Sports', 'Supernatural', 'Thriller', 'Tragedy'
        ]
        
        for genre_name in genres_data:
            Genre.objects.get_or_create(name=genre_name)
        
        # Create categories if not exist
        categories_data = [
            {'name': 'Best Webtoon', 'slug': 'best-webtoon', 'title_ar': 'أفضل ويبتون', 'description_ar': 'أفضل المانغا والويبتون حسب التقييمات'},
            {'name': 'Golden Week', 'slug': 'golden-week', 'title_ar': 'الأسبوع الذهبي', 'description_ar': 'مانغا الأسبوع الذهبي الأكثر شهرة'},
            {'name': 'New Releases', 'slug': 'new-releases', 'title_ar': 'إصدارات جديدة', 'description_ar': 'أحدث الإصدارات والمانغا الجديدة'},
            {'name': 'Action Fantasy', 'slug': 'action-fantasy', 'title_ar': 'أكشن وخيال', 'description_ar': 'أقوى مانغا الأكشن والخيال'},
            {'name': 'Romance Drama', 'slug': 'romance-drama', 'title_ar': 'رومانسية ودراما', 'description_ar': 'أجمل قصص الرومانسية والدراما'}
        ]
        
        for cat_data in categories_data:
            Category.objects.get_or_create(slug=cat_data['slug'], defaults=cat_data)
        
        # Create sample manga
        manga_list = [
            {
                'title': 'One Piece',
                'sub_titles': 'ون بيس;ワンピース;海贼王',
                'description': 'قصة مشوقة عن لوفي وطاقمه في بحثهم عن الكنز الأسطوري',
                'author': 'Eiichiro Oda',
                'status': 'ongoing',
                'cover_image_url': '/images/one-pice.jpg',
                'genres': ['Action', 'Adventure', 'Comedy'],
                'category': 'best-webtoon'
            },
            {
                'title': 'Naruto',
                'sub_titles': 'ناروتو;ナルト;火影忍者',
                'description': 'رحلة نينجا شاب لينال اعتراف العالم',
                'author': 'Masashi Kishimoto',
                'status': 'completed',
                'cover_image_url': '/images/naroto1.webp',
                'genres': ['Action', 'Adventure', 'Fantasy'],
                'category': 'best-webtoon'
            },
            {
                'title': 'Attack on Titan',
                'sub_titles': 'هجوم العمالقة;進撃の巨人;Shingeki no Kyojin',
                'description': 'البشرية تحارب العمالقة للبقاء',
                'author': 'Hajime Isayama',
                'status': 'completed',
                'cover_image_url': '/images/attack-on-titan.jpg',
                'genres': ['Action', 'Drama', 'Horror'],
                'category': 'action-fantasy'
            }
        ]
        
        for manga_data in manga_list:
            if not Manga.objects.filter(title=manga_data['title']).exists():
                genres = Genre.objects.filter(name__in=manga_data.pop('genres'))
                category = Category.objects.get(slug=manga_data.pop('category'))
                
                manga = Manga.objects.create(
                    **manga_data,
                    category=category,
                    views=random.randint(1000, 100000)
                )
                manga.genres.set(genres)
                
                # Create sample chapters
                for i in range(1, random.randint(3, 8)):
                    Chapter.objects.create(
                        manga=manga,
                        number=i,
                        title=f"الفصل {i}",
                        release_date=timezone.now().date() - timedelta(days=random.randint(1, 365))
                    )
        
        self.stdout.write(self.style.SUCCESS(f'Created {Manga.objects.count()} manga with chapters'))

    def create_ratings(self):
        """Create sample ratings"""
        self.stdout.write('Creating ratings...')
        
        users = list(User.objects.all())
        chapters = list(Chapter.objects.all())
        
        created = 0
        for _ in range(min(50, len(users) * 10)):
            user = random.choice(users)
            chapter = random.choice(chapters)
            
            if not Rating.objects.filter(user=user, chapter=chapter).exists():
                Rating.objects.create(
                    user=user,
                    chapter=chapter,
                    rating=round(random.uniform(3.0, 5.0), 1)
                )
                created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created} ratings'))

    def create_comments(self):
        """Create sample comments"""
        self.stdout.write('Creating comments...')
        
        users = list(User.objects.all())
        manga_list = list(Manga.objects.all())
        chapters = list(Chapter.objects.all())
        
        comments_text = [
            'مانجا رائعة! أحببتها كثيراً 😍',
            'الرسومات جميلة جداً',
            'القصة مشوقة ولكن بطيئة قليلاً',
            'أفضل فصل حتى الآن!',
            'متى سينزل الفصل القادم؟',
            'لا أفهم ما يحدث، هل يمكن شرح؟',
            'عمل مذهل من المؤلف',
            'أوصي الجميع بقراءة هذه المانجا',
            'الشخصيات مميزة ومعقدة',
            'النهاية كانت غير متوقعة!'
        ]
        
        created = 0
        # Manga comments
        for _ in range(20):
            Comment.objects.create(
                user=random.choice(users),
                comment_type='manga',
                manga=random.choice(manga_list),
                content=random.choice(comments_text)
            )
            created += 1
        
        # Chapter comments
        for _ in range(30):
            Comment.objects.create(
                user=random.choice(users),
                comment_type='chapter',
                chapter=random.choice(chapters),
                content=random.choice(comments_text)
            )
            created += 1
        
        # Add some likes
        comments = list(Comment.objects.all())
        for _ in range(40):
            user = random.choice(users)
            comment = random.choice(comments)
            if not CommentLike.objects.filter(user=user, comment=comment).exists():
                CommentLike.objects.create(user=user, comment=comment)
        
        self.stdout.write(self.style.SUCCESS(f'Created {created} comments with likes'))

    def create_bookmarks(self):
        """Create sample bookmarks"""
        self.stdout.write('Creating bookmarks...')
        
        users = list(User.objects.all())
        manga_list = list(Manga.objects.all())
        
        created = 0
        for user in users:
            # Each user bookmarks 2-5 manga
            for manga in random.sample(manga_list, min(random.randint(2, 5), len(manga_list))):
                if not UserBookmark.objects.filter(user=user, manga=manga).exists():
                    UserBookmark.objects.create(user=user, manga=manga)
                    created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created} bookmarks'))

    def create_reading_history(self):
        """Create sample reading history"""
        self.stdout.write('Creating reading history...')
        
        users = list(User.objects.all())
        chapters = list(Chapter.objects.all())
        
        created = 0
        for user in users:
            # Each user has read 3-10 chapters
            for chapter in random.sample(chapters, min(random.randint(3, 10), len(chapters))):
                if not ReadingHistory.objects.filter(user=user, manga=chapter.manga, chapter=chapter).exists():
                    ReadingHistory.objects.create(
                        user=user,
                        manga=chapter.manga,
                        chapter=chapter,
                        last_page=random.randint(1, 20),
                        progress_percentage=round(random.uniform(10, 100), 2)
                    )
                    created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created} reading history entries'))

    def assign_achievements(self):
        """Assign achievements to users based on their activity"""
        self.stdout.write('Assigning achievements...')
        
        users = User.objects.all()
        achievements = Achievement.objects.all()
        
        assigned = 0
        for user in users:
            # Calculate user stats
            chapters_read = user.reading_history.count()
            ratings_count = user.ratings.count()
            comments_count = user.comments.count()
            bookmarks_count = user.bookmarks.count()
            
            for achievement in achievements:
                # Check if user meets requirements
                progress = 0
                completed = False
                
                if achievement.requirement_type == 'chapters_read':
                    progress = chapters_read
                elif achievement.requirement_type == 'ratings_submitted':
                    progress = ratings_count
                elif achievement.requirement_type == 'comments_written':
                    progress = comments_count
                elif achievement.requirement_type == 'bookmarks_added':
                    progress = bookmarks_count
                
                if progress >= achievement.requirement_value:
                    completed = True
                    earned_at = timezone.now() - timedelta(days=random.randint(1, 30))
                else:
                    earned_at = None
                
                if not UserAchievement.objects.filter(user=user, achievement=achievement).exists():
                    UserAchievement.objects.create(
                        user=user,
                        achievement=achievement,
                        progress=progress,
                        is_completed=completed,
                        earned_at=earned_at
                    )
                    assigned += 1
        
        self.stdout.write(self.style.SUCCESS(f'Assigned {assigned} user achievements'))
