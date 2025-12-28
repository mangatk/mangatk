import uuid
import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify
from django.db.models import Avg
from django.core.validators import FileExtensionValidator

# ==================== SUBSCRIPTION & POINTS SYSTEM ====================

class SubscriptionPlan(models.Model):
    """
    خطط الاشتراكات - يمكن للمدير إضافة/تعديل/حذف الخطط
    """
    DURATION_CHOICES = [
        ('monthly', 'شهري'),
        ('yearly', 'سنوي'),
        ('lifetime', 'لا محدود'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="اسم الخطة")
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="سعر الاشتراك")
    duration_type = models.CharField(max_length=10, choices=DURATION_CHOICES, default='monthly', help_text="نوع المدة")
    
    # الخصم
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00,
        help_text="نسبة الخصم (0-100)"
    )
    
    # الميزات
    point_multiplier = models.FloatField(default=1.0, help_text="مضاعف النقاط (1.0, 1.5, 2.0)")
    ads_enabled = models.BooleanField(default=True, help_text="هل الإعلانات مفعلة؟")
    monthly_free_translations = models.PositiveIntegerField(default=0, help_text="عدد الترجمات المجانية شهرياً")
    features = models.JSONField(default=list, blank=True, help_text="ميزات إضافية كقائمة نصوص")
    description = models.TextField(blank=True, help_text="وصف الخطة")
    
    is_active = models.BooleanField(default=True, help_text="هل الخطة مفعلة؟")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    @property
    def discounted_price(self):
        """السعر بعد الخصم"""
        if self.discount_percentage > 0:
            from decimal import Decimal
            discount = self.price * (self.discount_percentage / Decimal('100'))
            return self.price - discount
        return self.price

    def __str__(self):
        return self.name


# ==================== BASIC CONTENT MODELS ====================

