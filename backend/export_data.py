"""
Database Export Script
Exports all data from MangaTK database to JSON files for sharing.

Run with: python export_data.py

This will create a 'data_export' folder with JSON files containing:
- Genres
- Categories  
- Manga (with genres/categories)
- Chapters
- Achievements
- Users (without passwords)
"""
import os
import sys
import json
import django
from datetime import datetime

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from manga.models import (
    Genre, Category, Manga, Chapter, ChapterImage,
    Achievement, SubscriptionPlan, User
)

# Create export directory
EXPORT_DIR = os.path.join(os.path.dirname(__file__), 'data_export')
os.makedirs(EXPORT_DIR, exist_ok=True)


def export_genres():
    """Export all genres"""
    genres = list(Genre.objects.values('id', 'name', 'slug'))
    # Convert UUID to string
    for g in genres:
        g['id'] = str(g['id'])
    
    with open(os.path.join(EXPORT_DIR, 'genres.json'), 'w', encoding='utf-8') as f:
        json.dump(genres, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported {len(genres)} genres")
    return genres


def export_categories():
    """Export all categories"""
    categories = list(Category.objects.values('id', 'name', 'slug', 'title_ar', 'description_ar'))
    for c in categories:
        c['id'] = str(c['id'])
    
    with open(os.path.join(EXPORT_DIR, 'categories.json'), 'w', encoding='utf-8') as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported {len(categories)} categories")
    return categories


def export_manga():
    """Export all manga with their genres"""
    manga_list = []
    for manga in Manga.objects.prefetch_related('genres', 'category').all():
        manga_data = {
            'id': str(manga.id),
            'title': manga.title,
            'slug': manga.slug,
            'author': manga.author,
            'description': manga.description,
            'cover_image_url': manga.cover_image_url,
            'status': manga.status,
            'views': manga.views,
            'category_slug': manga.category.slug if manga.category else None,
            'genre_slugs': [g.slug for g in manga.genres.all()],
        }
        manga_list.append(manga_data)
    
    with open(os.path.join(EXPORT_DIR, 'manga.json'), 'w', encoding='utf-8') as f:
        json.dump(manga_list, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported {len(manga_list)} manga")
    return manga_list


def export_chapters():
    """Export all chapters with their images"""
    chapters_list = []
    for chapter in Chapter.objects.select_related('manga').prefetch_related('images').all():
        chapter_data = {
            'id': str(chapter.id),
            'manga_slug': chapter.manga.slug,
            'number': float(chapter.number),
            'title': chapter.title,
            'release_date': chapter.release_date.isoformat() if chapter.release_date else None,
            'images': [
                {
                    'page_number': img.page_number,
                    'image_url': img.image_url,
                    'original_filename': img.original_filename,
                }
                for img in chapter.images.all().order_by('page_number')
            ]
        }
        chapters_list.append(chapter_data)
    
    with open(os.path.join(EXPORT_DIR, 'chapters.json'), 'w', encoding='utf-8') as f:
        json.dump(chapters_list, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported {len(chapters_list)} chapters")
    return chapters_list


def export_achievements():
    """Export all achievements"""
    achievements = []
    for ach in Achievement.objects.all():
        achievements.append({
            'slug': ach.slug,
            'name': ach.name,
            'name_ar': ach.name_ar,
            'description': ach.description,
            'category': ach.category,
            'rarity': ach.rarity,
            'requirement_type': ach.requirement_type,
            'requirement_value': ach.requirement_value,
            'reward_points': ach.reward_points,
            'is_secret': ach.is_secret,
            'is_active': ach.is_active,
        })
    
    with open(os.path.join(EXPORT_DIR, 'achievements.json'), 'w', encoding='utf-8') as f:
        json.dump(achievements, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported {len(achievements)} achievements")
    return achievements


def export_subscription_plans():
    """Export subscription plans"""
    plans = []
    for plan in SubscriptionPlan.objects.all():
        plans.append({
            'name': plan.name,
            'price': float(plan.price),
            'point_multiplier': plan.point_multiplier,
            'ads_enabled': plan.ads_enabled,
            'monthly_free_translations': plan.monthly_free_translations,
        })
    
    with open(os.path.join(EXPORT_DIR, 'subscription_plans.json'), 'w', encoding='utf-8') as f:
        json.dump(plans, f, ensure_ascii=False, indent=2)
    print(f"✅ Exported {len(plans)} subscription plans")
    return plans


def main():
    print("=" * 50)
    print("MangaTK Database Export")
    print(f"Export Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    print()
    
    export_genres()
    export_categories()
    export_manga()
    export_chapters()
    export_achievements()
    export_subscription_plans()
    
    print()
    print("=" * 50)
    print(f"✅ All data exported to: {EXPORT_DIR}")
    print("=" * 50)


if __name__ == '__main__':
    main()
