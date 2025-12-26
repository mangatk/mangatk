"""
Translation API Endpoints
=========================

REST API endpoints for manga chapter translation workflow
"""

import os
import uuid
import zipfile
from django.http import FileResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.conf import settings

from .models import Manga, Chapter
from .translation_service import TranslationService
import logging

logger = logging.getLogger(__name__)

# Store translation jobs in memory (for production, use Redis or database)
TRANSLATION_JOBS = {}


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def upload_for_translation(request):
    """
    رفع فصل للترجمة
    
    POST /api/translation/upload/
    
    Body (multipart/form-data):
        - manga_id: UUID of manga
        - chapter_number: float/int
        - file: ZIP/CBZ file
        
    Returns:
        - job_id: UUID للعملية
        - status: 'uploaded'
        - message: رسالة
    """
    try:
        manga_id = request.data.get('manga_id')
        chapter_number = request.data.get('chapter_number')
        uploaded_file = request.FILES.get('file')
        
        # Validation
        if not all([manga_id, chapter_number, uploaded_file]):
            return Response({
                'error': 'manga_id, chapter_number, and file are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate manga exists
        try:
            manga = Manga.objects.get(id=manga_id)
        except Manga.DoesNotExist:
            return Response({
                'error': 'المانجا غير موجودة'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate ZIP file
        if not uploaded_file.name.endswith(('.zip', '.cbz')):
            return Response({
                'error': 'الملف يجب أن يكون ZIP أو CBZ'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create job ID
        job_id = str(uuid.uuid4())
        
        # Save uploaded file temporarily
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_translations')
        os.makedirs(temp_dir, exist_ok=True)
        
        original_filename = f"{job_id}_original.zip"
        original_path = os.path.join(temp_dir, original_filename)
        
        with open(original_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        # Validate ZIP
        is_valid, message = TranslationService.validate_zip(original_path)
        if not is_valid:
            os.remove(original_path)
            return Response({
                'error': f'ملف غير صحيح: {message}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store job info
        TRANSLATION_JOBS[job_id] = {
            'status': 'uploaded',
            'manga_id': manga_id,
            'manga_title': manga.title,
            'chapter_number': float(chapter_number),
            'original_path': original_path,
            'translated_path': None,
            'progress': 0,
            'message': 'تم رفع الملف بنجاح',
            'error': None,
            'created_at': str(uuid.uuid1().time)
        }
        
        logger.info(f"Translation job {job_id} created for manga {manga.title}")
        
        return Response({
            'job_id': job_id,
            'status': 'uploaded',
            'message': 'تم رفع الملف بنجاح',
            'manga_title': manga.title,
            'chapter_number': float(chapter_number)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        return Response({
            'error': f'فشل الرفع: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def start_translation(request, job_id):
    """
    بدء عملية الترجمة
    
    POST /api/translation/start/<job_id>/
    
    Returns:
        - status: 'translating'
        - message: رسالة
    """
    try:
        if job_id not in TRANSLATION_JOBS:
            return Response({
                'error': 'Job not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        job = TRANSLATION_JOBS[job_id]
        
        if job['status'] != 'uploaded':
            return Response({
                'error': f"Cannot start translation. Current status: {job['status']}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status
        job['status'] = 'translating'
        job['progress'] = 10
        job['message'] = 'جاري الترجمة...'
        
        # Start translation in background (for production, use Celery)
        # For now, we'll do it synchronously
        try:
            temp_dir = os.path.dirname(job['original_path'])
            translated_path, info = TranslationService.translate_chapter(
                job['original_path'],
                output_dir=temp_dir
            )
            
            # Update job
            job['status'] = 'completed'
            job['progress'] = 100
            job['translated_path'] = translated_path
            job['message'] = f"تمت الترجمة بنجاح - {info['total_images']} صورة"
            job['translation_info'] = info
            
            logger.info(f"Translation job {job_id} completed successfully")
            
            return Response({
                'status': 'completed',
                'message': job['message'],
                'info': info
            })
            
        except Exception as e:
            job['status'] = 'failed'
            job['error'] = str(e)
            job['message'] = f'فشلت الترجمة: {str(e)}'
            logger.error(f"Translation job {job_id} failed: {str(e)}")
            
            return Response({
                'error': job['message']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Start translation failed: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def translation_status(request, job_id):
    """
    الحصول على حالة عملية الترجمة
    
    GET /api/translation/status/<job_id>/
    
    Returns:
        - status: 'uploaded' | 'translating' | 'completed' | 'failed'
        - progress: 0-100
        - message: رسالة حالة
    """
    if job_id not in TRANSLATION_JOBS:
        return Response({
            'error': 'Job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    job = TRANSLATION_JOBS[job_id]
    
    return Response({
        'job_id': job_id,
        'status': job['status'],
        'progress': job['progress'],
        'message': job['message'],
        'error': job.get('error'),
        'manga_title': job['manga_title'],
        'chapter_number': job['chapter_number'],
        'translation_info': job.get('translation_info')
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def download_translated(request, job_id):
    """
    تحميل الفصل المترجم
    
    GET /api/translation/download/<job_id>/
    
    Returns:
        FileResponse with translated ZIP
    """
    if job_id not in TRANSLATION_JOBS:
        return Response({
            'error': 'Job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    job = TRANSLATION_JOBS[job_id]
    
    if job['status'] != 'completed':
        return Response({
            'error': f"Translation not completed. Status: {job['status']}"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not job['translated_path'] or not os.path.exists(job['translated_path']):
        return Response({
            'error': 'Translated file not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Return file
    filename = f"translated_ch{job['chapter_number']}.zip"
    response = FileResponse(
        open(job['translated_path'], 'rb'),
        content_type='application/zip'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_images_preview(request, job_id):
    """
    الحصول على معاينة للصور (الأصلية والمترجمة)
    
    GET /api/translation/preview/<job_id>/?type=original|translated
    
    Returns:
        - images: قائمة بأسماء الصور
        - total: عدد الصور
    """
    if job_id not in TRANSLATION_JOBS:
        return Response({
            'error': 'Job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    job = TRANSLATION_JOBS[job_id]
    img_type = request.query_params.get('type', 'original')
    
    zip_path = job['original_path'] if img_type == 'original' else job.get('translated_path')
    
    if not zip_path or not os.path.exists(zip_path):
        return Response({
            'error': f'{img_type} file not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
            images = [
                f for f in zip_ref.namelist()
                if f.lower().endswith(image_extensions)
                and not f.startswith('__MACOSX')
            ]
            images.sort()
            
            return Response({
                'images': images,
                'total': len(images),
                'type': img_type
            })
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def save_translated_chapter(request, job_id):
    """
    حفظ الفصل المترجم (رفع إلى ImgBB وحفظ في قاعدة البيانات)
    
    POST /api/translation/save/<job_id>/
    
    Body:
        - chapter_title: عنوان الفصل (اختياري)
        - release_date: تاريخ النشر (اختياري)
    
    Returns:
        - chapter_id: UUID للفصل المحفوظ
        - message: رسالة النجاح
    """
    if job_id not in TRANSLATION_JOBS:
        return Response({
            'error': 'Job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    job = TRANSLATION_JOBS[job_id]
    
    if job['status'] != 'completed':
        return Response({
            'error': 'Translation not completed yet'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Use the existing chapter upload logic
        manga = Manga.objects.get(id=job['manga_id'])
        chapter_title = request.data.get('chapter_title', '')
        release_date = request.data.get('release_date', None)
        
        # Create FormData-like object for upload
        with open(job['translated_path'], 'rb') as f:
            from django.core.files.uploadedfile import InMemoryUploadedFile
            from io import BytesIO
            
            file_content = f.read()
            file_obj = InMemoryUploadedFile(
                BytesIO(file_content),
                'file',
                os.path.basename(job['translated_path']),
                'application/zip',
                len(file_content),
                None
            )
            
            # Use existing upload endpoint logic
            # This will handle ImgBB upload automatically
            from .views import ChapterViewSet
            viewset = ChapterViewSet()
            
            # Simulate request data
            class FakeRequest:
                data = {
                    'manga': job['manga_id'],
                    'number': str(job['chapter_number']),
                    'title': chapter_title or f"{manga.title} - الفصل {job['chapter_number']} (مترجم)",
                    'release_date': release_date or ''
                }
                FILES = {'file': file_obj}
            
            fake_request = FakeRequest()
            
            # Call upload action
            response = viewset.upload(fake_request)
            
            if response.status_code == 200:
                # Cleanup
                _cleanup_translation_job(job_id)
                
                return Response({
                    'chapter_id': response.data.get('chapter_id'),
                    'message': response.data.get('message'),
                    'images_count': response.data.get('images_count')
                })
            else:
                return Response(response.data, status=response.status_code)
        
    except Exception as e:
        logger.error(f"Save translated chapter failed: {str(e)}")
        return Response({
            'error': f'فشل حفظ الفصل: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def delete_translation_job(request, job_id):
    """
    حذف عملية ترجمة
    
    DELETE /api/translation/delete/<job_id>/
    """
    if job_id not in TRANSLATION_JOBS:
        return Response({
            'error': 'Job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    _cleanup_translation_job(job_id)
    
    return Response({
        'message': 'تم حذف العملية بنجاح'
    })


def _cleanup_translation_job(job_id):
    """تنظيف ملفات عملية الترجمة"""
    if job_id in TRANSLATION_JOBS:
        job = TRANSLATION_JOBS[job_id]
        
        # Delete files
        if job.get('original_path') and os.path.exists(job['original_path']):
            os.remove(job['original_path'])
        
        if job.get('translated_path') and os.path.exists(job['translated_path']):
            os.remove(job['translated_path'])
        
        # Remove from dict
        del TRANSLATION_JOBS[job_id]
        
        logger.info(f"Cleaned up translation job {job_id}")