class Genre(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    title_ar = models.CharField(max_length=200, verbose_name='Arabic Title')
    description_ar = models.TextField(verbose_name='Arabic Description', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Manga(models.Model):
    STATUS_CHOICES = [('ongoing', 'Ongoing'), ('completed', 'Completed')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    sub_titles = models.TextField(blank=True, help_text="Alternative titles separated by ;")
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField(blank=True)
    author = models.CharField(max_length=200, blank=True)
    
    cover_image_url = models.URLField(max_length=500, blank=True)
    banner_image_url = models.URLField(max_length=500, blank=True)
    is_featured = models.BooleanField(default=False, help_text="يظهر في البنر الرئيسي")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ongoing')
    views = models.PositiveIntegerField(default=0)
    
    genres = models.ManyToManyField(Genre, related_name='mangas', blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='mangas')
    
    # تاريخ النشر - يتم تحديثه تلقائياً من أول فصل
    publish_date = models.DateField(null=True, blank=True, help_text="تاريخ نشر أول فصل")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # تمت الإضافة: لحل مشكلة MangaAdmin
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            unique_slug = slugify(self.title)
            if Manga.objects.filter(slug=unique_slug).exists() and not self.pk:
                unique_slug = f"{unique_slug}-{uuid.uuid4().hex[:6]}"
            self.slug = unique_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
    
    def update_publish_date(self):
        """تحديث تاريخ النشر من أول فصل (أقل رقم)"""
        first_chapter = self.chapters.order_by('number').first()
        if first_chapter:
            self.publish_date = first_chapter.release_date
            self.save(update_fields=['publish_date'])
        
    @property
    def chapter_count(self):
        return self.chapters.count()
    
    @property
    def avg_rating(self):
        avg = self.chapters.aggregate(Avg('ratings__rating'))['ratings__rating__avg']
        return round(avg, 1) if avg else 0.0

    @property
    def has_banner(self):
        """يشير إلى ما إذا كانت المانجا تحتوي على صورة بنر"""
        return bool(self.banner_image_url)


class Chapter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    manga = models.ForeignKey(Manga, on_delete=models.CASCADE, related_name='chapters')
    number = models.FloatField(default=0)
    title = models.CharField(max_length=300, blank=True)
    release_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # تمت الإضافة: لحل مشكلة ChapterAdmin (تخزين الكاش للتقييم)
    _cached_avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0, null=True, blank=True)
    
    class Meta:
        ordering = ['manga', '-number']
        unique_together = ['manga', 'number']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # تحديث تاريخ نشر المانجا إذا كان هذا أول فصل أو تم تعديل تاريخ أول فصل
        first_chapter = self.manga.chapters.order_by('number').first()
        if first_chapter and first_chapter.id == self.id:
            self.manga.publish_date = self.release_date
            self.manga.save(update_fields=['publish_date'])
        
    def __str__(self):
        return f"{self.manga.title} - Ch {self.number}"
        
    @property
    def image_count(self):
        return self.images.count()
    
    @property
    def avg_rating(self):
        """Calculate average rating for this chapter"""
        avg = self.ratings.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0


class ChapterImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500)
    page_number = models.PositiveIntegerField()
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    
    # تمت الإضافة: لحل مشكلة ChapterImageAdmin
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['chapter', 'page_number']
        unique_together = ['chapter', 'page_number']


# ==================== USER SYSTEM & GAMIFICATION ====================

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar_url = models.URLField(max_length=500, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    equipped_title = models.CharField(max_length=100, blank=True, help_text="اللقب المجهز من الإنجازات")
    
    # Reading Stats
    total_reading_time = models.PositiveIntegerField(default=0)
    chapters_read = models.PositiveIntegerField(default=0)
    
    # Points & Subscription
    # New users start with 100 points
    points = models.IntegerField(default=100, help_text="Currency for translations and rewards")
    subscription_plan = models.ForeignKey(
        SubscriptionPlan, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    # Keeping is_premium for backward compatibility or simple checks
    is_premium = models.BooleanField(default=False) 
    
    theme_preference = models.CharField(
        max_length=20, 
        default='auto', 
        choices=[('light', 'Light'), ('dark', 'Dark'), ('auto', 'Auto')]
    )
    
    def __str__(self):
        return self.username
        
    def add_points(self, amount, reason=''):
        """Add points to user with subscription multiplier"""
        multiplier = self.subscription_plan.point_multiplier if self.subscription_plan else 1.0
        final_amount = int(amount * multiplier)
        self.points += final_amount
        self.save()
        return final_amount
    
    def deduct_points(self, amount, reason=''):
        """Deduct points from user. Returns True if successful, False if insufficient."""
        if self.points >= amount:
            self.points -= amount
            self.save()
            return True
        return False
    
    def can_afford(self, amount):
        """Check if user has enough points"""
        return self.points >= amount

    # تمت الإضافة: خصائص (Properties) لحل أخطاء Admin التي تبحث عن هذه الحقول
    @property
    def achievement_count(self):
        return self.user_achievements.count()

    @property
    def bookmark_count(self):
        return self.bookmarks.count()


class UserBookmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    manga = models.ForeignKey(Manga, on_delete=models.CASCADE, related_name='bookmarked_by')
    added_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['user', 'manga']
        ordering = ['-added_at']


class ReadingHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reading_history')
    manga = models.ForeignKey(Manga, on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    
    last_page = models.PositiveIntegerField(default=1)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # New: Track if points were awarded for this chapter
    points_claimed = models.BooleanField(default=False)
    
    first_read = models.DateTimeField(auto_now_add=True)
    last_read = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'manga', 'chapter']
        ordering = ['-last_read']


class MangaView(models.Model):
    """Track unique views per user per manga to prevent duplicate counting"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='manga_views', null=True, blank=True)
    manga = models.ForeignKey(Manga, on_delete=models.CASCADE, related_name='user_views')
    ip_address = models.GenericIPAddressField(null=True, blank=True)  # For anonymous users
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # user can be null for anonymous, so we track by IP too
        unique_together = ['user', 'manga']
        ordering = ['-viewed_at']
    
    @classmethod
    def record_view(cls, manga, user=None, ip_address=None):
        """Record a view and return True if it's a new unique view"""
        if user and user.is_authenticated:
            view, created = cls.objects.get_or_create(
                user=user,
                manga=manga,
                defaults={'ip_address': ip_address}
            )
            return created
        elif ip_address:
            # For anonymous users, check by IP
            exists = cls.objects.filter(
                user__isnull=True,
                manga=manga,
                ip_address=ip_address
            ).exists()
            if not exists:
                cls.objects.create(manga=manga, ip_address=ip_address)
                return True
        return False


# ==================== AI TRANSLATION SYSTEM ====================

class AIModelConfig(models.Model):
    """Configuration for the AI Translation API"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    api_url = models.URLField(help_text="Endpoint for the translation model")
    api_key = models.CharField(max_length=255, blank=True, help_text="Optional API Key")
    is_active = models.BooleanField(default=True)
    cost_per_page = models.IntegerField(default=1, help_text="Points cost per image translated")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

def translation_upload_path(instance, filename):
    # Separate uploads by user and request ID
    return f'translations/inputs/{instance.user.id}/{instance.id}/{filename}'

def translation_output_path(instance, filename):
    return f'translations/outputs/{instance.user.id}/{instance.id}/{filename}'

class TranslationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'قيد الانتظار'),
        ('checking', 'جاري الفحص الأمني'),
        ('processing', 'جاري الترجمة'),
        ('compressing', 'جاري الضغط'),
        ('completed', 'مكتمل'),
        ('failed', 'فشل'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='translation_requests')
    
    # Input
    input_file = models.FileField(
        upload_to=translation_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['zip', 'cbz', 'jpg', 'jpeg', 'png', 'webp'])]
    )
    
    # AI Config used
    ai_model = models.ForeignKey(AIModelConfig, on_delete=models.SET_NULL, null=True)
    
    # Process Info
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    page_count = models.IntegerField(default=0)
    points_cost = models.IntegerField(default=0)
    
    # Output
    output_file = models.FileField(upload_to=translation_output_path, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Translation {self.id} - {self.status}"


class Notification(models.Model):
    """System Notifications (e.g., Translation Finished)"""
    TYPE_CHOICES = [
        ('translation', 'Translation'),
        ('system', 'System'),
        ('points', 'Points'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    is_read = models.BooleanField(default=False)
    
    # Link to related object (e.g. TranslationRequest ID)
    reference_id = models.UUIDField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


# ==================== SOCIAL & ACHIEVEMENTS ====================

class Rating(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='ratings')
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    
    # تمت الإضافة: لحل مشكلة RatingAdmin
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'chapter']


class Comment(models.Model):
    COMMENT_TYPE_CHOICES = [('manga', 'Manga'), ('chapter', 'Chapter')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    comment_type = models.CharField(max_length=10, choices=COMMENT_TYPE_CHOICES)
    
    manga = models.ForeignKey(Manga, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    
    content = models.TextField(max_length=1000)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    likes_count = models.PositiveIntegerField(default=0)
    
    # تمت الإضافة: لحل مشاكل CommentAdmin (الفلترة والحقول)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']


class CommentLike(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'comment']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.comment.likes_count = self.comment.likes.count()
        self.comment.save()

    def delete(self, *args, **kwargs):
        comment = self.comment
        super().delete(*args, **kwargs)
        comment.likes_count = comment.likes.count()
        comment.save()


class Achievement(models.Model):
    """Achievement model matching frontend structure"""
    CATEGORY_CHOICES = [
        ('reading', 'القراءة'),
        ('time', 'الوقت'),
        ('collection', 'المجموعة'),
        ('social', 'التواصل'),
        ('secret', 'سري'),
    ]
    
    RARITY_CHOICES = [
        ('common', 'عادي'),
        ('rare', 'نادر'),
        ('epic', 'ملحمي'),
        ('legendary', 'أسطوري'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=50, unique=True, help_text="Unique ID like read_1, time_1h")
    name = models.CharField(max_length=100)  # English name
    name_ar = models.CharField(max_length=100, help_text="Arabic name")
    description = models.TextField()
    icon_url = models.URLField(blank=True)
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')
    
    requirement_type = models.CharField(max_length=50, help_text="Type: chapters_read, time_spent, etc")
    requirement_value = models.IntegerField(help_text="Threshold value to unlock")
    
    reward_points = models.IntegerField(default=10)
    is_secret = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Optional: Link to specific manga for manga-specific achievements
    target_manga = models.ForeignKey(
        Manga, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='achievements',
        help_text="If set, this achievement is for completing/reading this specific manga"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'requirement_value']
    
    def __str__(self):
        return f"{self.name_ar} ({self.slug})"

class UserAchievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)
    progress = models.IntegerField(default=0)
    
    # تمت الإضافة: لحل مشكلة UserAchievementAdmin
    created_at = models.DateTimeField(auto_now_add=True) # للمطابقة مع طلب الـ Admin
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'achievement']


# ==================== AI TRANSLATION SYSTEM ====================

class AITranslationModel(models.Model):
    """
    نموذج لحفظ إعدادات نماذج الذكاء الاصطناعي المستخدمة في الترجمة
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text="اسم النموذج")
    api_endpoint = models.URLField(max_length=500, help_text="رابط API للنموذج")
    api_key = models.CharField(max_length=500, blank=True, help_text="مفتاح API (اختياري)")
    
    # إعدادات إضافية (JSON)
    extra_headers = models.JSONField(default=dict, blank=True, help_text="Headers إضافية")
    request_template = models.JSONField(default=dict, blank=True, help_text="قالب الطلب JSON")
    response_path = models.CharField(max_length=200, default='translated_image', help_text="مسار الصورة في الرد (مثل: data.image)")
    
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="النموذج الافتراضي")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name = 'AI Translation Model'
        verbose_name_plural = 'AI Translation Models'
    
    def __str__(self):
        return f"{self.name}"
    
    def save(self, *args, **kwargs):
        # إذا تم تعيين هذا النموذج كافتراضي، أزل الافتراضي من البقية
        if self.is_default:
            AITranslationModel.objects.filter(is_default=True).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)


