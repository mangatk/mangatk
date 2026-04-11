"""
Modal Initialization - Model Downloader
=======================================
This script is responsible for downloading and caching all AI models 
required for the MangaTK translation pipeline onto the Modal.com image.

This is separated to allow for a one-time setup/caching process.
"""

import os
import io

TRANSLATION_MODEL_ID = os.environ.get(
    "TRANSLATION_MODEL_ID",
    "Helsinki-NLP/opus-mt-ja-ar"
)

def download_models():
    """Pre-download all models at image build time (cached in the image)."""
    # --- DEBUG: Verify dependencies ---
    try:
        import sentencepiece
        import transformers
        print(f"DEBUG: sentencepiece version: {getattr(sentencepiece, '__version__', 'unknown')}")
        print(f"DEBUG: transformers version: {transformers.__version__}")
        transformers.utils.logging.set_verbosity_info()
    except Exception as e:
        print(f"❌ DEBUG ERROR during import check!")
        import traceback
        traceback.print_exc()

    import torch

    # --- Bubble Detector (YOLO weights from HuggingFace) ---
    print("📥 Downloading YOLO bubble detector...")
    from huggingface_hub import hf_hub_download, list_repo_files
    repo_id = "Bart2277/comic-detector"
    files = list_repo_files(repo_id)
    pt_files = [f for f in files if f.endswith('.pt')]
    if pt_files:
        hf_hub_download(repo_id=repo_id, filename=pt_files[0])
        print(f"✅ Downloaded: {pt_files[0]}")
    else:
        print(f"⚠️ No .pt files found in {repo_id}, files: {files}")

    # # --- Translation Model (Seq2Seq from HuggingFace) ---
    # print("📥 Downloading translation model...")
    # from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    # model_id = "Bart2277/JPtoAR_transaltion_model_for_comics"
    # AutoTokenizer.from_pretrained(model_id, use_fast=False)
    # AutoModelForSeq2SeqLM.from_pretrained(model_id)
    # print("✅ Translation model cached.")

    # --- Translation Model (Seq2Seq from HuggingFace) ---
    print("📥 Downloading translation model...")
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

    AutoTokenizer.from_pretrained(TRANSLATION_MODEL_ID, use_fast=False)
    AutoModelForSeq2SeqLM.from_pretrained(TRANSLATION_MODEL_ID)

    print(f"✅ Translation model cached: {TRANSLATION_MODEL_ID}")

    # --- Sentiment Model (BERT from HuggingFace) ---
    print("📥 Downloading sentiment model...")
    from transformers import pipeline as hf_pipeline
    hf_pipeline("sentiment-analysis", model="Bart2277/sentment_analysis_model_for_comics", device=-1)
    print("✅ Sentiment model cached.")

    # --- OCR Models ---
    print("📥 Downloading manga-ocr model...")
    from manga_ocr import MangaOcr
    MangaOcr()
    print("✅ Manga-OCR cached.")

    print("📥 Downloading EasyOCR models...")
    import easyocr
    easyocr.Reader(['ja', 'en'], gpu=False)
    print("✅ EasyOCR cached.")

    # --- LaMa Inpainting ---
    print("📥 Downloading LaMa inpainting model...")
    try:
        from simple_lama_inpainting import SimpleLama
        SimpleLama()
        print("✅ LaMa model cached.")
    except Exception as e:
        print(f"⚠️ LaMa download failed (fallback will be used): {e}")

    # --- Fonts ---
    print("📥 Downloading Arabic fonts...")
    import urllib.request
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    fonts_dir = "/root/fonts"
    os.makedirs(fonts_dir, exist_ok=True)
    font_urls = {
        "NotoNaskhArabic-Regular.ttf": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Regular.ttf",
        "Lalezar-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/lalezar/Lalezar-Regular.ttf",
        "ArefRuqaa-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/arefruqaa/ArefRuqaa-Regular.ttf",
        "DejaVuSans.ttf": "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf",
    }
    for name, url in font_urls.items():
        try:
            urllib.request.urlretrieve(url, f"{fonts_dir}/{name}")
            print(f"  ✅ {name}")
        except Exception as e:
            print(f"  ⚠️ Failed: {name}: {e}")

    print("\n🎉 All models downloaded and cached!")

if __name__ == "__main__":
    download_models()
