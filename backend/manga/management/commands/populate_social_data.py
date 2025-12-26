"""
Django management command to populate social data for EXISTING manga
Creates users, ratings, comments, achievements, and bookmarks without creating new manga
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from manga.models import (
    User, Manga, Chapter, Rating, Comment, 
    CommentLike, UserBookmark, ReadingHistory,
    Achievement, UserAchievement
)
import random


class Command(BaseCommand):
    help = 'Populate social data (users, ratings, comments) for existing manga'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting social data population...'))
        
        # Check if we have manga
        if not Manga.objects.exists():
            self.stdout.write(self.style.ERROR('No manga found! Please import manga data first.'))
            return

        # Create sample users
        self.create_users()
        
        # Create achievements
        self.create_achievements()
        
        # Create chapters for existing manga (if they don't have enough)
        self.ensure_chapters()
        
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
        
        self.stdout.write(self.style.SUCCESS('Social data population completed!'))

    def create_users(self):
        """Create sample users"""
        self.stdout.write('Creating users...')
        
        # Superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@mangatk.com',
                password='admin123',
                bio='Admin User'
            )
        
        # Regular users
        users_data = [
            {'username': 'ahmed', 'email': 'ahmed@example.com', 'bio': 'Manga Lover'},
            {'username': 'fatima', 'email': 'fatima@example.com', 'bio': 'Romance Fan'},
            {'username': 'omar', 'email': 'omar@example.com', 'bio': 'Pro Reader'},
            {'username': 'leila', 'email': 'leila@example.com', 'bio': 'Completed Only'},
            {'username': 'yassin', 'email': 'yassin@example.com', 'bio': 'Premium User', 'is_premium': True},
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
                user.save()
        
        self.stdout.write(self.style.SUCCESS(f'Users ready: {User.objects.count()}'))

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
            }
        ]
        
        for data in achievements_data:
            Achievement.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
        
        self.stdout.write(self.style.SUCCESS(f'Achievements ready: {Achievement.objects.count()}'))

    def ensure_chapters(self):
        """Ensure each manga has some chapters"""
        self.stdout.write('Ensuring chapters exist...')
        
        for manga in Manga.objects.all():
            if manga.chapters.count() < 3:
                for i in range(1, random.randint(5, 10)):
                    if not Chapter.objects.filter(manga=manga, number=i).exists():
                        Chapter.objects.create(
                            manga=manga,
                            number=i,
                            title=f"Chapter {i}",
                            release_date=timezone.now().date() - timedelta(days=random.randint(1, 365))
                        )
        
        self.stdout.write(self.style.SUCCESS(f'Total chapters: {Chapter.objects.count()}'))

    def create_ratings(self):
        """Create sample ratings"""
        self.stdout.write('Creating ratings...')
        
        users = list(User.objects.all())
        chapters = list(Chapter.objects.all())
        
        if not chapters:
            return

        created = 0
        for _ in range(min(100, len(users) * 20)):
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
            'Great manga! Loved it 😍',
            'Amazing art style',
            'Story is a bit slow but good',
            'Best chapter so far!',
            'When is the next update?',
            'Can someone explain the ending?',
            'Masterpiece!',
            'Highly recommended',
            'Characters are so deep',
            'Unexpected plot twist!'
        ]
        
        created = 0
        # Manga comments
        for _ in range(30):
            Comment.objects.create(
                user=random.choice(users),
                comment_type='manga',
                manga=random.choice(manga_list),
                content=random.choice(comments_text)
            )
            created += 1
        
        # Chapter comments
        if chapters:
            for _ in range(40):
                Comment.objects.create(
                    user=random.choice(users),
                    comment_type='chapter',
                    chapter=random.choice(chapters),
                    content=random.choice(comments_text)
                )
                created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created} comments'))

    def create_bookmarks(self):
        """Create sample bookmarks"""
        self.stdout.write('Creating bookmarks...')
        
        users = list(User.objects.all())
        manga_list = list(Manga.objects.all())
        
        created = 0
        for user in users:
            # Each user bookmarks 3-6 manga
            for manga in random.sample(manga_list, min(random.randint(3, 6), len(manga_list))):
                if not UserBookmark.objects.filter(user=user, manga=manga).exists():
                    UserBookmark.objects.create(user=user, manga=manga)
                    created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created} bookmarks'))

    def create_reading_history(self):
        """Create sample reading history"""
        self.stdout.write('Creating reading history...')
        
        users = list(User.objects.all())
        chapters = list(Chapter.objects.all())
        
        if not chapters:
            return

        created = 0
        for user in users:
            # Each user has read 5-15 chapters
            for chapter in random.sample(chapters, min(random.randint(5, 15), len(chapters))):
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
        """Assign achievements to users"""
        self.stdout.write('Assigning achievements...')
        
        users = User.objects.all()
        achievements = Achievement.objects.all()
        
        assigned = 0
        for user in users:
            # Simple logic: assign random achievements for demo
            for achievement in achievements:
                if random.random() > 0.7:  # 30% chance to have achievement
                    if not UserAchievement.objects.filter(user=user, achievement=achievement).exists():
                        UserAchievement.objects.create(
                            user=user,
                            achievement=achievement,
                            progress=achievement.requirement_value,
                            is_completed=True,
                            earned_at=timezone.now() - timedelta(days=random.randint(1, 30))
                        )
                        assigned += 1
        
        self.stdout.write(self.style.SUCCESS(f'Assigned {assigned} user achievements'))
