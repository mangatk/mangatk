"""
Script to create admin user
Run with: python create_admin.py
"""
import os
import sys
import django

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from manga.models import User

# Create or update admin user
admin, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@manga.com',
        'is_staff': True,
        'is_superuser': True,
    }
)

admin.set_password('admin123')
admin.is_staff = True
admin.is_superuser = True
admin.save()

if created:
    print("✅ تم إنشاء حساب المدير بنجاح!")
else:
    print("✅ تم تحديث كلمة مرور المدير!")

print("\nبيانات الدخول:")
print("  Username: admin")
print("  Password: admin123")
print("  Email: admin@manga.com")
