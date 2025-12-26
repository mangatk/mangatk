"""
Django Admin Configuration for MangaTK Application
Complete admin interface for all 13 models
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    Genre, Category, Manga, Chapter, ChapterImage,
    User, UserBookmark, ReadingHistory, Rating,
    Comment, CommentLike, Achievement, UserAchievement,
    AITranslationModel, TranslationJob
)


# ==================== BASIC CONTENT ADMINS ====================

@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    """Admin interface for Genre model"""
    list_display = ['name', 'slug', 'manga_count', 'created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def manga_count(self, obj):
        return obj.manga.count()
    manga_count.short_description = 'Manga Count'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model"""
    list_display = ['name', 'title_ar', 'slug', 'manga_count', 'created_at']
    search_fields = ['name', 'title_ar']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def manga_count(self, obj):
        return obj.manga.count()
    manga_count.short_description = 'Manga Count'


class ChapterInline(admin.TabularInline):
    """Inline admin for chapters within manga admin"""
    model = Chapter
    extra = 0
    fields = ['number', 'title', 'release_date', '_cached_avg_rating', 'image_count']
    readonly_fields = ['image_count']
    ordering = ['number']


@admin.register(Manga)
class MangaAdmin(admin.ModelAdmin):
    """Admin interface for Manga model"""
    list_display = [
        'title', 'author', 'status', 'avg_rating', 
        'views', 'chapter_count', 'cover_preview', 'last_updated'
    ]
    list_filter = ['status', 'category', 'genres', 'created_at']
    search_fields = ['title', 'sub_titles', 'author', 'description']
    filter_horizontal = ['genres']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = [
        'id', 'slug', 'chapter_count', 'avg_rating', 'last_updated',
        'created_at', 'updated_at', 'cover_preview_large'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'sub_titles', 'slug', 'author', 'description')
        }),
        ('Cover Image', {
            'fields': ('cover_image_url', 'cover_preview_large')
        }),
        ('Classification', {
            'fields': ('status', 'category', 'genres')
        }),
        ('Statistics', {
            'fields': ('avg_rating', 'views', 'chapter_count', 'last_updated')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ChapterInline]
    
    def cover_preview(self, obj):
        """Display small cover image preview in list"""
        if obj.cover_image_url:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 50px;" />',
                obj.cover_image_url
            )
        return '-'
    cover_preview.short_description = 'Cover'
    
    def cover_preview_large(self, obj):
        """Display larger cover image preview in detail"""
        if obj.cover_image_url:
            return format_html(
                '<img src="{}" style="max-height: 300px; max-width: 300px;" />',
                obj.cover_image_url
            )
        return 'No cover image'
    cover_preview_large.short_description = 'Cover Preview'


