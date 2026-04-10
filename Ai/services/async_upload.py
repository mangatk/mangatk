"""
Async Upload Service using Threading
====================================

يوفر خدمة رفع غير متزامنة للصور إلى ImgBB باستخدام Python threading
"""

import threading
import queue
from typing import Callable, Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

logger = logging.getLogger(__name__)


class AsyncUploadService:
    """
    خدمة رفع غير متزامنة مع تتبع التقدم
    
    Features:
    - Multi-threaded image uploads
    - Real-time progress tracking
    - Error handling per image
    - Cancellable operations
    """
    
    def __init__(self, max_workers: int = 5):
        """
        Args:
            max_workers: Maximum number of concurrent uploads
        """
        self.max_workers = max_workers
        self.active_jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
    
    def upload_images_async(
        self,
        job_id: str,
        images: list,
        upload_function: Callable,
        on_progress: Optional[Callable] = None,
        on_complete: Optional[Callable] = None,
        on_error: Optional[Callable] = None
    ):
        """
        رفع مجموعة من الصور بشكل غير متزامن
        
        Args:
            job_id: معرف فريد للعملية
            images: قائمة الصور للرفع
            upload_function: دالة الرفع (تأخذ صورة وتعيد النتيجة)
            on_progress: callback للتقدم (current, total, result)
            on_complete: callback عند الانتهاء (results)
            on_error: callback عند الخطأ (error)
        """
        # Initialize job tracking
        with self._lock:
            self.active_jobs[job_id] = {
                'total': len(images),
                'completed': 0,
                'failed': 0,
                'results': [],
                'errors': [],
                'cancelled': False
            }
        
        def worker_thread():
            try:
                logger.info(f"Worker thread started for job {job_id}")
                results = []
                
                with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                    # Submit all upload tasks
                    future_to_image = {
                        executor.submit(upload_function, img): img 
                        for img in images
                    }
                    
                    # Process completed uploads as they finish
                    for future in as_completed(future_to_image):
                        # Check if cancelled
                        with self._lock:
                            if self.active_jobs[job_id]['cancelled']:
                                logger.info(f"Job {job_id} cancelled")
                                if on_error:
                                    on_error({'error': 'تم إلغاء العملية'})
                                return
                        
                        image = future_to_image[future]
                        
                        try:
                            # Get upload result
                            result = future.result()
                            results.append(result)
                            
                            # Update progress
                            with self._lock:
                                self.active_jobs[job_id]['completed'] += 1
                                self.active_jobs[job_id]['results'].append(result)
                            
                            # Call progress callback
                            if on_progress:
                                current = self.active_jobs[job_id]['completed']
                                total = self.active_jobs[job_id]['total']
                                on_progress(current, total, result)
                            
                            logger.info(f"Image uploaded successfully: {result.get('url', 'unknown')}")
                            
                        except Exception as e:
                            # Handle upload error
                            error_info = {
                                'image': image,
                                'error': str(e)
                            }
                            
                            with self._lock:
                                self.active_jobs[job_id]['failed'] += 1
                                self.active_jobs[job_id]['errors'].append(error_info)
                            
                            logger.error(f"Failed to upload image: {e}")
                
                # All uploads completed
                with self._lock:
                    job_data = self.active_jobs[job_id]
                
                if on_complete:
                    on_complete({
                        'total': job_data['total'],
                        'completed': job_data['completed'],
                        'failed': job_data['failed'],
                        'results': job_data['results'],
                        'errors': job_data['errors']
                    })
                
                logger.info(f"Job {job_id} completed: {job_data['completed']}/{job_data['total']} successful")
                
            except Exception as e:
                logger.error(f"Worker thread error for job {job_id}: {e}")
                if on_error:
                    on_error({'error': str(e)})
            finally:
                # Cleanup job
                with self._lock:
                    if job_id in self.active_jobs:
                        del self.active_jobs[job_id]
        
        # Start worker thread
        thread = threading.Thread(target=worker_thread, daemon=True)
        thread.start()
        
        return job_id
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """الحصول على حالة عملية الرفع"""
        with self._lock:
            return self.active_jobs.get(job_id, None)
    
    def cancel_job(self, job_id: str) -> bool:
        """إلغاء عملية رفع"""
        with self._lock:
            if job_id in self.active_jobs:
                self.active_jobs[job_id]['cancelled'] = True
                return True
            return False
    
    def get_active_jobs(self) -> list:
        """الحصول على قائمة العمليات النشطة"""
        with self._lock:
            return list(self.active_jobs.keys())


# Global instance
async_upload_service = AsyncUploadService(max_workers=5)
