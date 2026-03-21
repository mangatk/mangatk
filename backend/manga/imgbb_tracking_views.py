from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import ImgBBUploadStats

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_imgbb_upload(request):
    """
    Track successful ImgBB uploads (called by the frontend).
    Expects {"count": <int>}
    """
    count = request.data.get('count', 1)
    try:
        count = int(count)
    except (ValueError, TypeError):
        count = 1
        
    if count <= 0:
        return Response({'success': True})
        
    today = timezone.localtime().date()
    stats, created = ImgBBUploadStats.objects.get_or_create(date=today)
    stats.count += count
    stats.save()
    
    return Response({'success': True, 'today_count': stats.count})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_imgbb_stats(request):
    """
    Get ImgBB upload stats for today, yesterday, and two days ago.
    """
    today = timezone.localtime().date()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)
    
    stats = ImgBBUploadStats.objects.filter(date__gte=two_days_ago)
    
    data = {
        'today': 0,
        'yesterday': 0,
        'two_days_ago': 0
    }
    
    for stat in stats:
        if stat.date == today:
            data['today'] = stat.count
        elif stat.date == yesterday:
            data['yesterday'] = stat.count
        elif stat.date == two_days_ago:
            data['two_days_ago'] = stat.count
            
    return Response(data)
