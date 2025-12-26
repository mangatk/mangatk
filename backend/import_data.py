"""
Database Import Script
Imports data exported by export_data.py into a fresh MangaTK database.

Run with: python import_data.py

Prerequisites:
1. Database is set up and migrations are applied
2. data_export folder exists with JSON files from export_data.py
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

from django.utils.dateparse import parse_datetime, parse_date
from manga.models import (
    Genre, Category, Manga, Chapter, ChapterImage,
    Achievement, SubscriptionPlan
)

# Import directory
IMPORT_DIR = os.path.join(os.path.dirname(__file__), 'data_export')


def load_json(filename):
    """Load JSON file from import directory"""
    filepath = os.path.join(IMPORT_DIR, filename)
    if not os.path.exists(filepath):
        print(f"⚠️ File not found: {filename}")
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def import_genres():
    """Import genres"""
    genres = load_json('genres.json')
    created = 0
    for g in genres:
        _, is_new = Genre.objects.update_or_create(
            slug=g['slug'],
            defaults={'name': g['name']}
        )
        if is_new:
            created += 1
    print(f"✅ Imported {len(genres)} genres ({created} new)")


def import_categories():
    """Import categories"""
    categories = load_json('categories.json')
    created = 0
    for c in categories:
        _, is_new = Category.objects.update_or_create(
            slug=c['slug'],
            defaults={
                'name': c['name'],
                'title_ar': c.get('title_ar', ''),
                'description_ar': c.get('description_ar', ''),
            }
        )
        if is_new:
            created += 1
    print(f"✅ Imported {len(categories)} categories ({created} new)")


def import_manga():
    """Import manga with genres and categories"""
    manga_list = load_json('manga.json')
    created = 0
    
    for m in manga_list:
        # Get category
        category = None
        if m.get('category_slug'):
            category = Category.objects.filter(slug=m['category_slug']).first()
        
        # Create or update manga
        manga, is_new = Manga.objects.update_or_create(
            slug=m['slug'],
            defaults={
                'title': m['title'],
                'author': m.get('author', ''),
                'description': m.get('description', ''),
                'cover_image_url': m.get('cover_image_url', ''),
                'status': m.get('status', 'ongoing'),
                'views': m.get('views', 0),
                'category': category,
            }
        )
        
        # Set genres
        if m.get('genre_slugs'):
            genres = Genre.objects.filter(slug__in=m['genre_slugs'])
            manga.genres.set(genres)
        
        if is_new:
            created += 1
    
    print(f"✅ Imported {len(manga_list)} manga ({created} new)")


def import_chapters():
    """Import chapters with images"""
    chapters_list = load_json('chapters.json')
    created = 0
    
    for ch in chapters_list:
        # Find manga by slug
        manga = Manga.objects.filter(slug=ch['manga_slug']).first()
        if not manga:
            print(f"  ⚠️ Manga not found: {ch['manga_slug']}")
            continue
        
        # Parse release date
        release_date = None
        if ch.get('release_date'):
            try:
                release_date = parse_date(ch['release_date'][:10])
            except:
                pass
        
        # Create or update chapter
        chapter, is_new = Chapter.objects.update_or_create(
            manga=manga,
            number=ch['number'],
            defaults={
                'title': ch.get('title', ''),
                'release_date': release_date,
            }
        )
        
        # Import images
        if is_new and ch.get('images'):
            for img in ch['images']:
                ChapterImage.objects.get_or_create(
                    chapter=chapter,
                    page_number=img['page_number'],
                    defaults={
                        'image_url': img['image_url'],
                        'original_filename': img.get('original_filename', ''),
                    }
                )
        
        if is_new:
            created += 1
    
    print(f"✅ Imported {len(chapters_list)} chapters ({created} new)")


def import_achievements():
    """Import achievements"""
    achievements = load_json('achievements.json')
    created = 0
    
    for ach in achievements:
        _, is_new = Achievement.objects.update_or_create(
            slug=ach['slug'],
            defaults={
                'name': ach['name'],
                'name_ar': ach['name_ar'],
                'description': ach['description'],
                'category': ach['category'],
                'rarity': ach.get('rarity', 'common'),
                'requirement_type': ach['requirement_type'],
                'requirement_value': ach['requirement_value'],
                'reward_points': ach.get('reward_points', 10),
                'is_secret': ach.get('is_secret', False),
                'is_active': ach.get('is_active', True),
            }
        )
        if is_new:
            created += 1
    
    print(f"✅ Imported {len(achievements)} achievements ({created} new)")


def import_subscription_plans():
    """Import subscription plans"""
    plans = load_json('subscription_plans.json')
    created = 0
    
    for plan in plans:
        _, is_new = SubscriptionPlan.objects.update_or_create(
            name=plan['name'],
            defaults={
                'price': plan['price'],
                'point_multiplier': plan.get('point_multiplier', 1.0),
                'ads_enabled': plan.get('ads_enabled', True),
                'monthly_free_translations': plan.get('monthly_free_translations', 0),
            }
        )
        if is_new:
            created += 1
    
    print(f"✅ Imported {len(plans)} subscription plans ({created} new)")


def main():
    print("=" * 50)
    print("MangaTK Database Import")
    print(f"Import Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Source: {IMPORT_DIR}")
    print("=" * 50)
    print()
    
    if not os.path.exists(IMPORT_DIR):
        print(f"❌ Error: Import directory not found: {IMPORT_DIR}")
        print("Run export_data.py first to create export files.")
        return
    
    import_genres()
    import_categories()
    import_manga()
    import_chapters()
    import_achievements()
    import_subscription_plans()
    
    print()
    print("=" * 50)
    print("✅ Import complete!")
    print("=" * 50)


if __name__ == '__main__':
    main()
