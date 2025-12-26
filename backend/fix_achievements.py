"""
Fix script - Run this before migration to clear old achievements
Run with: python fix_achievements.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def fix_achievements():
    """Delete all existing achievements to allow clean migration"""
    with connection.cursor() as cursor:
        # Delete user achievements first (foreign key)
        try:
            cursor.execute("DELETE FROM manga_userachievement")
            print("✅ Deleted all user achievements")
        except Exception as e:
            print(f"⚠️ Could not delete user achievements: {e}")
        
        # Delete achievements
        try:
            cursor.execute("DELETE FROM manga_achievement")
            print("✅ Deleted all achievements")
        except Exception as e:
            print(f"⚠️ Could not delete achievements: {e}")
    
    print("\n✅ Done! Now run: python manage.py migrate")

if __name__ == '__main__':
    fix_achievements()
