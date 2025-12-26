"""
Auth API Views for user authentication with JWT
Provides login, register, and user profile endpoints
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint - returns JWT tokens
    POST /api/auth/login/
    Body: { email: string, password: string } OR { username: string, password: string }
    """
    email = request.data.get('email')
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not password:
        return Response({'error': 'كلمة المرور مطلوبة'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user by email or username
    user = None
    if email:
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass
    elif username:
        user = authenticate(username=username, password=password)
    
    if user is None:
        return Response({'error': 'بيانات الدخول غير صحيحة'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({'error': 'الحساب معطل'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Generate JWT tokens
    tokens = get_tokens_for_user(user)
    
    return Response({
        'success': True,
        'tokens': tokens,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'avatar_url': user.avatar_url or '',
            'points': user.points,
            'equipped_title': user.equipped_title or '',
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register endpoint - returns JWT tokens
    POST /api/auth/register/
    Body: { username: string, email: string, password: string }
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not email or not password:
        return Response({'error': 'جميع الحقول مطلوبة'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response({'error': 'اسم المستخدم موجود بالفعل'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response({'error': 'البريد الإلكتروني مسجل بالفعل'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password length
    if len(password) < 6:
        return Response({'error': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    
    # Generate JWT tokens
    tokens = get_tokens_for_user(user)
    
    return Response({
        'success': True,
        'tokens': tokens,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'avatar_url': '',
            'points': user.points,
            'equipped_title': '',
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """
    Refresh token endpoint
    POST /api/auth/refresh/
    Body: { refresh: string }
    """
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    except Exception as e:
        return Response({'error': 'Token غير صالح'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Get or update current user profile
    GET /api/auth/profile/
    PATCH /api/auth/profile/  - Update equipped_title
    """
    user = request.user
    
    if request.method == 'PATCH':
        equipped_title = request.data.get('equipped_title')
        if equipped_title is not None:
            user.equipped_title = equipped_title
            user.save()
    
    return Response({
        'id': str(user.id),
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'avatar_url': user.avatar_url or '',
        'bio': user.bio or '',
        'points': user.points,
        'chapters_read': user.chapters_read,
        'total_reading_time': user.total_reading_time,
        'equipped_title': user.equipped_title or '',
    })