class ChapterImageInline(admin.TabularInline):
    """Inline admin for chapter images"""
    model = ChapterImage
    extra = 0
    fields = ['page_number', 'image_preview', 'image_url', 'original_filename', 'width', 'height']
    readonly_fields = ['image_preview']
    ordering = ['page_number']
    
    def image_preview(self, obj):
        """Display image preview"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 100px;" />',
                obj.image_url
            )
        return '-'
    image_preview.short_description = 'Preview'


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    """Admin interface for Chapter model"""
    list_display = [
        'manga', 'number', 'title', '_cached_avg_rating',
        'image_count', 'release_date', 'created_at'
    ]
    list_filter = ['manga', 'release_date', 'created_at']
    search_fields = ['manga__title', 'title', 'number']
    readonly_fields = ['id', 'image_count', '_cached_avg_rating', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Chapter Information', {
            'fields': ('manga', 'number', 'title', 'release_date')
        }),
        ('Statistics', {
            'fields': ('_cached_avg_rating', 'image_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ChapterImageInline]


@admin.register(ChapterImage)
class ChapterImageAdmin(admin.ModelAdmin):
    """Admin interface for ChapterImage model"""
    list_display = [
        'chapter', 'page_number', 'image_preview', 
        'original_filename', 'width', 'height'
    ]
    list_filter = ['chapter__manga', 'chapter']
    search_fields = ['chapter__manga__title', 'original_filename']
    readonly_fields = ['id', 'image_preview_large', 'created_at']
    
    fieldsets = (
        ('Chapter Image', {
            'fields': ('chapter', 'page_number', 'image_url', 'image_preview_large')
        }),
        ('Metadata', {
            'fields': ('original_filename', 'width', 'height')
        }),
        ('Timestamp', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        """Display small image preview in list"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 50px;" />',
                obj.image_url
            )
        return '-'
    image_preview.short_description = 'Preview'
    
    def image_preview_large(self, obj):
        """Display larger image preview in detail"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 500px;" />',
                obj.image_url
            )
        return 'No image'
    image_preview_large.short_description = 'Image Preview'


# ==================== USER MANAGEMENT ====================

class UserBookmarkInline(admin.TabularInline):
    """Inline for user bookmarks"""
    model = UserBookmark
    extra = 0
    fields = ['manga', 'added_at']
    readonly_fields = ['added_at']


class ReadingHistoryInline(admin.TabularInline):
    """Inline for reading history"""
    model = ReadingHistory
    extra = 0
    fields = ['manga', 'chapter', 'last_page', 'progress_percentage', 'last_read']
    readonly_fields = ['first_read', 'last_read']



class UserAchievementInline(admin.TabularInline):
    """Inline for user achievements"""
    model = UserAchievement
    extra = 0
    fields = ['achievement', 'progress', 'is_completed', 'earned_at']
    readonly_fields = ['earned_at']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'is_premium', 'chapters_read', 'achievement_count', 'is_staff'
    ]
    list_filter = ['is_staff', 'is_superuser', 'is_premium', 'theme_preference', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('MangaTK Profile', {
            'fields': ('avatar_url', 'bio', 'theme_preference')
        }),
        ('Premium Status', {
            'fields': ('is_premium',)
        }),
        ('Statistics', {
            'fields': ('chapters_read', 'total_reading_time', 'achievement_count', 'bookmark_count')
        }),
    )
    
    readonly_fields = ['achievement_count', 'bookmark_count']
    
    inlines = [UserBookmarkInline, ReadingHistoryInline, UserAchievementInline]


@admin.register(UserBookmark)
class UserBookmarkAdmin(admin.ModelAdmin):
    """Admin for user bookmarks"""
    list_display = ['user', 'manga', 'added_at', 'order']
    list_filter = ['added_at']
    search_fields = ['user__username', 'manga__title']
    readonly_fields = ['id', 'added_at']


@admin.register(ReadingHistory)
class ReadingHistoryAdmin(admin.ModelAdmin):
    """Admin for reading history"""
    list_display = ['user', 'manga', 'chapter', 'last_page', 'progress_percentage', 'last_read']
    list_filter = ['last_read', 'manga']
    search_fields = ['user__username', 'manga__title']
    readonly_fields = ['id', 'first_read', 'last_read']


# ==================== SOCIAL FEATURES ====================

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    """Admin for ratings"""
    list_display = ['user', 'chapter', 'rating', 'created_at', 'updated_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__username', 'chapter__manga__title']
    readonly_fields = ['id', 'created_at', 'updated_at']


class CommentLikeInline(admin.TabularInline):
    """Inline for comment likes"""
    model = CommentLike
    extra = 0
    fields = ['user', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin for comments"""
    list_display = [
        'user', 'comment_type', 'content_preview', 
        'likes_count', 'is_edited', 'is_deleted', 'created_at'
    ]
    list_filter = ['comment_type', 'is_edited', 'is_deleted', 'created_at']
    search_fields = ['user__username', 'content', 'manga__title', 'chapter__manga__title']
    readonly_fields = ['id', 'likes_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Comment Info', {
            'fields': ('user', 'comment_type', 'manga', 'chapter', 'parent')
        }),
        ('Content', {
            'fields': ('content',)
        }),
        ('Status', {
            'fields': ('is_edited', 'is_deleted', 'likes_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [CommentLikeInline]
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    """Admin for comment likes"""
    list_display = ['user', 'comment_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'comment__content']
    readonly_fields = ['id', 'created_at']
    
    def comment_preview(self, obj):
        return obj.comment.content[:30] + '...'
    comment_preview.short_description = 'Comment'


# ==================== ACHIEVEMENTS ====================

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    """Admin for achievements"""
    list_display = [
        'name', 'name_ar', 'category', 'requirement_type', 
        'requirement_value', 'reward_points', 'is_active'
    ]
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'name_ar', 'description']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'name_ar', 'icon_url')
        }),
        ('Description', {
            'fields': ('description', 'description_ar')
        }),
        ('Requirements', {
            'fields': ('category', 'requirement_type', 'requirement_value', 'reward_points')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    """Admin for user achievements"""
    list_display = [
        'user', 'achievement', 'progress', 'progress_percentage',
        'is_completed', 'earned_at'
    ]
    list_filter = ['is_completed', 'achievement__category', 'earned_at']
    search_fields = ['user__username', 'achievement__name']
    readonly_fields = ['id', 'progress_percentage', 'created_at', 'updated_at']
    
    def progress_percentage(self, obj):
        if obj.achievement.requirement_value > 0:
            percentage = (obj.progress / obj.achievement.requirement_value) * 100
            return f"{percentage:.1f}%"
        return "0%"
    progress_percentage.short_description = 'Progress %'


# ==================== AI TRANSLATION SYSTEM ====================

@admin.register(AITranslationModel)
class AITranslationModelAdmin(admin.ModelAdmin):
    """Admin for AI Translation Models"""
    list_display = ['name', 'api_endpoint', 'is_active', 'is_default', 'created_at']
    list_filter = ['is_active', 'is_default', 'created_at']
    search_fields = ['name', 'api_endpoint']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Model Information', {
            'fields': ('name', 'api_endpoint', 'api_key')
        }),
        ('Configuration', {
            'fields': ('extra_headers', 'request_template', 'response_path')
        }),
        ('Status', {
            'fields': ('is_active', 'is_default')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TranslationJob)
class TranslationJobAdmin(admin.ModelAdmin):
    """Admin for Translation Jobs"""
    list_display = [
        'original_filename', 'user', 'status', 'ai_model',
        'total_pages', 'translated_pages', 'progress_display', 'created_at'
    ]
    list_filter = ['status', 'ai_model', 'created_at']
    search_fields = ['original_filename', 'user__username', 'target_manga__title']
    readonly_fields = [
        'id', 'user', 'status', 'total_pages', 'translated_pages',
        'translation_results', 'temp_upload_path', 'temp_extracted_path',
        'error_message', 'created_at', 'updated_at', 'completed_at', 'progress_display'
    ]
    
    fieldsets = (
        ('Job Information', {
            'fields': ('user', 'ai_model', 'original_filename', 'status')
        }),
        ('Progress', {
            'fields': ('total_pages', 'translated_pages', 'progress_display')
        }),
        ('Publishing Info', {
            'fields': ('target_manga', 'chapter_number', 'chapter_title', 'release_date')
        }),
        ('Results', {
            'fields': ('translation_results', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Technical', {
            'fields': ('temp_upload_path', 'temp_extracted_path'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def progress_display(self, obj):
        if obj.total_pages > 0:
            percentage = (obj.translated_pages / obj.total_pages) * 100
            return format_html(
                '<progress value="{}" max="100"></progress> {}%',
                percentage, f"{percentage:.1f}"
            )
        return "0%"
    progress_display.short_description = 'Translation Progress'


# Customize admin site header
admin.site.site_header = "MangaTK Administration"
admin.site.site_title = "MangaTK Admin"
admin.site.index_title = "Manga Management Dashboard"
