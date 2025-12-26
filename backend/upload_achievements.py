"""
Script to upload frontend achievements to backend
Run with: python upload_achievements.py
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from manga.models import Achievement

# Achievements from frontend/src/data/achievements.ts
ACHIEVEMENTS = [
    # Reading achievements
    {'id': 'read_1', 'name': 'بداية الرحلة', 'description': 'قرأت أول فصل لك', 'category': 'reading', 'requirement_value': 1, 'reward_points': 10},
    {'id': 'read_10', 'name': 'دودة كتب', 'description': 'قرأت 10 فصول', 'category': 'reading', 'requirement_value': 10, 'reward_points': 25},
    {'id': 'read_50', 'name': 'قارئ نهم', 'description': 'قرأت 50 فصلاً', 'category': 'reading', 'requirement_value': 50, 'reward_points': 50},
    {'id': 'read_100', 'name': 'أوتاكو حقيقي', 'description': 'قرأت 100 فصل', 'category': 'reading', 'requirement_value': 100, 'reward_points': 100},
    {'id': 'read_1000', 'name': 'ملك القراصنة', 'description': 'قرأت 1000 فصل! أنت أسطورة!', 'category': 'reading', 'requirement_value': 1000, 'reward_points': 500},
    
    # Time achievements (converted from seconds)
    {'id': 'time_1m', 'name': 'نظرة سريعة', 'description': 'قضيت دقيقة واحدة في القراءة', 'category': 'reading', 'requirement_value': 1, 'reward_points': 5},
    {'id': 'time_1h', 'name': 'تركيز عالي', 'description': 'ساعة من القراءة المتواصلة', 'category': 'reading', 'requirement_value': 60, 'reward_points': 30},
    {'id': 'time_24h', 'name': 'مدمن مانجا', 'description': 'يوم كامل من القراءة', 'category': 'reading', 'requirement_value': 1440, 'reward_points': 200},
    
    # Social achievements
    {'id': 'fav_10', 'name': 'جامع التحف', 'description': '10 مانجات في المفضلة', 'category': 'social', 'requirement_value': 10, 'reward_points': 40},
    {'id': 'com_100', 'name': 'المؤثر', 'description': '100 تعليق', 'category': 'social', 'requirement_value': 100, 'reward_points': 75},
    
    # Secret achievements
    {'id': 'secret_night', 'name': 'ساهر الليل', 'description': 'قراءة بعد 3 فجراً', 'category': 'social', 'requirement_value': 1, 'reward_points': 50},
]

def upload_achievements():
    created_count = 0
    updated_count = 0
    
    for ach_data in ACHIEVEMENTS:
        achievement, created = Achievement.objects.update_or_create(
            name=ach_data['name'],
            defaults={
                'description': ach_data['description'],
                'category': ach_data['category'],
                'requirement_value': ach_data['requirement_value'],
                'reward_points': ach_data['reward_points'],
                'is_active': True,
            }
        )
        
        if created:
            created_count += 1
        else:
            updated_count += 1
    
    print(f"✅ تم رفع الإنجازات بنجاح!")
    print(f"   - تم إنشاء: {created_count} إنجاز جديد")
    print(f"   - تم تحديث: {updated_count} إنجاز موجود")
    print(f"   - الإجمالي: {len(ACHIEVEMENTS)} إنجاز")

if __name__ == '__main__':
    upload_achievements()
