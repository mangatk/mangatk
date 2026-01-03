"""
Translation Dashboard Views
===========================
API endpoints for integrated chapter translation in dashboard
"""

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.conf import settings

from .models import TranslationJob, Manga, Chapter, ChapterImage
from .serializers import TranslationJobSerializer
from .services.translation import TranslationService
from .services.custom_translator import CustomTranslator
from .services.imgbb import ImgBBService

import os
import logging
from pathlib import Path
from typing import List, Dict

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_for_preview(request):
    """
    رفع ملف ZIP/CBZ للترجمة والمعاينة
    
    POST /api/translation/upload-for-preview/
    
    Request:
        - file: ملف ZIP/CBZ
        
    Response:
        - job_id: معرف العملية
        - original_images: روابط الصور الأصلية (مؤقتة)
        - translated_images: روابط الصور المترجمة (مؤقتة)
        - total_pages: عدد الصفحات
        - status: حالة الترجمة
    """
    
    file = request.FILES.get('file')
    
    if not file:
        return Response({
            'error': 'لم يتم تحديد ملف'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file
    is_valid, error_msg = TranslationService.validate_archive(file)
    if not is_valid:
        return Response({
            'error': error_msg
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create translation job
    job = TranslationJob.objects.create(
        user=request.user,
        original_filename=file.name,
        status='uploading'
    )
    
    try:
        # 1. Save uploaded file
        job.temp_upload_path = TranslationService.save_uploaded_file(file, job.id)
        job.status = 'extracting'
        job.save()
        
        # 2. Extract original images
        extracted_images = TranslationService.extract_archive(job.temp_upload_path, job.id)
        job.total_pages = len(extracted_images)
        job.status = 'translating'
        job.save()
        
        # 3. Translate images using custom model
        logger.info(f"Translating {len(extracted_images)} images for job {job.id}")
        
        # Create output directory for translated images
        translation_output_dir = Path(settings.MEDIA_ROOT) / 'translations' / 'temp' / str(job.id) / 'translated'
        translation_output_dir.mkdir(parents=True, exist_ok=True)
        
        # Call custom translator
        translated_image_paths = CustomTranslator.translate_chapter(
            job.temp_upload_path,
            str(translation_output_dir)
        )
        
        job.translated_pages = len(translated_image_paths)
        
        # 4. Store paths for preview
        # Original images paths (local)
        original_images_data = []
        for idx, img_path in enumerate(extracted_images, 1):
            original_images_data.append({
                'page_number': idx,
                'local_path': str(img_path),
                'filename': os.path.basename(img_path)
            })
        
        # Translated images paths (local)
        translated_images_data = []
        for idx, img_path in enumerate(translated_image_paths, 1):
            translated_images_data.append({
                'page_number': idx,
                'local_path': str(img_path),
                'filename': os.path.basename(img_path)
            })
        
        # Save to job
        job.original_images_paths = original_images_data
        job.translation_results = translated_images_data
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.save()
        
        logger.info(f"Translation completed for job {job.id}")
        
        # Return URLs for preview (we'll serve them via Django)
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_pages': job.total_pages,
            'translated_pages': job.translated_pages,
            'message': 'تمت الترجمة بنجاح! يمكنك الآن معاينة النتائج',
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in translation job {job.id}: {str(e)}")
        job.status = 'failed'
        job.error_message = str(e)
        job.save()
        
        return Response({
            'error': f'فشلت عملية الترجمة: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_translation_preview(request, job_id):
    """
    الحصول على معلومات المعاينة لعملية ترجمة
    
    GET /api/translation/preview/<job_id>/
    
    Response:
        - job_id
        - original_images: قائمة الصور الأصلية
        - translated_images: قائمة الصور المترجمة
        - total_pages
        - status
    """
    
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only admin or job owner can view
        if not request.user.is_staff and job.user != request.user:
            return Response({
                'error': 'غير مصرح'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Build image URLs for frontend
        original_images = []
        for img_data in job.original_images_paths:
            original_images.append({
                'page_number': img_data['page_number'],
                'url': f"/api/translation/preview/{job_id}/image/original/{img_data['page_number']}/",
                'filename': img_data['filename']
            })
        
        translated_images = []
        for img_data in job.translation_results:
            translated_images.append({
                'page_number': img_data['page_number'],
                'url': f"/api/translation/preview/{job_id}/image/translated/{img_data['page_number']}/",
                'filename': img_data['filename']
            })
        
        return Response({
            'job_id': str(job.id),
            'original_images': original_images,
            'translated_images': translated_images,
            'total_pages': job.total_pages,
            'status': job.status,
            'error_message': job.error_message
        })
        
    except TranslationJob.DoesNotExist:
        return Response({
            'error': 'المهمة غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def serve_preview_image(request, job_id, image_type, page_number):
    """
    تقديم صورة من المعاينة
    
    GET /api/translation/preview/<job_id>/image/<original|translated>/<page_number>/
    """
    
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only admin or job owner can view
        if not request.user.is_staff and job.user != request.user:
            return Response({
                'error': 'غير مصرح'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get image path
        page_num = int(page_number)
        
        if image_type == 'original':
            images_data = job.original_images_paths
        elif image_type == 'translated':
            images_data = job.translation_results
        else:
            return Response({
                'error': 'نوع صورة غير صالح'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find image
        image_data = next(
            (img for img in images_data if img['page_number'] == page_num),
            None
        )
        
        if not image_data:
            return Response({
                'error': 'الصورة غير موجودة'
            }, status=status.HTTP_404_NOT_FOUND)
        
        image_path = image_data['local_path']
        
        if not os.path.exists(image_path):
            return Response({
                'error': 'ملف الصورة غير موجود'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Serve image
        from django.http import FileResponse
        import mimetypes
        
        content_type, _ = mimetypes.guess_type(image_path)
        file_handle = open(image_path, 'rb')
        response = FileResponse(file_handle, content_type=content_type or 'image/jpeg')
        
        return response
        
    except TranslationJob.DoesNotExist:
        return Response({
            'error': 'المهمة غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error serving preview image: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def publish_translated_chapter(request):
    """
    نشر الفصل المترجم إلى المانجا (يعمل في الخلفية)
    
    POST /api/translation/publish-chapter/
    
    Request:
        - job_id: معرف عملية الترجمة
        - manga_id: معرف المانجا
        - chapter_number: رقم الفصل
        - title: عنوان الفصل (اختياري)
        - release_date: تاريخ النشر (اختياري)
        
    Response:
        - 202 Accepted
        - job_id: معرف المهمة للمتابعة
        - message: رسالة
    """
    
    job_id = request.data.get('job_id')
    manga_id = request.data.get('manga_id')
    chapter_number = request.data.get('chapter_number')
    title = request.data.get('title', '')
    release_date = request.data.get('release_date')
    
    if not all([job_id, manga_id, chapter_number]):
        return Response({
            'error': 'job_id و manga_id و chapter_number مطلوبة'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get translation job
        job = TranslationJob.objects.get(id=job_id)
        
        if job.status != 'completed':
            return Response({
                'error': 'عملية الترجمة غير مكتملة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get manga
        manga = Manga.objects.get(id=manga_id)
        
        # Parse release date
        from datetime import datetime
        release_date_obj = None
        if release_date:
            try:
                release_date_obj = datetime.strptime(release_date, '%Y-%m-%d').date()
            except ValueError:
                pass
        
        # Create or update chapter
        defaults = {
            'title': title or f'{manga.title} - الفصل {chapter_number}'
        }
        if release_date_obj:
            defaults['release_date'] = release_date_obj
        
        chapter, created = Chapter.objects.get_or_create(
            manga=manga,
            number=float(chapter_number),
            defaults=defaults
        )
        
        if not created:
            # Clear existing images if re-uploading
            chapter.images.all().delete()
            if title:
                chapter.title = title
            if release_date_obj:
                chapter.release_date = release_date_obj
            chapter.save()
        
        logger.info(f"Starting background upload for chapter {chapter_number} of manga {manga.title}")
        
        # Get images data before thread
        translated_images_data = job.translation_results
        total_images = len(translated_images_data)
        
        # Update job status
        job.status = 'publishing'
        job.translated_pages = 0
        job.total_pages = total_images
        job.save()
        
        # Define background upload function
        def upload_in_background():
            """Upload images to ImgBB in background thread"""
            import threading
            from django.db import connection
            
            # Close old database connection (thread-safe)
            connection.close()
            
            uploaded_count = 0
            failed_count = 0
            
            try:
                for img_data in translated_images_data:
                    try:
                        page_number = img_data['page_number']
                        local_path = img_data['local_path']
                        
                        # Upload to imgbb
                        imgbb_name = f"{manga.title}_ch{int(float(chapter_number)):03d}_p{page_number:03d}"
                        result = ImgBBService.upload_image(local_path, imgbb_name)
                        
                        if result:
                            # Create ChapterImage record
                            ChapterImage.objects.create(
                                chapter=chapter,
                                page_number=page_number,
                                image_url=result['url'],
                                width=result.get('width'),
                                height=result.get('height'),
                                original_filename=img_data['filename']
                            )
                            uploaded_count += 1
                            
                            # Update progress - THIS IS NOW VISIBLE!
                            job.translated_pages = uploaded_count
                            job.save(update_fields=['translated_pages'])
                            
                            logger.info(f"Uploaded page {page_number} to imgbb ({uploaded_count}/{total_images})")
                        else:
                            failed_count += 1
                            logger.error(f"Failed to upload page {page_number} to imgbb")
                            
                    except Exception as e:
                        failed_count += 1
                        logger.error(f"Error uploading page {img_data.get('page_number', '?')}: {e}")
                
                # Clean up temporary directory
                TranslationService.cleanup_job(str(job.id))
                
                # Mark as completed
                job.status = 'published'
                job.error_message = ''
                if failed_count > 0:
                    job.error_message = f'فشل رفع {failed_count} من {total_images} صورة'
                job.save()
                
                logger.info(f"Background upload completed: {uploaded_count} uploaded, {failed_count} failed")
                
            except Exception as e:
                # Mark as failed
                job.status = 'failed'
                job.error_message = str(e)
                job.save()
                logger.error(f"Background upload failed: {e}")
            finally:
                # Close database connection
                connection.close()
        
        # Start background thread
        import threading
        upload_thread = threading.Thread(target=upload_in_background)
        upload_thread.daemon = True
        upload_thread.start()
        
        # Return immediately with 202 Accepted
        return Response({
            'success': True,
            'job_id': str(job.id),
            'message': 'بدأ رفع الصور في الخلفية',
            'total_pages': total_images
        }, status=status.HTTP_202_ACCEPTED)
        
    except TranslationJob.DoesNotExist:
        return Response({
            'error': 'عملية الترجمة غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)
    except Manga.DoesNotExist:
        return Response({
            'error': 'المانجا غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error starting publish: {e}")
        return Response({
            'error': f'فشل بدء النشر: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
