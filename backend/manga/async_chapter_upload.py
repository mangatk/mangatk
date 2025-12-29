"""
Async Chapter Upload Endpoints
===============================

RESTful endpoints لرفع ف صول المانجا بشكل غير متزامن مع realtime progress tracking
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
import uuid
import zipfile
import io
import os
from datetime import datetime

from .models import Manga, Chapter, ChapterImage
from .services.imgbb import ImgBBService
from .services.async_upload import async_upload_service
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def start_async_chapter_upload(request):
    """
    بدء رفع فصل بشكل غير متزامن
    
    POST /api/chapters/upload-async/
    
    Body (multipart/form-data):
        - manga_id: UUID
        - chapter_number: float
        - title: string (optional)
        - release_date: YYYY-MM-DD (optional)
        - file: ZIP/CBZ
    
    Returns:
        - job_id: UUID للعملية
        - message: رسالة
    """
    try:
        manga_id = request.data.get('manga')
        number = request.data.get('number')
        title = request.data.get('title', '')
        release_date_str = request.data.get('release_date', '')
        uploaded_file = request.FILES.get('file')
        
        # Validation
        if not all([manga_id, number, uploaded_file]):
            return Response({
                'error': 'manga, number, and file are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate manga exists
        try:
            manga = Manga.objects.get(id=manga_id)
        except Manga.DoesNotExist:
            return Response({
                'error': 'المانجا غير موجودة'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate ZIP
        if not uploaded_file.name.endswith(('.zip', '.cbz')):
            return Response({
                'error': 'الملف يجب أن يكون ZIP أو CBZ'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse release date
        release_date = None
        if release_date_str:
            try:
                release_date = datetime.strptime(release_date_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        # Create/update chapter
        defaults = {'title': title or f'{manga.title} - الفصل {number}'}
        if release_date:
            defaults['release_date'] = release_date
        
        chapter, created = Chapter.objects.get_or_create(
            manga=manga,
            number=float(number),
            defaults=defaults
        )
        
        if not created:
            # Clear existing images
            chapter.images.all().delete()
            chapter.title = title or chapter.title
            if release_date:
                chapter.release_date = release_date
            chapter.save()
        
        # Extract images from ZIP FIRST
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
        image_data_list = []
        
        try:
            with zipfile.ZipFile(uploaded_file, 'r') as zip_file:
                image_files = sorted([
                    f for f in zip_file.namelist()
                    if f.lower().endswith(image_extensions) and not f.startswith('__MACOSX')
                ])
                
                for page_num, filename in enumerate(image_files, 1):
                    file_data = zip_file.read(filename)
                    image_data_list.append({
                        'data': file_data,
                        'filename': os.path.basename(filename),
                        'page_num': page_num,
                        'name': f"{manga.title}_ch{int(float(number)):03d}_p{page_num:03d}"
                    })
                
        except zipfile.BadZipFile:
            return Response({
                'error': 'Invalid ZIP/CBZ file'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not image_data_list:
            return Response({
                'error': 'لا توجد صور في الملف'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # NOW set upload status with correct count
        chapter.upload_status = 'uploading'
        chapter.uploaded_images_count = 0
        chapter.total_images_count = len(image_data_list)
        chapter.save(update_fields=['upload_status', 'uploaded_images_count', 'total_images_count'])
        logger.info(f"📦 Extracted {len(image_data_list)} images from ZIP, starting upload for chapter {chapter.id}")
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Store job info in cache
        cache.set(f'upload_job_{job_id}', {
            'status': 'started',
            'total': len(image_data_list),
            'completed': 0,
            'failed': 0,
            'chapter_id': str(chapter.id),
            'manga_id': str(manga_id),
            'results': [],
            'errors': []
        }, timeout=3600)  # 1 hour
        
        # Upload function for single image
        def upload_single_image(image_info):
            try:
                # Create BytesIO object from binary data
                file_obj = io.BytesIO(image_info['data'])
                file_obj.name = image_info['filename']  # Add name attribute
                file_obj.seek(0)  # Reset pointer to beginning
                
                logger.info(f"🔄 Uploading image: {image_info['filename']} (page {image_info['page_num']})")
                
                result = ImgBBService.upload_image(file_obj, image_info['name'])
                
                if result:
                    # Create ChapterImage record
                    ChapterImage.objects.create(
                        chapter=chapter,
                        page_number=image_info['page_num'],
                        image_url=result['url'],
                        width=result.get('width'),
                        height=result.get('height'),
                        original_filename=image_info['filename']
                    )
                    
                    # Update chapter progress - LIKE TRANSLATION!
                    chapter.uploaded_images_count += 1
                    chapter.save(update_fields=['uploaded_images_count'])
                    logger.info(f"✅ Uploaded page {image_info['page_num']} ({chapter.uploaded_images_count}/{chapter.total_images_count})")
                    
                    return {
                        'success': True,
                        'page_num': image_info['page_num'],
                        'url': result['url']
                    }
                else:
                    logger.error(f"❌ ImgBB returned None for {image_info['filename']}")
                    raise Exception(f"فشل رفع الصورة {image_info['filename']}")
            except Exception as e:
                logger.error(f"❌ Error uploading {image_info['filename']}: {str(e)}")
                raise Exception(f"فشل رفع الصورة {image_info['filename']}: {str(e)}")
        
        # Progress callback
        def on_progress(current, total, result):
            job_data = cache.get(f'upload_job_{job_id}')
            if job_data:
                job_data['completed'] = current
                job_data['status'] = 'uploading'
                job_data['results'].append(result)
                cache.set(f'upload_job_{job_id}', job_data, timeout=3600)
        
        # Complete callback
        def on_complete(results):
            job_data = cache.get(f'upload_job_{job_id}')
            if job_data:
                job_data['status'] = 'completed'
                job_data['completed'] = results['completed']
                job_data['failed'] = results['failed']
                job_data['errors'] = results['errors']
                cache.set(f'upload_job_{job_id}', job_data, timeout=3600)
            
            # Update chapter status
            chapter.upload_status = 'completed'
            chapter.save(update_fields=['upload_status'])
            logger.info(f"Chapter upload job {job_id} completed")
        
        # Error callback
        def on_error(error):
            job_data = cache.get(f'upload_job_{job_id}')
            if job_data:
                job_data['status'] = 'failed'
                job_data['error'] = error.get('error', 'Unknown error')
                cache.set(f'upload_job_{job_id}', job_data, timeout=3600)
            logger.error(f"Chapter upload job {job_id} failed: {error}")
        
        # Start async upload
        logger.info(f"Starting async upload for job {job_id} with {len(image_data_list)} images")
        async_upload_service.upload_images_async(
            job_id=job_id,
            images=image_data_list,
            upload_function=upload_single_image,
            on_progress=on_progress,
            on_complete=on_complete,
            on_error=on_error
        )
        
        logger.info(f"Started async upload job {job_id} for chapter {chapter.id}")
        
        return Response({
            'job_id': job_id,
            'chapter_id': str(chapter.id),
            'total_images': len(image_data_list),
            'message': 'بدأت عملية الرفع'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Failed to start async upload: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_upload_progress(request, job_id):
    """
    الحصول على تقدم عملية الرفع
    
    GET /api/chapters/upload-progress/<job_id>/
    
    Returns:
        - status: 'started' | 'uploading' | 'completed' | 'failed'
        - total: عدد الصور الكلي
        - completed: عدد الصور المرفوعة
        - failed: عدد الصور الفاشلة
        - percentage: النسبة المئوية
    """
    job_data = cache.get(f'upload_job_{job_id}')
    
    if not job_data:
        return Response({
            'error': 'Job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    percentage = 0
    if job_data['total'] > 0:
        percentage = round((job_data['completed'] / job_data['total']) * 100)
    
    return Response({
        'job_id': job_id,
        'status': job_data['status'],
        'total': job_data['total'],
        'completed': job_data['completed'],
        'failed': job_data['failed'],
        'percentage': percentage,
        'chapter_id': job_data.get('chapter_id'),
        'error': job_data.get('error')
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def cancel_upload(request, job_id):
    """
    إلغاء عملية رفع
    
    DELETE /api/chapters/cancel-upload/<job_id>/
    """
    # Try to cancel in async service
    cancelled = async_upload_service.cancel_job(job_id)
    
    # Update cache
    job_data = cache.get(f'upload_job_{job_id}')
    if job_data:
        job_data['status'] = 'cancelled'
        cache.set(f'upload_job_{job_id}', job_data, timeout=3600)
    
    if cancelled or job_data:
        return Response({
            'message': 'تم إلغاء العملية'
        })
    else:
        return Response({
            'error': 'Job not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_chapter_upload_progress(request, chapter_id):
    """
    الحصول على تقدم رفع الفصل من Chapter model مباشرة (مثل الترجمة)
    
    GET /api/chapters/<chapter_id>/upload-status/
    
    Returns:
        - status: upload_status من Chapter
        - uploaded: uploaded_images_count
        - total: total_images_count
        - percentage: النسبة المئوية
    """
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        
        percentage = 0
        if chapter.total_images_count > 0:
            percentage = round((chapter.uploaded_images_count / chapter.total_images_count) * 100)
        
        logger.info(f"📤 Chapter {chapter_id} progress: {chapter.uploaded_images_count}/{chapter.total_images_count} ({percentage}%)")
        
        return Response({
            'chapter_id': str(chapter.id),
            'status': chapter.upload_status,
            'uploaded': chapter.uploaded_images_count,
            'total': chapter.total_images_count,
            'percentage': percentage
        })
    except Chapter.DoesNotExist:
        return Response({
            'error': 'Chapter not found'
        }, status=status.HTTP_404_NOT_FOUND)
