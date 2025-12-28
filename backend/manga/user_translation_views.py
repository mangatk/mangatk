"""
User Translation Views
======================
API endpoints for public translation service (regular users)
"""

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.conf import settings
from django.http import FileResponse

from .models import TranslationJob
from .serializers import TranslationJobSerializer
from .services.translation import TranslationService
from .services.custom_translator import CustomTranslator
from .services.cbz_service import CBZService

import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_for_translation(request):
    """
    رفع ملف للترجمة (للمستخدمين العاديين)
    
    POST /api/translate/upload/
    
    Request:
        - file: ملف ZIP/CBZ
        
    Response:
        - job_id: معرف العملية
        - status: حالة الترجمة
        - message: رسالة
    """
    
    # Constants
    TRANSLATION_COST = 20  # نقاط مطلوبة للترجمة
    
    file = request.FILES.get('file')
    
    if not file:
        return Response({
            'error': 'لم يتم تحديد ملف'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check user points (but don't deduct yet!)
    try:
        # Try to get points from User model directly
        if hasattr(request.user, 'points'):
            current_points = request.user.points
        else:
            # If User doesn't have points attribute, it might be in a profile
            # For now, assume points are in User model or create default
            current_points = 0
            logger.warning(f"User {request.user.username} has no points attribute. Setting to 0")
    except Exception as e:
        logger.error(f"Error getting user points: {e}")
        current_points = 0
    
    if current_points < TRANSLATION_COST:
        return Response({
            'error': f'نقاط غير كافية! تحتاج إلى {TRANSLATION_COST} نقطة للترجمة. رصيدك الحالي: {current_points} نقطة',
            'required_points': TRANSLATION_COST,
            'current_points': current_points
        }, status=status.HTTP_402_PAYMENT_REQUIRED)
    
    # Validate file (before deducting points!)
    is_valid, error_msg = TranslationService.validate_archive(file)
    if not is_valid:
        # No refund needed - we haven't deducted yet
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
        job.save()
        
        # Store original images paths
        original_images_data = []
        for idx, img_path in enumerate(extracted_images, 1):
            original_images_data.append({
                'page_number': idx,
                'local_path': str(img_path),
                'filename': os.path.basename(img_path)
            })
        job.original_images_paths = original_images_data
        job.status = 'translating'
        job.save()
        
        # ====================================================================
        # NOW deduct points - translation is actually starting
        # ====================================================================
        points_deducted = False
        current_balance = current_points
        
        try:
            if hasattr(request.user, 'points'):
                request.user.points -= TRANSLATION_COST
                request.user.save()
                current_balance = request.user.points
                points_deducted = True
                logger.info(f"✅ Deducted {TRANSLATION_COST} points from user {request.user.username}. New balance: {current_balance}")
            else:
                logger.warning(f"Points system not configured for user {request.user.username}. Allowing translation without deduction.")
                points_deducted = False
        except Exception as e:
            logger.error(f"Error deducting points: {e}")
            # Continue anyway - don't fail translation due to points
            points_deducted = False
        
        # 3. Start async translation
        logger.info(f"Starting async translation for job {job.id}")
        
        translation_output_dir = Path(settings.MEDIA_ROOT) / 'translations' /'temp' / str(job.id) / 'translated'
        translation_output_dir.mkdir(parents=True, exist_ok=True)
        
        def on_complete(translated_paths):
            """Callback when translation completes"""
            try:
                logger.info(f"Translation completed for job {job.id}: {len(translated_paths)} pages")
                
                # Store translated images data
                translated_images_data = []
                for idx, img_path in enumerate(translated_paths, 1):
                    translated_images_data.append({
                        'page_number': idx,
                        'local_path': str(img_path),
                        'filename': os.path.basename(img_path)
                    })
                
                job.translation_results = translated_images_data
                job.translated_pages = len(translated_paths)
                
                # Create CBZ file
                job.status = 'creating_cbz'
                job.save()
                
                cbz_output_dir = Path(settings.MEDIA_ROOT) / 'translated_cbz'
                cbz_path = CBZService.create_cbz_from_local_files(
                    translated_paths,
                    cbz_output_dir,
                    str(job.id)
                )
                
                job.output_file_path = cbz_path
                job.status = 'completed'
                job.completed_at = timezone.now()
                job.save()
                
                logger.info(f"Job {job.id} completed successfully")
                
            except Exception as e:
                logger.error(f"Error in completion callback for job {job.id}: {e}")
                job.status = 'failed'
                job.error_message = str(e)
                job.save()
                
                # Refund points on failure (only if they were deducted)
                if points_deducted:
                    try:
                        user = job.user
                        if hasattr(user, 'points'):
                            user.points += TRANSLATION_COST
                            user.save()
                            logger.info(f"♻️ Refunded {TRANSLATION_COST} points to user {user.username}")
                    except Exception as refund_error:
                        logger.error(f"Failed to refund points: {refund_error}")
        
        def on_error(error_msg):
            """Callback when translation fails"""
            logger.error(f"Translation failed for job {job.id}: {error_msg}")
            job.status = 'failed'
            job.error_message = error_msg
            job.save()
            
            # Refund points on error (only if they were deducted)
            if points_deducted:
                try:
                    user = job.user
                    if hasattr(user, 'points'):
                        user.points += TRANSLATION_COST
                        user.save()
                        logger.info(f"♻️ Refunded {TRANSLATION_COST} points to user {user.username}")
                except Exception as refund_error:
                    logger.error(f"Failed to refund points: {refund_error}")
        
        # Start async translation
        CustomTranslator.translate_chapter_async(
            job.temp_upload_path,
            str(translation_output_dir),
            on_complete=on_complete,
            on_error=on_error
        )
        
        # Return immediately
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_pages': job.total_pages,
            'points_deducted': TRANSLATION_COST,
            'remaining_points': current_balance,
            'message': f'بدأت عملية الترجمة. تم خصم {TRANSLATION_COST} نقطة. يمكنك التحقق من التقدم باستخدام job_id'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error starting translation job {job.id}: {str(e)}")
        job.status = 'failed'
        job.error_message = str(e)
        job.save()
        
        # Refund points on error (only if they were deducted)
        if points_deducted:
            try:
                user = job.user
                if hasattr(user, 'points'):
                    user.points += TRANSLATION_COST
                    user.save()
                    logger.info(f"♻️ Refunded {TRANSLATION_COST} points to user {user.username}")
            except Exception as refund_error:
                logger.error(f"Failed to refund points: {refund_error}")
        
        return Response({
            'error': f'فشل في بدء الترجمة: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_translation_status(request, job_id):
    """
    الحصول على حالة الترجمة والتقدم
    
    GET /api/translate/status/<job_id>/
    
    Response:
        - job_id
        - status
        - total_pages
        - translated_pages
        - error_message (if any)
    """
    
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only job owner can view
        if job.user != request.user and not request.user.is_staff:
            return Response({
                'error': 'غير مصرح'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_pages': job.total_pages,
            'translated_pages': job.translated_pages,
            'error_message': job.error_message,
            'original_filename': job.original_filename,
            'created_at': job.created_at.isoformat(),
            'completed_at': job.completed_at.isoformat() if job.completed_at else None
        })
        
    except TranslationJob.DoesNotExist:
        return Response({
            'error': 'المهمة غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_translation_preview(request, job_id):
    """
    الحصول على معلومات المعاينة
    
    GET /api/translate/preview/<job_id>/
    """
    
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only job owner can view
        if job.user != request.user and not request.user.is_staff:
            return Response({
                'error': 'غير مصرح'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Build image URLs
        original_images = []
        for img_data in job.original_images_paths:
            original_images.append({
                'page_number': img_data['page_number'],
                'url': f"/api/translate/preview/{job_id}/image/original/{img_data['page_number']}/",
                'filename': img_data['filename']
            })
        
        translated_images = []
        for img_data in job.translation_results:
            translated_images.append({
                'page_number': img_data['page_number'],
                'url': f"/api/translate/preview/{job_id}/image/translated/{img_data['page_number']}/",
                'filename': img_data['filename']
            })
        
        return Response({
            'job_id': str(job.id),
            'original_images': original_images,
            'translated_images': translated_images,
            'total_pages': job.total_pages,
            'status': job.status
        })
        
    except TranslationJob.DoesNotExist:
        return Response({
            'error': 'المهمة غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_preview_image(request, job_id, image_type, page_number):
    """
    تقديم صورة من المعاينة
    
    GET /api/translate/preview/<job_id>/image/<original|translated>/<page_number>/
    """
    
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only job owner can view
        if job.user != request.user and not request.user.is_staff:
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_translated_cbz(request, job_id):
    """
    تنزيل ملف CBZ المترجم
    
    GET /api/translate/download/<job_id>/
    """
    
    try:
        job = TranslationJob.objects.get(id=job_id)
        
        # Only job owner can download
        if job.user != request.user and not request.user.is_staff:
            return Response({
                'error': 'غير مصرح'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if job.status != 'completed':
            return Response({
                'error': f'الملف غير جاهز بعد. الحالة: {job.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not job.output_file_path or not os.path.exists(job.output_file_path):
            return Response({
                'error': 'الملف المترجم غير موجود'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Serve file
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
        return Response({
            'error': 'المهمة غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)
