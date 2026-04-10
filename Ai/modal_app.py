"""
Modal.com Deployment for MangaTK AI Translation Pipeline
==========================================================

Deploys the 5-model manga translation pipeline on Modal's GPU infrastructure.
Models are pre-downloaded into the image at build time for fast cold starts.

Usage:
    # Deploy (creates a persistent web endpoint):
    modal deploy modal_app.py

    # Test locally:
    modal run modal_app.py

    # Test the endpoint:
    curl -X POST https://YOUR_USERNAME--mangatk-translation-translate-page.modal.run \
        -F "image=@test_page.jpg" \
        -F "source_lang=ja" \
        -F "target_lang=ar" \
        --output translated.png
"""

import modal
import io
import os

# ============================================================
# 1. Define the container image with all dependencies
# ============================================================

def download_models():
    """Pre-download all models at image build time (cached in the image)."""
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

    # --- Translation Model (Seq2Seq from HuggingFace) ---
    print("📥 Downloading translation model...")
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    model_id = "Bart2277/JPtoAR_transaltion_model_for_comics"
    AutoTokenizer.from_pretrained(model_id)
    AutoModelForSeq2SeqLM.from_pretrained(model_id)
    print("✅ Translation model cached.")

    # --- Sentiment Model (BERT from HuggingFace) ---
    print("📥 Downloading sentiment model...")
    from transformers import pipeline as hf_pipeline
    device = 0 if torch.cuda.is_available() else -1
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


# Build the image
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "libgl1-mesa-glx",  # OpenCV dependency
        "libglib2.0-0",     # OpenCV dependency
        "libfribidi-dev",   # Arabic text shaping (for Pillow)
        "libraqm-dev",      # Complex text layout (for Pillow RTL)
        "wget",
    )
    .pip_install(
        "torch",
        "torchvision",
        "ultralytics",
        "manga-ocr",
        "easyocr",
        "simple-lama-inpainting",
        "transformers",
        "sentencepiece",
        "opencv-python-headless",
        "numpy",
        "huggingface_hub",
        "Pillow",
        "fastapi[standard]",
        "python-multipart",  # For file uploads in FastAPI
    )
    .run_function(download_models)
)

app = modal.App("mangatk-translation", image=image)

# ============================================================
# 2. Translation Pipeline Class (runs on GPU)
# ============================================================

