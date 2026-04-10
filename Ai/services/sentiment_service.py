"""
Sentiment Analysis Service
============================
Analyzes the sentiment/tone of text using a BERT model.
Used to select appropriate fonts and colors for translated text.

Model source (checked in order):
  1. Local fine-tuned model in 'weights/sentiment_model/'
  2. HuggingFace model ID from Django settings (AI_TRANSLATION_PIPELINE.SENTIMENT_MODEL)
  3. Default fallback: cardiffnlp/twitter-xlm-roberta-base-sentiment
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

WEIGHTS_DIR = Path(__file__).parent / 'weights'
LOCAL_MODEL_PATH = WEIGHTS_DIR / 'sentiment_model'

FALLBACK_MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"


def _resolve_model_path() -> str:
    """Resolve model: local weights → settings → fallback."""
    # 1. Local weights directory
    if LOCAL_MODEL_PATH.exists() and any(LOCAL_MODEL_PATH.iterdir()):
        logger.info(f"Using local sentiment model: {LOCAL_MODEL_PATH}")
        return str(LOCAL_MODEL_PATH)

    # 2. HuggingFace ID from Django settings
    try:
        from django.conf import settings
        hf_model = getattr(settings, 'AI_TRANSLATION_PIPELINE', {}).get('SENTIMENT_MODEL', '')
        if hf_model:
            logger.info(f"Using HuggingFace sentiment model: {hf_model}")
            return hf_model
    except Exception:
        pass

    # 3. Default fallback
    logger.info(f"Using default sentiment model: {FALLBACK_MODEL}")
    return FALLBACK_MODEL


class SentimentService:
    """Analyzes text sentiment using a BERT model (local, HuggingFace, or default)."""

    _instance: Optional['SentimentService'] = None

    def __init__(self):
        import torch
        from transformers import pipeline as hf_pipeline

        device = 0 if torch.cuda.is_available() else -1
        model_path = _resolve_model_path()

        logger.info(f"Loading sentiment model: {model_path}...")
        self.analyzer = hf_pipeline(
            "sentiment-analysis",
            model=model_path,
            device=device
        )
        logger.info("✅ Sentiment analysis model loaded.")

    @classmethod
    def get_instance(cls) -> 'SentimentService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def analyze(self, text: str) -> str:
        """
        Analyze sentiment of text.

        Args:
            text: Input text (any language supported by the model).

        Returns:
            Sentiment label: 'positive', 'negative', or 'neutral'.
        """
        try:
            # Model has 512 token limit
            result = self.analyzer(text[:512])[0]
            label = result['label'].lower()
            return label
        except Exception as e:
            logger.warning(f"Sentiment analysis failed: {e}")
            return "neutral"