class TranslationJob(models.Model):
    """
    تتبع مهام الترجمة
    """
    STATUS_CHOICES = [
        ('uploading', 'جاري الرفع'),
        ('extracting', 'جاري فك الضغط'),
        ('translating', 'جاري الترجمة'),
        ('creating_cbz', 'جاري إنشاء الملف'),
        ('completed', 'مكتمل'),
        ('failed', 'فشل'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='translation_jobs')
    ai_model = models.ForeignKey(AITranslationModel, on_delete=models.SET_NULL, null=True, blank=True)
    
    original_filename = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    
    # مسارات محلية مؤقتة
    temp_upload_path = models.CharField(max_length=500, blank=True)
    temp_extracted_path = models.CharField(max_length=500, blank=True)
    output_file_path = models.CharField(max_length=500, blank=True, help_text="مسار ملف CBZ المترجم")
    
    # مسارات الصور الأصلية للمعاينة (JSON: [{page_number, local_path, filename}])
    original_images_paths = models.JSONField(default=list, blank=True, help_text="مسارات الصور الأصلية المؤقتة")
    
    # نتائج الترجمة (JSON: [{page_number, local_path, filename}])
    translation_results = models.JSONField(default=list, blank=True)
    
    # إحصائيات
    total_pages = models.IntegerField(default=0)
    translated_pages = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Translation Job'
        verbose_name_plural = 'Translation Jobs'
    
    def __str__(self):
        return f"Translation Job {self.original_filename} - {self.status}"
