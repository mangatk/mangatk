"""
ZIP File Analysis Endpoint
===========================

Endpoint for analyzing ZIP/CBZ files to extract metadata like image count
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
import zipfile
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def analyze_zip_file(request):
    """
    Analyze a ZIP/CBZ file to extract metadata
    
    POST /api/chapters/analyze-zip/
    
    Body (multipart/form-data):
        - file: ZIP/CBZ file
    
    Returns:
        - image_count: number of images in the ZIP
        - file_name: original file name
        - file_size: file size in bytes
    """
    try:
        uploaded_file = request.FILES.get('file')
        
        if not uploaded_file:
            return Response({
                'error': 'File is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate ZIP
        if not uploaded_file.name.endswith(('.zip', '.cbz')):
            return Response({
                'error': 'الملف يجب أن يكون ZIP أو CBZ'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract images from ZIP
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
        image_count = 0
        
        try:
            with zipfile.ZipFile(uploaded_file, 'r') as zip_file:
                image_files = [
                    f for f in zip_file.namelist()
                    if f.lower().endswith(image_extensions) and not f.startswith('__MACOSX')
                ]
                image_count = len(image_files)
                
        except zipfile.BadZipFile:
            return Response({
                'error': 'Invalid ZIP/CBZ file'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'image_count': image_count,
            'file_name': uploaded_file.name,
            'file_size': uploaded_file.size
        })
        
    except Exception as e:
        logger.error(f"Failed to analyze ZIP file: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
