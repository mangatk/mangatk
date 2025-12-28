from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import TranslationJob
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def check_translation_status(request, job_id):
    """
    Check the status of a translation job for admin dashboard
    """
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_pages': job.total_pages,
            'translated_pages': job.translated_pages,
            'error_message': job.error_message,
            'progress_percentage': int((job.translated_pages / job.total_pages * 100) if job.total_pages > 0 else 0)
        })
        
    except TranslationJob.DoesNotExist:
        return Response({
            'error': 'Translation job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error checking translation status: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
