import os
import shutil
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from manga.models import TranslationJob
from pathlib import Path

class Command(BaseCommand):
    help = 'Cleans up translation jobs and files older than 7 days'

    def handle(self, *args, **options):
        # Calculate the threshold (7 days ago)
        threshold = timezone.now() - timezone.timedelta(days=7)
        
        # Find jobs older than threshold that aren't already cleaned up
        old_jobs = TranslationJob.objects.filter(
            created_at__lt=threshold
        ).exclude(status='cleaned')

        self.stdout.write(f"Found {old_jobs.count()} old translation jobs to clean up.")

        count = 0
        for job in old_jobs:
            try:
                # 1. Delete temporary upload file if exists
                if job.temp_upload_path and os.path.exists(job.temp_upload_path):
                    os.remove(job.temp_upload_path)
                
                # 2. Delete translated CBZ if exists
                if job.output_file_path and os.path.exists(job.output_file_path):
                    os.remove(job.output_file_path)
                
                # 3. Delete temporary translation directories
                # Path: MEDIA_ROOT / translations / temp / job_id
                temp_dir = Path(settings.MEDIA_ROOT) / 'translations' / 'temp' / str(job.id)
                if temp_dir.exists():
                    shutil.rmtree(temp_dir, ignore_errors=True)
                
                # 4. Mark job as cleaned (to keep record but not files)
                job.status = 'cleaned'
                job.original_images_paths = []
                job.translation_results = []
                job.save()
                
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Successfully cleaned job {job.id}"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error cleaning job {job.id}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Cleanup complete. {count} jobs processed."))
