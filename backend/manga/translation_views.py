"""
AI Translation API Views
Handles AI model management and translation workflow
"""
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import AITranslationModel, TranslationJob, Manga, Chapter, ChapterImage
from .serializers import AITranslationModelSerializer, TranslationJobSerializer
from .services.translation import TranslationService
from .services.ai_translator import AITranslator
from .services.imgbb import ImgBBService
import base64
import os

# ==================== AI MODEL MANAGEMENT ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def ai_models_view(request):
    """
    GET: List all AI models
    POST: Create new AI model
    """
    if request.method == 'GET':
        models = AITranslationModel.objects.all()
        serializer = AITranslationModelSerializer(models, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = AITranslationModelSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def ai_model_detail_view(request, model_id):
    """
    GET: Get AI model details
    PATCH: Update AI model
    DELETE: Delete AI model
    """
    try:
        ai_model = AITranslationModel.objects.get(id=model_id)
    except AITranslationModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = AITranslationModelSerializer(ai_model)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = AITranslationModelSerializer(ai_model, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        ai_model.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_ai_model_view(request, model_id):
    """Test connection to AI model"""
    try:
        ai_model = AITranslationModel.objects.get(id=model_id)
    except AITranslationModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=status.HTTP_404_NOT_FOUND)
    
    result = AITranslator.test_connection(ai_model)
    return Response(result)


# ==================== TRANSLATION WORKFLOW ====================

@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_chapter_for_translation(request):
    """
    Upload ZIP/CBZ file for translation
    Returns job_id to track progress and download result
    """
    file = request.FILES.get('file')
    ai_model_id = request.data.get('ai_model_id')
    
    if not file:
        return Response({'error': 'لم يتم تحديد ملف'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file
    is_valid, error_msg = TranslationService.validate_archive(file)
    if not is_valid:
        return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get AI model
    ai_model = None
    if ai_model_id:
        try:
            ai_model = AITranslationModel.objects.get(id=ai_model_id, is_active=True)
        except AITranslationModel.DoesNotExist:
            pass
    
    if not ai_model:
        ai_model = AITranslationModel.objects.filter(is_default=True, is_active=True).first()
    
    if not ai_model:
        return Response({'error': 'لا يوجد نموذج AI متاح'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create translation job
    job = TranslationJob.objects.create(
        user=request.user,
        ai_model=ai_model,
        original_filename=file.name,
        status='uploading'
    )
    
    try:
        # Save uploaded file
        job.temp_upload_path = TranslationService.save_uploaded_file(file, job.id)
        job.status = 'extracting'
        job.save()
        
        # Extract images
        extracted_images = TranslationService.extract_archive(job.temp_upload_path, job.id)
        job.total_pages = len(extracted_images)
        job.temp_extracted_path = str(extracted_images[0]) if extracted_images else ''
        job.status = 'translating'
        job.save()
        
        # Start translation
        translation_results = []
        
        for idx, image_path in enumerate(extracted_images):
            try:
                # Translate image using AI
                translated_image_b64 = AITranslator.translate_image(image_path, ai_model)
                
                # Decode base64 and save temporarily
                import tempfile
                translated_bytes = base64.b64decode(translated_image_b64)
                temp_translated = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                temp_translated.write(translated_bytes)
                temp_translated.close()
                
                # Upload to ImgBB
                imgbb_result = ImgBBService.upload_image(temp_translated.name, f"translated_{job.id}_page_{idx+1}")
                
                # Cleanup temp file
                os.unlink(temp_translated.name)
                
                if imgbb_result:
                    translation_results.append({
                        'page_number': idx + 1,
                        'original_path': image_path,
                        'translated_url': imgbb_result['url']
                    })
                    
                    job.translated_pages = idx + 1
                    job.save()
                
            except Exception as e:
                print(f"Error translating page {idx + 1}: {str(e)}")
                job.error_message += f"\nPage {idx + 1}: {str(e)}"
                job.save()
                continue
        
        job.translation_results = translation_results
        
        if not translation_results:
            job.status = 'failed'
            job.save()
            return Response({
                'job_id': str(job.id),
                'status': 'failed',
                'message': 'فشلت جميع عمليات الترجمة'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create CBZ file
        job.status = 'creating_cbz'
        job.save()
        
        from .services.cbz_service import CBZService
        from pathlib import Path
        from django.conf import settings
        
        output_dir = Path(settings.MEDIA_ROOT) / 'translated_cbz'
        output_path = CBZService.create_cbz_from_urls(
            translation_results,
            output_dir,
            job.id
        )
        
        job.output_file_path = output_path
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.save()
        
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_pages': job.total_pages,
            'translated_pages': job.translated_pages,
            'message': 'تمت الترجمة بنجاح! يمكنك الآن تنزيل الملف',
            'download_url': f'/api/translation/jobs/{job.id}/download/'
        })
        
    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)
        job.save()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def translation_job_status(request, job_id):
    """Get translation job status and progress"""
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only admin or job owner can view
        if not request.user.is_staff and job.user != request.user:
            return Response({'error': 'غير مصرح'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TranslationJobSerializer(job)
        return Response(serializer.data)
        
    except TranslationJob.DoesNotExist:
        return Response({'error': 'المهمة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def translation_jobs_list(request):
    """List all translation jobs"""
    jobs = TranslationJob.objects.all()
    serializer = TranslationJobSerializer(jobs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_translated_cbz(request, job_id):
    """
    Download translated CBZ file
    """
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only admin or job owner can download
        if not request.user.is_staff and job.user != request.user:
            return Response({'error': 'غير مصرح'}, status=status.HTTP_403_FORBIDDEN)
        
        if job.status != 'completed':
            return Response({
                'error': f'الملف غير جاهز بعد. الحالة: {job.get_status_display()}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not job.output_file_path or not os.path.exists(job.output_file_path):
            return Response({
                'error': 'الملف المترجم غير موجود'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Serve file
        from django.http import FileResponse
        import mimetypes
        
        file_handle = open(job.output_file_path, 'rb')
        response = FileResponse(file_handle, content_type='application/x-cbz')
        
        # Set filename
        filename = f"translated_{job.original_filename}"
        if not filename.endswith('.cbz'):
            filename = filename.rsplit('.', 1)[0] + '.cbz'
        
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = os.path.getsize(job.output_file_path)
        
        return response
        
    except TranslationJob.DoesNotExist:
        return Response({'error': 'المهمة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_translation_job(request, job_id):
    """Delete translation job and cleanup files"""
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Cleanup files
        TranslationService.cleanup_job(job.id)
        
        # Delete job
        job.delete()
        
        return Response({'message': 'تم حذف المهمة بنجاح'})
        
    except TranslationJob.DoesNotExist:
        return Response({'error': 'المهمة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
