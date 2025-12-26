"""
Script to seed achievements from frontend data into the database.
Run with: python manage.py shell < seed_achievements.py
Or: python manage.py runscript seed_achievements (if using django-extensions)
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from manga.models import Achievement

# Achievements data matching frontend/src/data/achievements.ts
ACHIEVEMENTS_DATA = [
    # --- القراءة ---
    {
        'slug': 'read_1',
        'name': 'First Step',
        'name_ar': 'بداية الرحلة',
        'description': 'قرأت أول فصل لك',
        'category': 'reading',
        'requirement_type': 'chapters_read',
        'requirement_value': 1,
        'rarity': 'common',
        'reward_points': 10,
    },
    {
        'slug': 'read_10',
        'name': 'Bookworm',
        'name_ar': 'دودة كتب',
        'description': 'قرأت 10 فصول',
        'category': 'reading',
        'requirement_type': 'chapters_read',
        'requirement_value': 10,
        'rarity': 'common',
        'reward_points': 25,
    },
    {
        'slug': 'read_50',
        'name': 'Avid Reader',
        'name_ar': 'قارئ نهم',
        'description': 'قرأت 50 فصلاً',
        'category': 'reading',
        'requirement_type': 'chapters_read',
        'requirement_value': 50,
        'rarity': 'rare',
        'reward_points': 50,
    },
    {
        'slug': 'read_100',
        'name': 'True Otaku',
        'name_ar': 'أوتاكو حقيقي',
        'description': 'قرأت 100 فصل',
        'category': 'reading',
        'requirement_type': 'chapters_read',
        'requirement_value': 100,
        'rarity': 'epic',
        'reward_points': 100,
    },
    {
        'slug': 'read_1000',
        'name': 'Pirate King',
        'name_ar': 'ملك القراصنة',
        'description': 'قرأت 1000 فصل! أنت أسطورة!',
        'category': 'reading',
        'requirement_type': 'chapters_read',
        'requirement_value': 1000,
        'rarity': 'legendary',
        'reward_points': 500,
    },
    
    # --- الوقت ---
    {
        'slug': 'time_1m',
        'name': 'Quick Look',
        'name_ar': 'نظرة سريعة',
        'description': 'قضيت دقيقة واحدة',
        'category': 'time',
        'requirement_type': 'time_spent',
        'requirement_value': 60,  # seconds
        'rarity': 'common',
        'reward_points': 5,
    },
    {
        'slug': 'time_1h',
        'name': 'High Focus',
        'name_ar': 'تركيز عالي',
        'description': 'ساعة من القراءة',
        'category': 'time',
        'requirement_type': 'time_spent',
        'requirement_value': 3600,  # 1 hour in seconds
        'rarity': 'rare',
        'reward_points': 50,
    },
    {
        'slug': 'time_24h',
        'name': 'Manga Addict',
        'name_ar': 'مدمن مانجا',
        'description': 'يوم كامل في الموقع',
        'category': 'time',
        'requirement_type': 'time_spent',
        'requirement_value': 86400,  # 24 hours in seconds
        'rarity': 'epic',
        'reward_points': 200,
    },
    
    # --- المفضلة والاجتماعية ---
    {
        'slug': 'fav_10',
        'name': 'Collector',
        'name_ar': 'جامع التحف',
        'description': '10 مانجات في المفضلة',
        'category': 'collection',
        'requirement_type': 'bookmarks_count',
        'requirement_value': 10,
        'rarity': 'rare',
        'reward_points': 30,
    },
    {
        'slug': 'com_100',
        'name': 'Influencer',
        'name_ar': 'المؤثر',
        'description': '100 تعليق',
        'category': 'social',
        'requirement_type': 'comments_count',
        'requirement_value': 100,
        'rarity': 'epic',
        'reward_points': 150,
    },
    
    # --- أسرار ---
    {
        'slug': 'secret_night',
        'name': 'Night Owl',
        'name_ar': 'ساهر الليل',
        'description': 'قراءة بعد 3 فجراً',
        'category': 'secret',
        'requirement_type': 'night_reading',
        'requirement_value': 1,
        'rarity': 'epic',
        'reward_points': 75,
        'is_secret': True,
    },
]


def seed_achievements():
    """Create or update achievements in database"""
    created_count = 0
    updated_count = 0
    
    for data in ACHIEVEMENTS_DATA:
        is_secret = data.pop('is_secret', False)
        
        achievement, created = Achievement.objects.update_or_create(
            slug=data['slug'],
            defaults={
                **data,
                'is_secret': is_secret,
                'is_active': True,
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {achievement.name_ar}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {achievement.name_ar}")
    
    print(f"\n📊 Summary: {created_count} created, {updated_count} updated")
    print(f"📦 Total achievements: {Achievement.objects.count()}")


if __name__ == '__main__':
    seed_achievements()
