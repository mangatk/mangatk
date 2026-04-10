"""
Bubble Detector Service
========================
Detects speech bubbles in manga/comic pages using YOLOv8.

Model source (checked in order):
  1. Local weights in 'weights/comic_bubble_yolov8.pt'
  2. HuggingFace repo from Django settings (AI_TRANSLATION_PIPELINE.BUBBLE_DETECTOR_MODEL)
  3. Default: Bart2277/comic-detector on HuggingFace
"""

import numpy as np
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

WEIGHTS_DIR = Path(__file__).parent / 'weights'
LOCAL_WEIGHTS_PATH = WEIGHTS_DIR / 'comic_bubble_yolov8.pt'

DEFAULT_HF_REPO = "Bart2277/comic-detector"


def _resolve_weights_path() -> str:
    """Resolve YOLO weights: local file → settings → HuggingFace download."""
    # 1. Local weights file
    if LOCAL_WEIGHTS_PATH.exists():
        logger.info(f"Using local YOLO weights: {LOCAL_WEIGHTS_PATH}")
        return str(LOCAL_WEIGHTS_PATH)

    # 2. HuggingFace repo from Django settings
    hf_repo = DEFAULT_HF_REPO
    try:
        from django.conf import settings
        configured = getattr(settings, 'AI_TRANSLATION_PIPELINE', {}).get('BUBBLE_DETECTOR_MODEL', '')
        if configured:
            hf_repo = configured
    except Exception:
        pass

    # Download .pt file from HuggingFace
    logger.info(f"Downloading YOLO weights from HuggingFace: {hf_repo}...")
    try:
        from huggingface_hub import hf_hub_download
        weights_path = hf_hub_download(
            repo_id=hf_repo,
            filename="comic_bubble_yolov8.pt",
            cache_dir=str(WEIGHTS_DIR / '.hf_cache')
        )
        logger.info(f"✅ Downloaded YOLO weights to cache.")
        return weights_path
    except Exception as e:
        # Try alternate filename patterns
        try:
            from huggingface_hub import hf_hub_download
            # List files and find .pt file
            from huggingface_hub import list_repo_files
            files = list_repo_files(hf_repo)
            pt_files = [f for f in files if f.endswith('.pt')]
            if pt_files:
                weights_path = hf_hub_download(
                    repo_id=hf_repo,
                    filename=pt_files[0],
                    cache_dir=str(WEIGHTS_DIR / '.hf_cache')
                )
                logger.info(f"✅ Downloaded YOLO weights ({pt_files[0]}) to cache.")
                return weights_path
        except Exception:
            pass

        raise FileNotFoundError(
            f"Could not load YOLO weights. Tried:\n"
            f"  1. Local: {LOCAL_WEIGHTS_PATH}\n"
            f"  2. HuggingFace: {hf_repo}\n"
            f"Error: {e}"
        )


class BubbleDetector:
    """Detects speech bubbles in manga pages using YOLOv8."""

    _instance: Optional['BubbleDetector'] = None

    def __init__(self):
        from ultralytics import YOLO

        weights_path = _resolve_weights_path()
        logger.info(f"Loading YOLOv8 model: {weights_path}...")
        self.model = YOLO(weights_path)
        logger.info("✅ YOLOv8 bubble detector loaded.")

    @classmethod
    def get_instance(cls) -> 'BubbleDetector':
        """Lazy singleton — model loaded on first call."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def detect(self, image: np.ndarray, confidence: float = 0.25) -> np.ndarray:
        """
        Detect speech bubbles in a manga page.

        Args:
            image: BGR or RGB numpy array of the page.
            confidence: Minimum detection confidence.

        Returns:
            np.ndarray of shape (N, 4) with bounding boxes in xyxy format (int).
            Returns empty array if no bubbles found.
        """
        results = self.model(image, conf=confidence, verbose=False)
        boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
        logger.info(f"Detected {len(boxes)} bubbles (conf>={confidence})")
        return boxes

