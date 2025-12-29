"""
Django REST Framework Views for Manga API
Provides API endpoints for manga, chapters, genres, and categories
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Genre, Category, Manga, Chapter, ChapterImage, SubscriptionPlan
from .serializers import (
    GenreSerializer, CategorySerializer, SubscriptionPlanSerializer,
    MangaListSerializer, MangaDetailSerializer, MangaCreateSerializer,
    ChapterSerializer, ChapterDetailSerializer, ChapterCreateSerializer
)


class GenreViewSet(viewsets.ModelViewSet):
    """
    API endpoint for genres
    GET /api/genres/ - List all genres
    GET /api/genres/{id}/ - Get genre details
    POST /api/genres/ - Create genre
    PUT /api/genres/{id}/ - Update genre
    DELETE /api/genres/{id}/ - Delete genre
    """
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    lookup_field = 'slug'


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for categories
    GET /api/categories/ - List all categories
    GET /api/categories/{slug}/ - Get category details
    POST /api/categories/ - Create category
    PUT /api/categories/{id}/ - Update category
    DELETE /api/categories/{id}/ - Delete category
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    API endpoint for subscription plans - خطط الاشتراكات
    GET /api/subscriptions/ - List all plans
    POST /api/subscriptions/ - Create new plan
    GET /api/subscriptions/{id}/ - Get plan details
    PUT /api/subscriptions/{id}/ - Update plan
    PATCH /api/subscriptions/{id}/ - Partial update plan
    DELETE /api/subscriptions/{id}/ - Delete plan
    """
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer


class MangaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for manga
    GET /api/manga/ - List all manga with filtering
    GET /api/manga/{id}/ - Get manga details with chapters
    POST /api/manga/ - Create new manga
    PUT /api/manga/{id}/ - Update manga
    DELETE /api/manga/{id}/ - Delete manga
    
    Filters:
    - ?search=query - Search in title, author, description
    - ?category=slug  - Filter by category slug
    - ?genre=name - Filter by genre name
    - ?status=ongoing|completed - Filter by status
    - ?ordering=title|-title|avg_rating|-avg_rating|views|-views
    """
    queryset = Manga.objects.all().prefetch_related('genres', 'category', 'chapters')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'sub_titles', 'author', 'description', 'genres__name']
    # Removed computed fields (avg_rating, last_updated) from DB ordering
    ordering_fields = ['title', 'views', 'updated_at', 'created_at']
    ordering = ['-updated_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MangaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MangaCreateSerializer
        return MangaDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by genre
        genre = self.request.query_params.get('genre', None)
        if genre:
            queryset = queryset.filter(genres__name__icontains=genre)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by min_rating removed as it requires aggregation
        
        return queryset.distinct()
    
    @action(detail=True, methods=['get'])
    def chapters(self, request, pk=None):
        """
        Get all chapters for a specific manga
        GET /api/manga/{id}/chapters/
        """
        manga = self.get_object()
        chapters = manga.chapters.all().order_by('number')
        serializer = ChapterSerializer(chapters, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Get featured manga for homepage banner
        GET /api/manga/featured/
        Returns manga marked as is_featured, or falls back to highest views
        """
        # First try to get manga marked as featured
        featured = self.get_queryset().filter(is_featured=True)[:5]
        if not featured.exists():
            # Fallback to highest views
            featured = self.get_queryset().order_by('-views')[:5]
        serializer = MangaListSerializer(featured, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """
        Increment manga views - only counts once per user/IP
        POST /api/manga/{id}/increment_views/
        """
        from .models import MangaView
        
        manga = self.get_object()
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Record unique view
        user = request.user if request.user.is_authenticated else None
        is_new_view = MangaView.record_view(manga, user=user, ip_address=ip_address)
        
        if is_new_view:
            manga.views += 1
            manga.save()
        
        return Response({
            'views': manga.views,
            'is_new_view': is_new_view
        })


class ChapterViewSet(viewsets.ModelViewSet):
    """
    API endpoint for chapters
    GET /api/chapters/ - List all chapters
    GET /api/chapters/{id}/ - Get chapter details with images
    POST /api/chapters/ - Create new chapter
    PUT /api/chapters/{id}/ - Update chapter
    DELETE /api/chapters/{id}/ - Delete chapter
    POST /api/chapters/upload/ - Upload chapter from ZIP/CBZ
    """
    queryset = Chapter.objects.all().select_related('manga').prefetch_related('images')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ChapterCreateSerializer
        elif self.action == 'retrieve':
            return ChapterDetailSerializer
        return ChapterSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by manga
        manga_id = self.request.query_params.get('manga', None)
        if manga_id:
            queryset = queryset.filter(manga_id=manga_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """
        Record chapter read and award +1 point (only once per user per chapter)
        POST /api/chapters/{id}/increment_views/
        """
        from .models import ReadingHistory
        
        chapter = self.get_object()
        points_earned = 0
        
        # Only authenticated users can earn points
        if request.user.is_authenticated:
            # Get or create reading history for this chapter
            history, created = ReadingHistory.objects.get_or_create(
                user=request.user,
                manga=chapter.manga,
                chapter=chapter,
                defaults={'last_page': 1, 'progress_percentage': 0}
            )
            
            # Award point only if not already claimed for this chapter
            if not history.points_claimed:
                points_earned = request.user.add_points(1, reason=f'Read chapter {chapter.number}')
                history.points_claimed = True
                history.save()
        
        return Response({
            'points_earned': points_earned,
            'total_points': request.user.points if request.user.is_authenticated else 0,
            'already_read': not points_earned and request.user.is_authenticated
        })
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """
        Upload chapter from ZIP/CBZ file - Images are uploaded to imgbb
        POST /api/chapters/upload/
        """
        import zipfile
        import io
        from datetime import datetime
        from .services.imgbb import ImgBBService
        
        manga_id = request.data.get('manga')
        number = request.data.get('number')
        title = request.data.get('title', '')
        release_date_str = request.data.get('release_date', '')
        uploaded_file = request.FILES.get('file')
        
        if not all([manga_id, number, uploaded_file]):
            return Response({'error': 'manga, number, and file are required'}, status=400)
        
        try:
            manga = Manga.objects.get(id=manga_id)
        except Manga.DoesNotExist:
            return Response({'error': 'Manga not found'}, status=404)
        
        # Parse release date
        release_date = None
        if release_date_str:
            try:
                release_date = datetime.strptime(release_date_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        # Create chapter
        defaults = {'title': title or f'{manga.title} - الفصل {number}'}
        if release_date:
            defaults['release_date'] = release_date
            
        chapter, created = Chapter.objects.get_or_create(
            manga=manga,
            number=float(number),
            defaults=defaults
        )
        
        if not created:
            # Clear existing images if re-uploading
            chapter.images.all().delete()
            chapter.title = title or chapter.title
            if release_date:
                chapter.release_date = release_date
            chapter.save()
        
        # Extract ZIP/CBZ and upload to imgbb
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
        images_created = 0
        failed_uploads = 0
        
        try:
            with zipfile.ZipFile(uploaded_file, 'r') as zip_file:
                # Get list of image files, sorted
                image_files = sorted([
                    f for f in zip_file.namelist()
                    if f.lower().endswith(image_extensions) and not f.startswith('__MACOSX')
                ])
                
                for page_num, filename in enumerate(image_files, 1):
                    # Extract file data
                    file_data = zip_file.read(filename)
                    
                    # Create a file-like object for upload
                    import os
                    file_obj = io.BytesIO(file_data)
                    file_obj.name = os.path.basename(filename)
                    
                    # Upload to imgbb
                    result = ImgBBService.upload_image(
                        file_obj, 
                        f"{manga.title}_ch{int(float(number)):03d}_p{page_num:03d}"
                    )
                    
                    if result:
                        # Create ChapterImage record with imgbb URL
                        ChapterImage.objects.create(
                            chapter=chapter,
                            page_number=page_num,
                            image_url=result['url'],
                            width=result.get('width'),
                            height=result.get('height'),
                            original_filename=os.path.basename(filename)
                        )
                        images_created += 1
                    else:
                        failed_uploads += 1
                        print(f"Failed to upload page {page_num} of chapter {number}")
                    
        except zipfile.BadZipFile:
            return Response({'error': 'Invalid ZIP/CBZ file'}, status=400)
        
        message = f'تم رفع {images_created} صورة بنجاح إلى imgbb'
        if failed_uploads > 0:
            message += f' (فشل رفع {failed_uploads} صورة)'
        
        return Response({
            'success': True,
            'chapter_id': str(chapter.id),
            'images_count': images_created,
            'failed_count': failed_uploads,
            'message': message
        })


# ==================== USER INTERACTION VIEWSETS ====================
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from .models import UserBookmark, Rating, Comment, CommentLike, Achievement, UserAchievement, ReadingHistory
from .serializers import (
    BookmarkSerializer, RatingSerializer, CommentSerializer, 
    CommentLikeSerializer, AchievementSerializer, UserAchievementSerializer
)


class ReadingHistoryViewSet(viewsets.ViewSet):
    """
    API endpoint for tracking reading history
    POST /api/reading-history/ - Record chapter read
    GET /api/reading-history/ - Get user's reading history
    POST /api/reading-history/update-time/ - Update reading time with 30-second rule
    """
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        """Record a chapter read"""
        chapter_id = request.data.get('chapter_id')
        manga_id = request.data.get('manga_id')
        reading_seconds = request.data.get('reading_seconds', 0)
        
        if not chapter_id:
            return Response({'error': 'chapter_id مطلوب'}, status=400)
        
        # Create or update reading history
        from .models import Chapter, Manga
        try:
            chapter = Chapter.objects.get(id=chapter_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'الفصل غير موجود'}, status=404)
        
        history, created = ReadingHistory.objects.get_or_create(
            user=request.user,
            chapter=chapter,
            defaults={'manga': chapter.manga}
        )
        
        # Award points and update time only if >= 30 seconds AND not claimed before
        points_awarded = False
        if reading_seconds >= 30 and not history.points_claimed:
            # Award 1 point
            request.user.add_points(1, reason='قراءة فصل')
            
            # Update reading time
            request.user.total_reading_time += reading_seconds
            request.user.chapters_read += 1 if created else 0
            request.user.save()
            
            # Mark points as claimed
            history.points_claimed = True
            history.save()
            
            points_awarded = True
        
        return Response({
            'success': True,
            'created': created,
            'points_awarded': points_awarded,
            'total_points': request.user.points,
            'total_chapters_read': request.user.chapters_read
        })
    
    def list(self, request):
        """Get user's reading history with manga grouping"""
        from .models import Manga
        from .serializers import MangaListSerializer
        
        # Get all read chapters
        history = ReadingHistory.objects.filter(user=request.user).select_related('manga', 'chapter').order_by('-last_read')[:50]
        
        # Group by manga for frontend
        data = [{
            'chapter_id': str(h.chapter.id),
            'manga_id': str(h.manga.id),
            'manga_title': h.manga.title,
            'manga_cover': h.manga.cover_image_url,
            'chapter_number': float(h.chapter.number),
            'chapter_title': h.chapter.title,
            'last_read': h.last_read.isoformat(),
            'points_claimed': h.points_claimed,
        } for h in history]
        
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def update_time(self, request):
        """Update reading time - 30 second minimum for points"""
        seconds = request.data.get('seconds', 0)
        chapter_id = request.data.get('chapter_id')
        
        if seconds < 30:
            return Response({
                'points_awarded': False, 
                'message': 'يجب قراءة الفصل لمدة 30 ثانية على الأقل'
            })
        
        # Check if this chapter was already claimed
        if chapter_id:
            try:
                history = ReadingHistory.objects.get(user=request.user, chapter_id=chapter_id)
                if history.points_claimed:
                    return Response({
                        'points_awarded': False,
                        'message': 'تم احتساب النقاط لهذا الفصل مسبقاً'
                    })
            except ReadingHistory.DoesNotExist:
                pass
        
        # Award points and update time
        points_earned = request.user.add_points(1, reason='وقت القراءة')
        request.user.total_reading_time += seconds
        request.user.save()
        
        return Response({
            'points_awarded': True,
            'points_earned': points_earned,
            'total_points': request.user.points,
            'total_reading_time': request.user.total_reading_time
        })


class BookmarkViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user bookmarks (favorites)
    GET /api/bookmarks/ - List user's bookmarks
    POST /api/bookmarks/ - Add manga to bookmarks
    DELETE /api/bookmarks/{id}/ - Remove from bookmarks
    """
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserBookmark.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle bookmark status for a manga"""
        manga_id = request.data.get('manga_id')
        if not manga_id:
            return Response({'error': 'manga_id is required'}, status=400)
        
        try:
            bookmark = UserBookmark.objects.get(user=request.user, manga_id=manga_id)
            bookmark.delete()
            return Response({'bookmarked': False, 'message': 'تم إزالة المانجا من المفضلة'})
        except UserBookmark.DoesNotExist:
            UserBookmark.objects.create(user=request.user, manga_id=manga_id)
            return Response({'bookmarked': True, 'message': 'تم إضافة المانجا للمفضلة'})
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if manga is bookmarked"""
        manga_id = request.query_params.get('manga_id')
        if not manga_id:
            return Response({'error': 'manga_id is required'}, status=400)
        
        is_bookmarked = UserBookmark.objects.filter(
            user=request.user, manga_id=manga_id
        ).exists()
        return Response({'bookmarked': is_bookmarked})


class RatingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for chapter ratings
    POST /api/ratings/ - Rate a chapter
    GET /api/ratings/my-rating/?chapter={id} - Get user's rating for chapter
    GET /api/ratings/all/ - Get all ratings (admin)
    """
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        # Staff users can see all ratings
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Rating.objects.all().select_related('user', 'chapter', 'chapter__manga')
        # Normal users see only their own ratings
        if self.request.user.is_authenticated:
            return Rating.objects.filter(user=self.request.user)
        return Rating.objects.none()
    
    def perform_create(self, serializer):
        # Update existing rating or create new one
        chapter = serializer.validated_data['chapter']
        rating_value = serializer.validated_data['rating']
        
        rating, created = Rating.objects.update_or_create(
            user=self.request.user,
            chapter=chapter,
            defaults={'rating': rating_value}
        )
        return rating
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = self.perform_create(serializer)
        return Response(RatingSerializer(rating).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_rating(self, request):
        """Get user's rating for a specific chapter"""
        chapter_id = request.query_params.get('chapter')
        if not chapter_id:
            return Response({'error': 'chapter is required'}, status=400)
        
        try:
            rating = Rating.objects.get(user=request.user, chapter_id=chapter_id)
            return Response({'rating': float(rating.rating)})
        except Rating.DoesNotExist:
            return Response({'rating': None})


class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for comments
    GET /api/comments/?manga={id} - Get comments for manga
    GET /api/comments/?chapter={id} - Get comments for chapter
    POST /api/comments/ - Add comment
    DELETE /api/comments/{id}/ - Delete comment
    POST /api/comments/{id}/like/ - Like a comment
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Comment.objects.filter(is_deleted=False, parent=None)
        
        manga_id = self.request.query_params.get('manga')
        chapter_id = self.request.query_params.get('chapter')
        
        if manga_id:
            queryset = queryset.filter(manga_id=manga_id, comment_type='manga')
        elif chapter_id:
            queryset = queryset.filter(chapter_id=chapter_id, comment_type='chapter')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        # Auto-set comment_type based on which field is provided
        chapter = serializer.validated_data.get('chapter')
        manga = serializer.validated_data.get('manga')
        comment_type = 'chapter' if chapter else 'manga'
        serializer.save(user=self.request.user, comment_type=comment_type)
    
    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.user != request.user and not request.user.is_staff:
            return Response({'error': 'لا يمكنك حذف هذا التعليق'}, status=403)
        comment.is_deleted = True
        comment.save()
        return Response({'message': 'تم حذف التعليق'})
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Toggle like on comment"""
        comment = self.get_object()
        like, created = CommentLike.objects.get_or_create(
            user=request.user, comment=comment
        )
        if not created:
            like.delete()
            return Response({'liked': False, 'likes_count': comment.likes_count})
        return Response({'liked': True, 'likes_count': comment.likes_count})
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Get all comments for admin dashboard"""
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)
        
        comments = Comment.objects.filter(is_deleted=False).select_related(
            'user', 'manga', 'chapter', 'chapter__manga'
        ).order_by('-created_at')
        
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_replies(self, request):
        """
        Get replies to the current user's comments
        GET /api/comments/my_replies/
        """
        # Find comments made by this user that have replies
        user_comments = Comment.objects.filter(
            user=request.user, 
            is_deleted=False
        ).values_list('id', flat=True)
        
        # Get replies to those comments
        replies = Comment.objects.filter(
            parent_id__in=user_comments,
            is_deleted=False
        ).exclude(user=request.user).select_related(
            'user', 'chapter', 'chapter__manga', 'parent'
        ).order_by('-created_at')
        
        reply_data = []
        for reply in replies:
            reply_data.append({
                'id': str(reply.id),
                'user_name': reply.user.username,
                'content': reply.content,
                'created_at': reply.created_at.isoformat(),
                'chapter_id': str(reply.chapter_id) if reply.chapter else None,
                'chapter_number': reply.chapter.number if reply.chapter else None,
                'manga_title': reply.chapter.manga.title if reply.chapter else None,
                'parent_id': str(reply.parent_id),
                'parent_content': reply.parent.content if reply.parent else '',
            })
        
        return Response(reply_data)


class AchievementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for achievements
    GET /api/achievements/ - List all achievements
    GET /api/achievements/my/ - Get user's unlocked achievements
    POST /api/achievements/check/ - Check and unlock new achievements
    POST /api/achievements/ - Create achievement (admin)
    PUT /api/achievements/{id}/ - Update achievement (admin)
    DELETE /api/achievements/{id}/ - Delete achievement (admin)
    """
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my(self, request):
        """Get user's unlocked achievements"""
        user_achievements = UserAchievement.objects.filter(
            user=request.user, is_completed=True
        ).select_related('achievement')
        serializer = UserAchievementSerializer(user_achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def check(self, request):
        """Check and unlock new achievements based on user stats"""
        user = request.user
        
        # Calculate user stats
        reading_count = ReadingHistory.objects.filter(user=user).count()
        bookmark_count = UserBookmark.objects.filter(user=user).count()
        comment_count = Comment.objects.filter(user=user, is_deleted=False).count()
        reading_time = user.total_reading_time  # in seconds
        
        stats = {
            'reading': reading_count,
            'collection': bookmark_count,
            'social': comment_count,
            'time': reading_time,
        }
        
        # Get all active achievements
        achievements = Achievement.objects.filter(is_active=True)
        newly_unlocked = []
        
        for achievement in achievements:
            # Check if already unlocked
            if UserAchievement.objects.filter(user=user, achievement=achievement, is_completed=True).exists():
                continue
            
            # Check if requirement met
            category = achievement.category
            threshold = achievement.requirement_value
            current_value = stats.get(category, 0)
            
            # Special handling for secret achievements
            if category == 'secret' and achievement.requirement_type == 'night_reading':
                from datetime import datetime
                hour = datetime.now().hour
                if hour >= 3 and hour < 5 and reading_count > 0:
                    current_value = 1
                else:
                    current_value = 0
            
            if current_value >= threshold:
                # Unlock achievement
                user_achievement, created = UserAchievement.objects.get_or_create(
                    user=user, achievement=achievement,
                    defaults={'is_completed': True, 'progress': threshold}
                )
                if created:
                    newly_unlocked.append({
                        'id': str(achievement.id),
                        'name': achievement.name,
                        'name_ar': achievement.name_ar,
                        'description': achievement.description,
                        'reward_points': achievement.reward_points
                    })
                    # Award points
                    user.points += achievement.reward_points
                    user.save()
        
        return Response({
            'newly_unlocked': newly_unlocked,
            'stats': stats
        })

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import FcmToken

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register_fcm_token(request):
    token = request.data.get("token")
    if not token:
        return Response({"detail": "token is required"}, status=status.HTTP_400_BAD_REQUEST)

    # اربط التوكن بالمستخدم
    obj, created = FcmToken.objects.get_or_create(token=token, defaults={"user": request.user})
    if not created and obj.user_id != request.user.id:
        obj.user = request.user
        obj.save(update_fields=["user"])

    return Response({"ok": True})


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .notifications.onesignal import send_onesignal_to_segment

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def onesignal_test(request):
    title = request.data.get("title", "اختبار")
    body = request.data.get("body", "هذا إشعار اختبار من Django ✅")

    try:
        result = send_onesignal_to_segment(title=title, body=body)
        return Response({"ok": True, "result": result})
    except Exception as e:
        return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


