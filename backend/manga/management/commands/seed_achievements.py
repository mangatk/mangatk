from django.core.management.base import BaseCommand
from manga.models import Achievement

class Command(BaseCommand):
    help = 'Seeds the database with the default 11 achievements'

    def handle(self, *args, **options):
        achievements_data = [
            # --- Reading ---
            {'slug': 'read_1', 'name': 'First Step', 'name_ar': 'بداية الرحلة', 'description': 'قرأت أول فصل لك', 'category': 'reading', 'requirement_type': 'chapters_read', 'requirement_value': 1, 'rarity': 'common', 'reward_points': 10},
            {'slug': 'read_10', 'name': 'Bookworm', 'name_ar': 'دودة كتب', 'description': 'قرأت 10 فصول', 'category': 'reading', 'requirement_type': 'chapters_read', 'requirement_value': 10, 'rarity': 'common', 'reward_points': 50},
            {'slug': 'read_50', 'name': 'Avid Reader', 'name_ar': 'قارئ نهم', 'description': 'قرأت 50 فصلاً', 'category': 'reading', 'requirement_type': 'chapters_read', 'requirement_value': 50, 'rarity': 'rare', 'reward_points': 150},
            {'slug': 'read_100', 'name': 'True Otaku', 'name_ar': 'أوتاكو حقيقي', 'description': 'قرأت 100 فصل', 'category': 'reading', 'requirement_type': 'chapters_read', 'requirement_value': 100, 'rarity': 'epic', 'reward_points': 500},
            {'slug': 'read_1000', 'name': 'Pirate King', 'name_ar': 'ملك القراصنة', 'description': 'قرأت 1000 فصل! أنت أسطورة!', 'category': 'reading', 'requirement_type': 'chapters_read', 'requirement_value': 1000, 'rarity': 'legendary', 'reward_points': 5000},
            
            # --- Time ---
            {'slug': 'time_1m', 'name': 'Quick Glance', 'name_ar': 'نظرة سريعة', 'description': 'قضيت دقيقة واحدة', 'category': 'time', 'requirement_type': 'time_spent_seconds', 'requirement_value': 60, 'rarity': 'common', 'reward_points': 5},
            {'slug': 'time_1h', 'name': 'High Focus', 'name_ar': 'تركيز عالي', 'description': 'ساعة من القراءة', 'category': 'time', 'requirement_type': 'time_spent_seconds', 'requirement_value': 3600, 'rarity': 'rare', 'reward_points': 100},
            {'slug': 'time_24h', 'name': 'Manga Addict', 'name_ar': 'مدمن مانجا', 'description': 'يوم كامل في الموقع', 'category': 'time', 'requirement_type': 'time_spent_seconds', 'requirement_value': 86400, 'rarity': 'epic', 'reward_points': 1000},
            
            # --- Favorites and Social ---
            {'slug': 'fav_10', 'name': 'Collector', 'name_ar': 'جامع التحف', 'description': '10 مانجات في المفضلة', 'category': 'collection', 'requirement_type': 'favorites_count', 'requirement_value': 10, 'rarity': 'rare', 'reward_points': 100},
            {'slug': 'com_100', 'name': 'Influencer', 'name_ar': 'المؤثر', 'description': '100 تعليق', 'category': 'social', 'requirement_type': 'comments_count', 'requirement_value': 100, 'rarity': 'epic', 'reward_points': 500},
            
            # --- Secrets ---
            {'slug': 'secret_night', 'name': 'Night Owl', 'name_ar': 'ساهر الليل', 'description': 'قراءة بعد 3 فجراً', 'category': 'secret', 'requirement_type': 'night_reading', 'requirement_value': 1, 'is_secret': True, 'rarity': 'epic', 'reward_points': 300},
        ]

        created_count = 0
        updated_count = 0

        for data in achievements_data:
            obj, created = Achievement.objects.update_or_create(
                slug=data['slug'],
                defaults=data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {obj.name_ar}"))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f"Updated: {obj.name_ar}"))
                
        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {created_count} new achievements and updated {updated_count} existing ones!"))