@app.cls(gpu="T4", timeout=600, container_idle_timeout=120)
class TranslationPipeline:
    """
    Manga translation pipeline running on Modal GPU.
    Models are loaded once when the container starts.
    """

    @modal.enter()
    def load_models(self):
        """Called once when the container starts — load all models into GPU."""
        import torch
        import re
        import cv2
        from PIL import Image
        from ultralytics import YOLO
        from manga_ocr import MangaOcr
        import easyocr
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline as hf_pipeline

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        pt_device = 0 if torch.cuda.is_available() else -1
        print(f"🚀 Loading models on {self.device.upper()}...")

        # 1. Bubble Detector
        print("  Loading YOLO bubble detector...")
        from huggingface_hub import hf_hub_download, list_repo_files
        repo_id = "Bart2277/comic-detector"
        files = list_repo_files(repo_id)
        pt_files = [f for f in files if f.endswith('.pt')]
        weights_path = hf_hub_download(repo_id=repo_id, filename=pt_files[0])
        self.yolo_model = YOLO(weights_path)

        # 2. OCR
        print("  Loading OCR models...")
        self.manga_ocr = MangaOcr()
        self.easyocr_reader = easyocr.Reader(['ja', 'en'], gpu=torch.cuda.is_available())

        # 3. Sentiment
        print("  Loading sentiment model...")
        self.sentiment_analyzer = hf_pipeline(
            "sentiment-analysis",
            model="Bart2277/sentment_analysis_model_for_comics",
            device=pt_device
        )

        # 4. Translator
        print("  Loading translation model...")
        model_id = "Bart2277/JPtoAR_transaltion_model_for_comics"
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        self.translation_model = AutoModelForSeq2SeqLM.from_pretrained(model_id).to(self.device)

        # 5. LaMa Inpainter
        print("  Loading LaMa inpainter...")
        self.lama = None
        try:
            from simple_lama_inpainting import SimpleLama
            self.lama = SimpleLama()
        except Exception as e:
            print(f"  ⚠️ LaMa failed: {e}. Using CV fallback.")

        # Font paths
        self.fonts_dir = "/root/fonts"
        self.fonts_ar = {
            "neutral": f"{self.fonts_dir}/NotoNaskhArabic-Regular.ttf",
            "positive": f"{self.fonts_dir}/Lalezar-Regular.ttf",
            "negative": f"{self.fonts_dir}/ArefRuqaa-Regular.ttf",
        }
        self.font_en = f"{self.fonts_dir}/DejaVuSans.ttf"

        # Store modules for later use
        self._torch = torch
        self._cv2 = cv2
        self._re = re
        self._np = __import__('numpy')

        print("✅ All models loaded and ready!")

    # --------------------------------------------------------
    # Helper Methods (ported from Colab pipeline)
    # --------------------------------------------------------

    def _is_valid_source_text(self, text, source_lang):
        if not text or len(text.strip()) == 0:
            return False
        if source_lang == "ja":
            clean = self._re.sub(r'[^\w\s]', '', text).replace(" ", "")
            if len(clean) == 0:
                return False
            jp = self._re.findall(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', text)
            if len(clean) <= 2 and len(jp) > 0:
                return True
            return len(jp) / len(clean) > 0.3
        elif source_lang == "en":
            return len(self._re.findall(r'[a-zA-Z]', text)) > 0
        return True

    def _translate(self, text):
        try:
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True).to(self.device)
            with self._torch.no_grad():
                tokens = self.translation_model.generate(**inputs)
            return self.tokenizer.decode(tokens[0], skip_special_tokens=True)
        except Exception as e:
            return "[Translation Error]"

    def _get_sentiment(self, text):
        try:
            result = self.sentiment_analyzer(text[:512])[0]
            return result['label'].lower()
        except Exception:
            return "neutral"

    def _inpaint(self, image_pil, mask):
        """Try LaMa, fallback to CV color fill."""
        np = self._np
        cv2 = self._cv2
        from PIL import Image

        if not np.any(mask):
            return image_pil.copy()

        # Dilate mask
        kernel = np.ones((7, 7), np.uint8)
        dilated = cv2.dilate(mask, kernel, iterations=1)

        if self.lama:
            try:
                mask_pil = Image.fromarray(dilated)
                return self.lama(image_pil, mask_pil)
            except Exception:
                pass

        # CV Fallback: simple color fill
        img_cv = np.array(image_pil)
        median_color = np.median(img_cv[dilated == 0], axis=0).astype(np.uint8)
        img_cv[dilated == 255] = median_color
        return Image.fromarray(img_cv)

    def _render_text(self, cleaned_img, boxes, translations, sentiments, language="ar"):
        """Render translated text with sentiment-based fonts/colors."""
        np = self._np
        cv2 = self._cv2
        from PIL import Image, ImageDraw, ImageFont

        result = cleaned_img.copy().convert("RGBA")
        overlay = Image.new("RGBA", result.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)
        cleaned_cv = np.array(cleaned_img.convert("L"))
        direction = 'rtl' if language == 'ar' else 'ltr'

        for i, box in enumerate(boxes):
            if i not in translations:
                continue

            x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
            box_w, box_h = x2 - x1, y2 - y1
            target_text = translations[i]
            sentiment = sentiments.get(i, "neutral")

            font_path = self.fonts_ar.get(sentiment, self.fonts_ar["neutral"]) if language == "ar" else self.font_en

            # Detect bubble brightness
            crop = cleaned_cv[max(0, y1):min(cleaned_cv.shape[0], y2), max(0, x1):min(cleaned_cv.shape[1], x2)]
            brightness = np.median(crop) if crop.size > 0 else 255

            if brightness < 127:
                text_color = (255, 150, 150, 255) if sentiment == "negative" else (255, 255, 255, 255)
                outline_color = (0, 0, 0, 255)
            else:
                text_color = (139, 0, 0, 255) if sentiment == "negative" else (15, 15, 15, 255)
                outline_color = (255, 255, 255, 255)

            # Fit text
            safe_w, safe_h = int(box_w * 0.65), int(box_h * 0.70)
            start_size = min(int(box_w * 0.25), int(box_h * 0.25), 36)

            font = None
            lines = [target_text]
            line_spacing = 3

            for size in range(start_size, 11, -1):
                try:
                    f = ImageFont.truetype(font_path, size)
                except Exception:
                    f = ImageFont.load_default()

                words = target_text.split()
                test_lines, current = [], []
                for word in words:
                    test = " ".join(current + [word])
                    bb = draw.textbbox((0, 0), test, font=f, direction=direction, language=language)
                    if bb[2] - bb[0] <= safe_w:
                        current.append(word)
                    else:
                        if current:
                            test_lines.append(" ".join(current))
                        current = [word]
                if current:
                    test_lines.append(" ".join(current))
                if not test_lines:
                    test_lines = [target_text]

                ls = int(size * 0.25)
                total_h = sum(
                    (draw.textbbox((0, 0), l, font=f, direction=direction, language=language)[3] -
                     draw.textbbox((0, 0), l, font=f, direction=direction, language=language)[1]) + ls
                    for l in test_lines
                )
                max_w = max(
                    draw.textbbox((0, 0), l, font=f, direction=direction, language=language)[2] -
                    draw.textbbox((0, 0), l, font=f, direction=direction, language=language)[0]
                    for l in test_lines
                )

                if total_h <= safe_h and max_w <= safe_w:
                    font, lines, line_spacing = f, test_lines, ls
                    break

            if font is None:
                try:
                    font = ImageFont.truetype(font_path, 12)
                except Exception:
                    font = ImageFont.load_default()

            # Calculate positions
            line_heights = []
            for line in lines:
                bb = draw.textbbox((0, 0), line, font=font, direction=direction, language=language)
                line_heights.append((bb[3] - bb[1]) + line_spacing)
            if line_heights:
                line_heights[-1] -= line_spacing

            total_h = sum(line_heights)
            cur_y = y1 + max(0, (box_h - total_h) // 2)

            for line, lh in zip(lines, line_heights):
                bb = draw.textbbox((0, 0), line, font=font, direction=direction, language=language)
                cur_x = x1 + max(0, (box_w - (bb[2] - bb[0])) // 2)

                for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1), (0, -1), (0, 1), (-1, 0), (1, 0)]:
                    draw.text((cur_x + dx, cur_y + dy), line, font=font, fill=outline_color, direction=direction, language=language)
                draw.text((cur_x, cur_y), line, font=font, fill=text_color, direction=direction, language=language)
                cur_y += lh + line_spacing

        return Image.alpha_composite(result, overlay).convert("RGB")

    # --------------------------------------------------------
    # Main Translation Method
    # --------------------------------------------------------

    @modal.method()
    def translate_page(self, image_bytes: bytes, source_lang: str = "ja", target_lang: str = "ar") -> bytes:
        """
        Translate a single manga page.

        Args:
            image_bytes: Raw image bytes (jpg/png).
            source_lang: Source language code.
            target_lang: Target language code.

        Returns:
            Translated image as PNG bytes.
        """
        np = self._np
        cv2 = self._cv2
        from PIL import Image

        CROP_PADDING = 4

        # Load image
        image_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_cv = np.array(image_pil)

        # Step 1: Detect bubbles
        results = self.yolo_model(img_cv, conf=0.25, verbose=False)
        boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)

        if len(boxes) == 0:
            # No bubbles — return original
            buf = io.BytesIO()
            image_pil.save(buf, format="PNG")
            return buf.getvalue()

        # Step 2-4: OCR → Sentiment → Translate for each bubble
        translations = {}
        sentiments = {}
        global_mask = np.zeros(img_cv.shape[:2], dtype=np.uint8)

        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = box
            px1, py1 = max(0, x1 - CROP_PADDING), max(0, y1 - CROP_PADDING)
            px2, py2 = min(img_cv.shape[1], x2 + CROP_PADDING), min(img_cv.shape[0], y2 + CROP_PADDING)

            bubble_crop = img_cv[py1:py2, px1:px2]
            if bubble_crop.shape[0] < 20 or bubble_crop.shape[1] < 20:
                continue

            # OCR
            if source_lang == "ja":
                roi_pil = Image.fromarray(bubble_crop)
                source_text = self.manga_ocr(roi_pil)
            else:
                detections = self.easyocr_reader.readtext(bubble_crop)
                source_text = " ".join([t[1] for t in detections])

            if not self._is_valid_source_text(source_text, source_lang):
                continue

            # Translate
            target_text = self._translate(source_text)
            if "[Translation Error]" in target_text:
                continue

            translations[i] = target_text
            sentiments[i] = self._get_sentiment(target_text)

            # Build mask for inpainting
            text_detections = self.easyocr_reader.readtext(bubble_crop, paragraph=True, link_threshold=0.3, low_text=0.3)
            for (bbox_pts, _text) in text_detections:
                pts = np.array(bbox_pts, dtype=np.int32)
                pts[:, 0] += px1
                pts[:, 1] += py1
                cv2.fillPoly(global_mask, [pts], 255)
                cx, cy = int(np.mean(pts[:, 0])), int(np.mean(pts[:, 1]))
                try:
                    cv2.floodFill(global_mask, None, (cx, cy), 255, loDiff=10, upDiff=10, flags=cv2.FLOODFILL_FIXED_RANGE)
                except Exception:
                    pass

        # Step 5: Inpaint
        cleaned = self._inpaint(image_pil, global_mask)

        # Step 6: Render translated text
        final = self._render_text(cleaned, boxes, translations, sentiments, target_lang)

        # Return as PNG bytes
        buf = io.BytesIO()
        final.save(buf, format="PNG")
        return buf.getvalue()

    @modal.method()
    def translate_chapter(self, images_bytes: list[bytes], source_lang: str = "ja", target_lang: str = "ar") -> list[bytes]:
        """
        Translate multiple pages (a full chapter).

        Args:
            images_bytes: List of raw image bytes.
            source_lang: Source language code.
            target_lang: Target language code.

        Returns:
            List of translated image bytes (PNG).
        """
        results = []
        total = len(images_bytes)
        for idx, img_bytes in enumerate(images_bytes, 1):
            print(f"  Translating page {idx}/{total}...")
            translated = self.translate_page.local(img_bytes, source_lang, target_lang)
            results.append(translated)
        return results

    # --------------------------------------------------------
    # Web Endpoints
    # --------------------------------------------------------

    @modal.fastapi_endpoint(method="POST")
    async def translate(self, request: modal.web._asgi.Request):
        """
        HTTP endpoint for translating a single manga page.

        POST /translate
        Content-Type: multipart/form-data

        Fields:
            - image: Image file (jpg/png/webp)
            - source_lang: Source language (default: 'ja')
            - target_lang: Target language (default: 'ar')

        Returns:
            Translated image as PNG.
        """
        from fastapi.responses import Response as FastAPIResponse
        form = await request.form()

        image_file = form.get("image")
        source_lang = form.get("source_lang", "ja")
        target_lang = form.get("target_lang", "ar")

        if not image_file:
            return FastAPIResponse(content='{"error": "No image provided"}', status_code=400, media_type="application/json")

        image_bytes = await image_file.read()

        translated_bytes = self.translate_page.local(image_bytes, source_lang, target_lang)

        return FastAPIResponse(content=translated_bytes, media_type="image/png")

    @modal.fastapi_endpoint(method="GET")
    async def health(self):
        """Health check endpoint."""
        return {
            "status": "ready",
            "models": ["comic-detector", "manga-ocr", "easyocr", "sentiment", "translator", "lama"],
            "device": self.device,
            "lama_available": self.lama is not None,
        }


# ============================================================
# 3. Local test entry point
# ============================================================

@app.local_entrypoint()
def main():
    """Test the pipeline with a sample image."""
    import sys

    pipeline = TranslationPipeline()

    # Health check
    health = pipeline.health.remote()
    print(f"Health: {health}")

    # Test with an image if provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        print(f"Translating {image_path}...")
        result = pipeline.translate_page.remote(image_bytes)

        output_path = f"translated_{os.path.basename(image_path)}"
        with open(output_path, "wb") as f:
            f.write(result)
        print(f"✅ Saved to {output_path}")
    else:
        print("Pass an image path to test translation: modal run modal_app.py -- test_page.jpg")
