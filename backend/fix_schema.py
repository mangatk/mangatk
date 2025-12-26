"""
Fix script - Add missing columns to Achievement table
Run with: python fix_schema.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def fix_schema():
    """Add missing columns to manga_achievement table"""
    with connection.cursor() as cursor:
        # Check and add slug column
        try:
            cursor.execute("ALTER TABLE manga_achievement ADD COLUMN slug VARCHAR(50) NOT NULL DEFAULT ''")
            print("✅ Added slug column")
        except Exception as e:
            if "Duplicate column" in str(e):
                print("ℹ️ slug column already exists")
            else:
                print(f"⚠️ Could not add slug: {e}")
        
        # Check and add rarity column
        try:
            cursor.execute("ALTER TABLE manga_achievement ADD COLUMN rarity VARCHAR(20) NOT NULL DEFAULT 'common'")
            print("✅ Added rarity column")
        except Exception as e:
            if "Duplicate column" in str(e):
                print("ℹ️ rarity column already exists")
            else:
                print(f"⚠️ Could not add rarity: {e}")
        
        # Check and add is_secret column
        try:
            cursor.execute("ALTER TABLE manga_achievement ADD COLUMN is_secret TINYINT(1) NOT NULL DEFAULT 0")
            print("✅ Added is_secret column")
        except Exception as e:
            if "Duplicate column" in str(e):
                print("ℹ️ is_secret column already exists")
            else:
                print(f"⚠️ Could not add is_secret: {e}")
        
        # Add unique index on slug (if not exists)
        try:
            cursor.execute("ALTER TABLE manga_achievement ADD UNIQUE INDEX slug_unique (slug)")
            print("✅ Added unique index on slug")
        except Exception as e:
            if "Duplicate key name" in str(e):
                print("ℹ️ slug index already exists")
            else:
                print(f"⚠️ Could not add slug index: {e}")
    
    print("\n✅ Schema fixed! Now run: python seed_achievements.py")

if __name__ == '__main__':
    fix_schema()
