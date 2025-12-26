"""
URL Configuration for Manga API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from . import translation_views
from . import translation_endpoints
from . import async_chapter_upload

# Create router and register viewsets
router = DefaultRouter()
router.register(r'genres', views.GenreViewSet, basename='genre')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'manga', views.MangaViewSet, basename='manga')
router.register(r'chapters', views.ChapterViewSet, basename='chapter')
router.register(r'subscriptions', views.SubscriptionPlanViewSet, basename='subscription')

# User interaction endpoints
router.register(r'bookmarks', views.BookmarkViewSet, basename='bookmark')
router.register(r'ratings', views.RatingViewSet, basename='rating')
router.register(r'comments', views.CommentViewSet, basename='comment')
router.register(r'achievements', views.AchievementViewSet, basename='achievement')
router.register(r'reading-history', views.ReadingHistoryViewSet, basename='reading-history')

app_name = 'manga'

urlpatterns = [
    # Async Chapter Upload endpoints (must be BEFORE router.urls to avoid conflicts)
    path('chapters/upload-async/', async_chapter_upload.start_async_chapter_upload, name='chapter-upload-async'),
    path('chapters/upload-progress/<str:job_id>/', async_chapter_upload.get_upload_progress, name='chapter-upload-progress'),
    path('chapters/cancel-upload/<str:job_id>/', async_chapter_upload.cancel_upload, name='chapter-cancel-upload'),
    
    # Auth endpoints (JWT)
    path('auth/login/', auth_views.login_view, name='auth-login'),
    path('auth/register/', auth_views.register_view, name='auth-register'),
    path('auth/refresh/', auth_views.refresh_token_view, name='auth-refresh'),
    path('auth/profile/', auth_views.profile_view, name='auth-profile'),
    
    # AI Translation endpoints
    path('translation/ai-models/', translation_views.ai_models_view, name='ai-models-list'),
    path('translation/ai-models/<uuid:model_id>/', translation_views.ai_model_detail_view, name='ai-model-detail'),
    path('translation/ai-models/<uuid:model_id>/test/', translation_views.test_ai_model_view, name='ai-model-test'),
    path('translation/upload/', translation_views.upload_chapter_for_translation, name='translation-upload'),
    path('translation/jobs/', translation_views.translation_jobs_list, name='translation-jobs-list'),
    path('translation/jobs/<uuid:job_id>/', translation_views.translation_job_status, name='translation-job-status'),
    path('translation/jobs/<uuid:job_id>/download/', translation_views.download_translated_cbz, name='translation-download'),
    path('translation/jobs/<uuid:job_id>/delete/', translation_views.delete_translation_job, name='translation-delete'),
    
    # New Translation Workflow endpoints
    path('translation/new/upload/', translation_endpoints.upload_for_translation, name='translation-new-upload'),
    path('translation/new/start/<str:job_id>/', translation_endpoints.start_translation, name='translation-new-start'),
    path('translation/new/status/<str:job_id>/', translation_endpoints.translation_status, name='translation-new-status'),
    path('translation/new/download/<str:job_id>/', translation_endpoints.download_translated, name='translation-new-download'),
    path('translation/new/preview/<str:job_id>/', translation_endpoints.get_images_preview, name='translation-new-preview'),
    path('translation/new/save/<str:job_id>/', translation_endpoints.save_translated_chapter, name='translation-new-save'),
    path('translation/new/delete/<str:job_id>/', translation_endpoints.delete_translation_job, name='translation-new-delete'),
    
    # Router URLs (must be LAST to avoid conflicts with specific endpoints above)
    path('', include(router.urls)),
]
