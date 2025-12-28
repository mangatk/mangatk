
@api_view(['GET'])
@permission_classes([IsAdminUser])
def check_translation_status(request, job_id):
    """
    Check translation job status for admin polling
    GET /api/translation/status/<job_id>/
    """
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_pages': job.total_pages,
            'translated_pages': job.translated_pages or 0,
            'error_message': job.error_message
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
