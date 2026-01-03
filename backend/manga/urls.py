from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from . import translation_views
from . import translation_endpoints
from . import async_chapter_upload
from . import translate_dashboard_views
from . import user_translation_views
from . import zip_analysis
from . import subscription_views
from .views import register_fcm_token
from .views import onesignal_test



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
    path('chapters/<uuid:chapter_id>/upload-status/', async_chapter_upload.get_chapter_upload_progress, name='chapter-upload-status'),
    path('chapters/analyze-zip/', zip_analysis.analyze_zip_file, name='analyze-zip'),
    
    # Auth endpoints (JWT)
    path('auth/login/', auth_views.login_view, name='auth-login'),
    path('auth/register/', auth_views.register_view, name='auth-register'),
    path('auth/refresh/', auth_views.refresh_token_view, name='auth-refresh'),
    path('auth/profile/', auth_views.profile_view, name='auth-profile'),
    
    # Subscription endpoints
    path('subscriptions/<uuid:plan_id>/subscribe/', subscription_views.subscribe_to_plan, name='subscribe-to-plan'),
    path('subscriptions/current/', subscription_views.get_current_subscription, name='current-subscription'),
    
    # AI Translation endpoints (Admin)
    path('translation/ai-models/', translation_views.ai_models_view, name='ai-models-list'),
    path('translation/ai-models/<uuid:model_id>/', translation_views.ai_model_detail_view, name='ai-model-detail'),
    path('translation/ai-models/<uuid:model_id>/test/', translation_views.test_ai_model_view, name='ai-model-test'),
    path('translation/upload/', translation_views.upload_chapter_for_translation, name='translation-upload'),
    path('translation/jobs/', translation_views.translation_jobs_list, name='translation-jobs-list'),
    path('translation/jobs/<uuid:job_id>/', translation_views.translation_job_status, name='translation-job-status'),
    path('translation/jobs/<uuid:job_id>/download/', translation_views.download_translated_cbz, name='translation-download'),
    path('translation/jobs/<uuid:job_id>/delete/', translation_views.delete_translation_job, name='translation-delete'),

    # Translation Dashboard (Admin - integrated workflow)
    path('translation/upload-for-preview/', translate_dashboard_views.upload_for_preview, name='upload_for_preview'),
    path('translation/status/<uuid:job_id>/', translate_dashboard_views.check_translation_status, name='check_translation_status'),
    path('translation/preview/<uuid:job_id>/', translate_dashboard_views.get_translation_preview, name='get_translation_preview'),
    path('translation/preview/<uuid:job_id>/image/<str:image_type>/<int:page_number>/', translate_dashboard_views.serve_preview_image, name='serve_preview_image'),
    path('translation/publish-chapter/', translate_dashboard_views.publish_translated_chapter, name='publish_translated_chapter'),
    
    # User Translation (Public)
    path('translate/upload/', user_translation_views.upload_for_translation, name='user-translate-upload'),
    path('translate/status/<uuid:job_id>/', user_translation_views.get_translation_status, name='user-translate-status'),
    path('translate/preview/<uuid:job_id>/', user_translation_views.get_translation_preview, name='user-translate-preview'),
    path('translate/preview/<uuid:job_id>/image/<str:image_type>/<int:page_number>/', user_translation_views.serve_preview_image, name='user-translate-image'),
    path('translate/download/<uuid:job_id>/', user_translation_views.download_translated_cbz, name='user-translate-download'),
    
    # New Translation Workflow endpoints
    path('translation/new/upload/', translation_endpoints.upload_for_translation, name='translation-new-upload'),
    path('translation/new/start/<str:job_id>/', translation_endpoints.start_translation, name='translation-new-start'),
    path('translation/new/status/<str:job_id>/', translation_endpoints.translation_status, name='translation-new-status'),
    path('translation/new/download/<str:job_id>/', translation_endpoints.download_translated, name='translation-new-download'),
    path('translation/new/preview/<str:job_id>/', translation_endpoints.get_images_preview, name='translation-new-preview'),
    path('translation/new/save/<str:job_id>/', translation_endpoints.save_translated_chapter, name='translation-new-save'),
    path('translation/new/delete/<str:job_id>/', translation_endpoints.delete_translation_job, name='translation-new-delete'),
    path("push/register-token/", register_fcm_token),
    path("push/onesignal/test/", onesignal_test),

    # Router URLs (must be LAST to avoid conflicts with specific endpoints above)
    path('', include(router.urls)),
]

