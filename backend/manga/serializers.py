"""
Django REST Framework Serializers for Manga API
Transforms Django models to/from JSON format
"""
from rest_framework import serializers
from .models import (
    Genre, Category, Manga, Chapter, ChapterImage,
    UserBookmark, Rating, Comment, CommentLike, Achievement, UserAchievement,
    SubscriptionPlan, AITranslationModel, TranslationJob
)


class GenreSerializer(serializers.ModelSerializer):
    """Serializer for Genre model"""
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for Subscription Plans - خطط الاشتراكات"""
    discounted_price = serializers.SerializerMethodField()
    duration_display = serializers.CharField(source='get_duration_type_display', read_only=True)
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'price', 'duration_type', 'duration_display',
            'discount_percentage', 'discounted_price',
            'point_multiplier', 'ads_enabled', 'monthly_free_translations',
            'features', 'description', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'discounted_price', 'duration_display']
    
    def get_discounted_price(self, obj):
        return str(obj.discounted_price)


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'title_ar', 'description_ar']


class ChapterImageSerializer(serializers.ModelSerializer):
    """Serializer for ChapterImage model"""
    class Meta:
        model = ChapterImage
        fields = [
            'id', 'image_url', 'page_number', 
            'original_filename', 'width', 'height'
        ]
        read_only_fields = ['id']


class ChapterSerializer(serializers.ModelSerializer):
    """Basic Chapter serializer without images"""
    image_count = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = [
            'id', 'number', 'title', 'release_date',
            'avg_rating', 'image_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_image_count(self, obj):
        return obj.image_count
    
    def get_avg_rating(self, obj):
        return obj.avg_rating



class ChapterDetailSerializer(serializers.ModelSerializer):
    """Detailed Chapter serializer with all images"""
    images = ChapterImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    manga_title = serializers.CharField(source='manga.title', read_only=True)
    
    # Add prev/next chapter info
    prev_chapter_id = serializers.SerializerMethodField()
    next_chapter_id = serializers.SerializerMethodField()
    manga_id = serializers.CharField(source='manga.id', read_only=True)
    manga_title = serializers.CharField(source='manga.title', read_only=True)
    
    class Meta:
        model = Chapter
        fields = [
            'id', 'manga_id', 'manga_title', 'number', 'title',
            'release_date', 'images', 'prev_chapter_id', 
            'next_chapter_id', 'image_count'
        ]
        read_only_fields = ['id']
    
    def get_image_count(self, obj):
        return obj.image_count
    
    def get_prev_chapter_id(self, obj):
        """Get previous chapter ID if exists"""
        prev_chapter = Chapter.objects.filter(
            manga=obj.manga, 
            number__lt=obj.number
        ).order_by('-number').first()
        return str(prev_chapter.id) if prev_chapter else None
    
    def get_next_chapter_id(self, obj):
        """Get next chapter ID if exists"""
        next_chapter = Chapter.objects.filter(
            manga=obj.manga, 
            number__gt=obj.number
        ).order_by('number').first()
        return str(next_chapter.id) if next_chapter else None


class MangaListSerializer(serializers.ModelSerializer):
    """Serializer for Manga list view (without full chapter details)"""
    genres = GenreSerializer(many=True, read_only=True)
    category = serializers.CharField(source='category.slug', allow_null=True)
    avg_rating = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    last_updated = serializers.SerializerMethodField()
    has_banner = serializers.SerializerMethodField()
    
    class Meta:
        model = Manga
        fields = [
            'id', 'title', 'sub_titles', 'slug', 'description', 'author',
            'cover_image_url', 'banner_image_url', 'has_banner', 'is_featured',
            'status', 'avg_rating', 'views', 'genres', 'category', 'chapter_count', 'last_updated'
        ]
        read_only_fields = ['id', 'slug']
    
    def get_avg_rating(self, obj):
        return obj.avg_rating
    
    def get_chapter_count(self, obj):
        return obj.chapter_count
    
    def get_last_updated(self, obj):
        return obj.last_updated
    
    def get_has_banner(self, obj):
        return obj.has_banner



class MangaDetailSerializer(serializers.ModelSerializer):
    """Detailed Manga serializer with chapters"""
    genres = GenreSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    chapters = ChapterSerializer(many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    last_updated = serializers.SerializerMethodField()
    has_banner = serializers.SerializerMethodField()
    
    class Meta:
        model = Manga
        fields = [
            'id', 'title', 'sub_titles', 'slug', 'description', 'author',
            'cover_image_url', 'banner_image_url', 'has_banner', 'is_featured',
            'status', 'avg_rating', 'views', 'genres', 'category', 'chapters', 'chapter_count',
            'created_at', 'updated_at', 'last_updated'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_avg_rating(self, obj):
        return obj.avg_rating
    
    def get_chapter_count(self, obj):
        return obj.chapter_count
    
    def get_last_updated(self, obj):
        return obj.last_updated
    
    def get_has_banner(self, obj):
        return obj.has_banner



class MangaCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Manga"""
    genre_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    genres = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    category = serializers.CharField(write_only=True, required=False, allow_null=True)
    cover_image = serializers.ImageField(write_only=True, required=False)
    cover_image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    banner_image = serializers.ImageField(write_only=True, required=False)
    banner_image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    is_featured = serializers.BooleanField(required=False, default=False)
    
    class Meta:
        model = Manga
        fields = [
            'id', 'title', 'sub_titles', 'description', 'author', 'status',
            'avg_rating', 'views', 'genre_ids', 'genres', 'category_id', 'category',
            'cover_image', 'cover_image_url', 'banner_image', 'banner_image_url', 'is_featured'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        genre_ids = validated_data.pop('genre_ids', [])
        genre_slugs = validated_data.pop('genres', [])
        category_id = validated_data.pop('category_id', None)
        category_slug = validated_data.pop('category', None)
        cover_image = validated_data.pop('cover_image', None)
        banner_image = validated_data.pop('banner_image', None)
        
        # Create manga instance
        manga = Manga.objects.create(**validated_data)
        
        # Add genres by ID
        if genre_ids:
            manga.genres.set(Genre.objects.filter(id__in=genre_ids))
        # Add genres by slug
        elif genre_slugs:
            manga.genres.set(Genre.objects.filter(slug__in=genre_slugs))
        
        # Set category by ID or slug
        if category_id:
            manga.category_id = category_id
            manga.save()
        elif category_slug:
            cat = Category.objects.filter(slug=category_slug).first()
            if cat:
                manga.category = cat
                manga.save()
        
        # Upload cover image if provided
        if cover_image:
            from .services import ImgBBService
            result = ImgBBService.upload_cover_image(manga.title, cover_image)
            if result:
                manga.cover_image_url = result['display_url']
                manga.save()
        
        # Upload banner image if provided
        if banner_image:
            from .services import ImgBBService
            result = ImgBBService.upload_cover_image(f"{manga.title}_banner", banner_image)
            if result:
                manga.banner_image_url = result['display_url']
                manga.save()
        
        return manga
    
    def update(self, instance, validated_data):
        genre_ids = validated_data.pop('genre_ids', None)
        genre_slugs = validated_data.pop('genres', None)
        category_id = validated_data.pop('category_id', None)
        category_slug = validated_data.pop('category', None)
        cover_image = validated_data.pop('cover_image', None)
        banner_image = validated_data.pop('banner_image', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update genres
        if genre_ids is not None:
            instance.genres.set(Genre.objects.filter(id__in=genre_ids))
        elif genre_slugs is not None:
            instance.genres.set(Genre.objects.filter(slug__in=genre_slugs))
        
        # Update category
        if category_id is not None:
            instance.category_id = category_id
        elif category_slug is not None:
            if category_slug:
                cat = Category.objects.filter(slug=category_slug).first()
                instance.category = cat
            else:
                instance.category = None
        
        # Upload new cover image if provided
        if cover_image:
            from .services import ImgBBService
            result = ImgBBService.upload_cover_image(instance.title, cover_image)
            if result:
                instance.cover_image_url = result['display_url']
        
        # Upload new banner image if provided
        if banner_image:
            from .services import ImgBBService
            result = ImgBBService.upload_cover_image(f"{instance.title}_banner", banner_image)
            if result:
                instance.banner_image_url = result['display_url']
        
        instance.save()
        return instance


class ChapterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating chapters with images"""
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Chapter
        fields = ['id', 'manga', 'number', 'title', 'release_date', 'images']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        images = validated_data.pop('images', [])
        chapter = Chapter.objects.create(**validated_data)
        
        # Upload images if provided
        if images:
            from .services import ImgBBService
            results = ImgBBService.upload_chapter_images(
                chapter.manga.title,
                chapter.number,
                images
            )
            
            # Create ChapterImage records
            for result in results:
                ChapterImage.objects.create(
                    chapter=chapter,
                    image_url=result['display_url'],
                    page_number=result['page_number'],
                    original_filename=result['original_filename'],
                    width=result.get('width'),
                    height=result.get('height')
                )
        
        return chapter


# ==================== USER INTERACTION SERIALIZERS ====================

class BookmarkSerializer(serializers.ModelSerializer):
    """Serializer for user bookmarks"""
    manga_title = serializers.CharField(source='manga.title', read_only=True)
    manga_cover = serializers.CharField(source='manga.cover_image_url', read_only=True)
    manga_author = serializers.CharField(source='manga.author', read_only=True)
    manga_chapter_count = serializers.IntegerField(source='manga.chapter_count', read_only=True)
    
    class Meta:
        model = UserBookmark
        fields = ['id', 'manga', 'manga_title', 'manga_cover', 'manga_author', 'manga_chapter_count', 'added_at']
        read_only_fields = ['id', 'added_at']


class RatingSerializer(serializers.ModelSerializer):
    """Serializer for chapter ratings"""
    username = serializers.CharField(source='user.username', read_only=True)
    chapter_number = serializers.IntegerField(source='chapter.number', read_only=True)
    manga_title = serializers.CharField(source='chapter.manga.title', read_only=True)
    
    # Nested objects for dashboard
    chapter = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    
    # For create operation - accept chapter ID
    chapter_id = serializers.PrimaryKeyRelatedField(
        queryset=Chapter.objects.all(),
        write_only=True,
        source='chapter'
    )
    
    class Meta:
        model = Rating
        fields = ['id', 'chapter', 'chapter_id', 'rating', 'username', 'user', 'chapter_number', 'manga_title', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_chapter(self, obj):
        return {
            'id': str(obj.chapter.id),
            'number': obj.chapter.number,
            'manga_title': obj.chapter.manga.title if obj.chapter.manga else None
        }
    
    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'username': obj.user.username
        }


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments on manga/chapters"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar_url', read_only=True)
    replies = serializers.SerializerMethodField()
    
    # Nested objects for dashboard display
    user = serializers.SerializerMethodField()
    manga = serializers.SerializerMethodField()
    chapter = serializers.SerializerMethodField()
    
    # For create operation - accept IDs
    manga_id = serializers.PrimaryKeyRelatedField(
        queryset=Manga.objects.all(), 
        required=False, 
        allow_null=True,
        write_only=True,
        source='manga'
    )
    chapter_id = serializers.PrimaryKeyRelatedField(
        queryset=Chapter.objects.all(), 
        required=False, 
        allow_null=True,
        write_only=True,
        source='chapter'
    )
    
    class Meta:
        model = Comment
        fields = [
            'id', 'comment_type', 'manga', 'chapter', 'manga_id', 'chapter_id',
            'content', 'parent', 'likes_count', 'user', 'user_name', 'user_avatar',
            'created_at', 'is_edited', 'is_deleted', 'replies'
        ]
        read_only_fields = ['id', 'likes_count', 'created_at', 'is_edited', 'comment_type']
    
    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'username': obj.user.username
        }
    
    def get_manga(self, obj):
        # Try direct manga, or get from chapter
        manga = obj.manga or (obj.chapter.manga if obj.chapter else None)
        if manga:
            return {
                'id': str(manga.id),
                'title': manga.title
            }
        return None
    
    def get_chapter(self, obj):
        if obj.chapter:
            return {
                'id': str(obj.chapter.id),
                'number': obj.chapter.number,
                'manga_title': obj.chapter.manga.title if obj.chapter.manga else None
            }
        return None
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.filter(is_deleted=False), many=True).data
        return []


class CommentLikeSerializer(serializers.ModelSerializer):
    """Serializer for comment likes"""
    class Meta:
        model = CommentLike
        fields = ['id', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for achievements"""
    target_manga_title = serializers.CharField(source='target_manga.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Achievement
        fields = [
            'id', 'slug', 'name', 'name_ar', 'description', 'icon_url',
            'category', 'rarity', 'requirement_type', 'requirement_value',
            'reward_points', 'is_secret', 'is_active', 'target_manga', 'target_manga_title'
        ]



class UserAchievementSerializer(serializers.ModelSerializer):
    """Serializer for user achievements"""
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'earned_at', 'is_completed', 'progress']
        read_only_fields = ['id', 'earned_at']


# ==================== AI TRANSLATION SERIALIZERS ====================

class AITranslationModelSerializer(serializers.ModelSerializer):
    """Serializer for AI Translation Model configuration"""
    
    class Meta:
        model = AITranslationModel
        fields = [
            'id', 'name', 'api_endpoint', 'api_key', 'extra_headers',
            'request_template', 'response_path', 'is_active', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key': {'write_only': True}  # لا نعرض API key في الرد
        }


class TranslationJobSerializer(serializers.ModelSerializer):
    """Serializer for Translation Job tracking"""
    ai_model_name = serializers.CharField(source='ai_model.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TranslationJob
        fields = [
            'id', 'user', 'user_name', 'ai_model', 'ai_model_name',
            'original_filename', 'status', 'status_display',
            'total_pages', 'translated_pages', 'translation_results',
            'output_file_path', 'error_message',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'total_pages', 'translated_pages',
            'translation_results', 'output_file_path', 'error_message',
            'created_at', 'updated_at', 'completed_at'
        ]
