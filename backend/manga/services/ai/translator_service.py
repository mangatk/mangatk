"""
Translator Service
===================
Translates text using a Seq2Seq model (AutoModelForSeq2SeqLM).

Model source (checked in order):
  1. Local weights in 'weights/translation_model/'
  2. HuggingFace model ID from Django settings (AI_TRANSLATION_PIPELINE.TRANSLATION_MODEL)

HuggingFace models are auto-downloaded and cached by transformers.
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

WEIGHTS_DIR = Path(__file__).parent / 'weights'
LOCAL_MODEL_PATH = WEIGHTS_DIR / 'translation_model'


def _resolve_model_path() -> str:
    """Resolve model path: local weights first, then settings, then error."""
    # 1. Local weights directory
    if LOCAL_MODEL_PATH.exists() and any(LOCAL_MODEL_PATH.iterdir()):
        logger.info(f"Using local translation model: {LOCAL_MODEL_PATH}")
        return str(LOCAL_MODEL_PATH)

    # 2. HuggingFace ID from Django settings
    try:
        from django.conf import settings
        hf_model = getattr(settings, 'AI_TRANSLATION_PIPELINE', {}).get('TRANSLATION_MODEL', '')
        if hf_model:
            logger.info(f"Using HuggingFace translation model: {hf_model}")
            return hf_model
    except Exception:
        pass

    raise FileNotFoundError(
        "Translation model not configured. Either:\n"
        f"  1. Place model files in {LOCAL_MODEL_PATH}/\n"
        "  2. Set AI_TRANSLATION_MODEL in .env (e.g. 'Helsinki-NLP/opus-mt-ja-ar')\n"
        "  3. Set AI_TRANSLATION_PIPELINE.TRANSLATION_MODEL in settings.py"
    )


class TranslatorService:
    """Translates text using a Seq2Seq model (local or HuggingFace)."""

    _instance: Optional['TranslatorService'] = None

    def __init__(self):
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        model_path = _resolve_model_path()

        logger.info(f"Loading translation model: {model_path}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_path).to(self.device)
        logger.info(f"✅ Translation model loaded on {self.device.upper()}.")

    @classmethod
    def get_instance(cls) -> 'TranslatorService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def translate(self, text: str) -> str:
        """
        Translate source text to target language.

        Args:
            text: Source language text.

        Returns:
            Translated text string, or '[Translation Error]' on failure.
        """
        import torch

        try:
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                padding=True,
                truncation=True
            ).to(self.device)

            with torch.no_grad():
                translated_tokens = self.model.generate(**inputs)

            translated_text = self.tokenizer.decode(
                translated_tokens[0],
                skip_special_tokens=True
            )
            return translated_text

        except Exception as e:
            logger.error(f"Translation error: {e}")
            return "[Translation Error]"

