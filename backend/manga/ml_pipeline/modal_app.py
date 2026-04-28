"""
Modal.com Deployment for MangaTK AI Translation Pipeline
==========================================================

Deploys the 5-model manga translation pipeline on Modal's GPU infrastructure.
Models are pre-downloaded into the image at build time for fast cold starts.

Deployment:
    modal deploy modal_app.py
"""

import modal
import io
import os
import typing

try:
    from fastapi import Request
    from fastapi.responses import Response as FastAPIResponse
except ImportError:
    Request = typing.Any
    FastAPIResponse = typing.Any

# Import the download logic from our init script
# Since Modal image build happens in its own environment, we include the script in the context
TRANSLATION_MODEL_ID = os.environ.get(
    "TRANSLATION_MODEL_ID",
    "Bart2277/JPtoAR_transaltion_model_for_comics",
    # "Helsinki-NLP/opus-mt-ja-ar"
)
try:
    from .modal_init import download_models
except ImportError:
    # Fallback if imported directly without package context during local runs
    def download_models():
        print("⚠️ download_models import failed. Ensure modal_init.py is present.")
        pass

# ============================================================
# 1. Define the container image with all dependencies
# ============================================================

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "libgl1-mesa-glx",  # OpenCV dependency
        "libglib2.0-0",     # OpenCV dependency
        "libfribidi-dev",   # Arabic text shaping (for Pillow)
        "libraqm-dev",      # Complex text layout (for Pillow RTL)
        "wget",
        "build-essential",
        "python3-dev",
        "cmake",
    )
    .pip_install(
        "torch",
        "torchvision",
        "ultralytics",
        "manga-ocr",
        "easyocr",
        "simple-lama-inpainting",
        "transformers[sentencepiece]>=4.40.0,<5.0.0",
        "sentencepiece",
        "protobuf<=5.29.3",
        "tiktoken",
        "opencv-python-headless",
        "numpy",
        "huggingface_hub",
        "Pillow",
        "fastapi[standard]",
        "python-multipart",
    )
    # Copy the modal_init script into the image for the build step
    .add_local_file(os.path.join(os.path.dirname(__file__), "modal_init.py"), "/root/modal_init.py", copy=True)
    .run_commands("python /root/modal_init.py")
)

app = modal.App("mangatk-translation", image=image)

# ============================================================
# 2. Translation Pipeline Class (runs on GPU)
# ============================================================

@app.cls(gpu="T4", timeout=600, scaledown_window=120)
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

        # # 4. Translator
        # print("  Loading translation model...")
        # model_id = "Bart2277/JPtoAR_transaltion_model_for_comics"
        # self.tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=False)
        # self.translation_model = AutoModelForSeq2SeqLM.from_pretrained(model_id).to(self.device)
        
        # 4. Translator
        print("  Loading translation model...")
        # self.translation_model_id = "Helsinki-NLP/opus-mt-ja-ar"
        self.translation_model_id = "Bart2277/JPtoAR_transaltion_model_for_comics"
        self.tokenizer = AutoTokenizer.from_pretrained(self.translation_model_id, use_fast=False)
        self.translation_model = AutoModelForSeq2SeqLM.from_pretrained(self.translation_model_id).to(self.device)

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

    # def _translate(self, text):
    #     try:
    #         inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True).to(self.device)
    #         with self._torch.no_grad():
    #             tokens = self.translation_model.generate(**inputs)
    #         return self.tokenizer.decode(tokens[0], skip_special_tokens=True)
    #     except Exception as e:
    #         return "[Translation Error]"

    def _translate(self, text):
        try:
            # النص الداخل هنا ياباني، والهدف هو العربية
            text = text.strip()
            if not text:
                return "[Translation Error]"

            model_input = f">>ara<< {text}"

            inputs = self.tokenizer(
                model_input,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            ).to(self.device)

            with self._torch.no_grad():
                tokens = self.translation_model.generate(
                    **inputs,
                    num_beams=5,
                    repetition_penalty=1.3,
                    no_repeat_ngram_size=3,
                    max_length=128,
                    early_stopping=True,
                    length_penalty=1.0
                )

            result = self.tokenizer.decode(tokens[0], skip_special_tokens=True).strip()
            return self._clean_translation(result)
        except Exception as e:
            print(f"Translation error: {e}")
            return "[Translation Error]"

    def _clean_translation(self, text):
        words = text.split()
        if not words: return text
        clean_words = [words[0]]
        for word in words[1:]:
            if word != clean_words[-1]:
                clean_words.append(word)
        cleaned_text = " ".join(clean_words)
        cleaned_text = self._re.sub(r'(.)\1{4,}', r'\1\1', cleaned_text)
        return cleaned_text

    def _get_sentiment(self, text):
        try:
            result = self.sentiment_analyzer(text[:512])[0]
            return result['label'].lower()
        except Exception:
            return "neutral"

    def _inpaint(self, image_pil, mask):
        np = self._np
        cv2 = self._cv2
        from PIL import Image

        if not np.any(mask):
            return image_pil.copy()

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        dilated = cv2.dilate(mask, kernel, iterations=1)
        dilated = cv2.GaussianBlur(dilated, (5, 5), 0)
        _, dilated = cv2.threshold(dilated, 127, 255, cv2.THRESH_BINARY)

        if self.lama:
            try:
                mask_pil = Image.fromarray(dilated)
                return self.lama(image_pil, mask_pil)
            except Exception:
                pass

        img_cv = np.array(image_pil)
        median_color = np.median(img_cv[dilated == 0], axis=0).astype(np.uint8)
        img_cv[dilated == 255] = median_color
        return Image.fromarray(img_cv)

    def _build_outline_offsets(self, font):
        thickness = max(1, font.size // 14)
        offsets = []
        for dx in range(-thickness, thickness + 1):
            for dy in range(-thickness, thickness + 1):
                if dx * dx + dy * dy <= thickness * thickness and (dx, dy) != (0, 0):
                    offsets.append((dx, dy))
        return offsets

    def _render_text(self, cleaned_img, boxes, translations, sentiments, language="ar"):
        import re as _re
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

            crop = cleaned_cv[max(0, y1):min(cleaned_cv.shape[0], y2), max(0, x1):min(cleaned_cv.shape[1], x2)]
            brightness = np.median(crop) if crop.size > 0 else 255

            if brightness < 127:
                text_color = (255, 150, 150, 255) if sentiment == "negative" else (255, 255, 255, 255)
                outline_color = (0, 0, 0, 255)
            else:
                text_color = (139, 0, 0, 255) if sentiment == "negative" else (15, 15, 15, 255)
                outline_color = (255, 255, 255, 255)

            safe_w, safe_h = int(box_w * 0.80), int(box_h * 0.85)
            start_size = min(int(box_w * 0.30), int(box_h * 0.30), 48)

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
                            current = []
                        word_bbox = draw.textbbox((0, 0), word, font=f, direction=direction, language=language)
                        if word_bbox[2] - word_bbox[0] > safe_w and len(word) > 1:
                            char_line = ""
                            for char in word:
                                test_char = char_line + char
                                cb = draw.textbbox((0, 0), test_char, font=f, direction=direction, language=language)
                                if cb[2] - cb[0] <= safe_w:
                                    char_line = test_char
                                else:
                                    if char_line:
                                        test_lines.append(char_line)
                                    char_line = char
                            if char_line:
                                current = [char_line]
                        else:
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
                if test_lines: total_h -= ls

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

            outline_offsets = self._build_outline_offsets(font)

            line_heights = [(draw.textbbox((0, 0), l, font=font, direction=direction, language=language)[3] - draw.textbbox((0, 0), l, font=font, direction=direction, language=language)[1]) + line_spacing for l in lines]
            if line_heights:
                line_heights[-1] -= line_spacing

            total_h = sum(line_heights)
            cur_y = y1 + max(0, (box_h - total_h) // 2)

            for line, lh in zip(lines, line_heights):
                bb = draw.textbbox((0, 0), line, font=font, direction=direction, language=language)
                cur_x = x1 + max(0, (box_w - (bb[2] - bb[0])) // 2)

                if _re.fullmatch(r'^[.:]+$', line):
                    dot_bbox = draw.textbbox((0, 0), ".", font=font, direction=direction, language=language)
                    dot_h = dot_bbox[3] - dot_bbox[1]
                    dot_w = dot_bbox[2] - dot_bbox[0]
                    total_dots = len(line)
                    total_punc_h = total_dots * dot_h + (total_dots - 1) * line_spacing // 2
                    punc_cur_y = cur_y + (lh - total_punc_h) // 2
                    for char in line:
                        char_x = cur_x + (bb[2] - bb[0] - dot_w) // 2
                        for dx, dy in outline_offsets:
                            draw.text((char_x + dx, punc_cur_y + dy), char, font=font, fill=outline_color, direction=direction, language=language)
                        draw.text((char_x, punc_cur_y), char, font=font, fill=text_color, direction=direction, language=language)
                        punc_cur_y += dot_h + line_spacing // 2
                else:
                    for dx, dy in outline_offsets:
                        draw.text((cur_x + dx, cur_y + dy), line, font=font, fill=outline_color, direction=direction, language=language)
                    draw.text((cur_x, cur_y), line, font=font, fill=text_color, direction=direction, language=language)
                    cur_y += lh

        return Image.alpha_composite(result, overlay).convert("RGB")

    @staticmethod
    def _remove_overlapping_boxes(boxes, overlap_threshold=0.5):
        """✨ NMS: Remove smaller boxes heavily overlapped by larger ones."""
        if len(boxes) == 0:
            return boxes
        keep = []
        for i, box1 in enumerate(boxes):
            x1_a, y1_a, x2_a, y2_a = box1
            area1 = (x2_a - x1_a) * (y2_a - y1_a)
            is_redundant = False
            for j, box2 in enumerate(boxes):
                if i == j:
                    continue
                x1_b, y1_b, x2_b, y2_b = box2
                area2 = (x2_b - x1_b) * (y2_b - y1_b)
                intersection = (
                    max(0, min(x2_a, x2_b) - max(x1_a, x1_b)) *
                    max(0, min(y2_a, y2_b) - max(y1_a, y1_b))
                )
                if intersection > 0 and (intersection / area1) > overlap_threshold and area2 >= area1:
                    is_redundant = True
                    break
            if not is_redundant:
                keep.append(box1)
        import numpy as _np_static
        return _np_static.array(keep)

    @staticmethod
    def _filter_detections(boxes, min_area=400, max_ar=6.0):
        if len(boxes) == 0: return boxes
        import numpy as _np_static
        filtered = []
        for box in boxes:
            x1, y1, x2, y2 = box
            w, h = x2 - x1, y2 - y1
            area = w * h
            ar = max(w, h) / max(min(w, h), 1)
            if area >= min_area and ar <= max_ar:
                filtered.append(box)
        return _np_static.array(filtered) if filtered else _np_static.array([]).reshape(0, 4)

    @staticmethod
    def _sort_boxes_manga_order(boxes):
        if len(boxes) == 0: return boxes
        page_h = max(b[3] for b in boxes)
        row_threshold = page_h * 0.15
        sorted_boxes = sorted(boxes, key=lambda b: b[1])
        rows, current_row = [], [sorted_boxes[0]]
        for box in sorted_boxes[1:]:
            if abs(box[1] - current_row[0][1]) < row_threshold:
                current_row.append(box)
            else:
                rows.append(current_row)
                current_row = [box]
        rows.append(current_row)
        ordered = []
        for row in rows:
            row.sort(key=lambda b: -b[0])
            ordered.extend(row)
        return ordered

    @modal.method()
    def translate_page(self, image_bytes: bytes, source_lang: str = "ja", target_lang: str = "ar") -> bytes:
        np = self._np
        cv2 = self._cv2
        from PIL import Image

        CROP_PADDING = 4
        MASK_DILATION = 7

        image_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_cv = np.array(image_pil)

        results = self.yolo_model(img_cv, conf=0.25, iou=0.4, agnostic_nms=True, verbose=False)
        raw_boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
        boxes = self._remove_overlapping_boxes(raw_boxes, overlap_threshold=0.4)
        boxes = self._filter_detections(boxes)
        if len(boxes) > 0:
            boxes = self._sort_boxes_manga_order(boxes)

        if len(boxes) == 0:
            buf = io.BytesIO()
            image_pil.save(buf, format="PNG")
            return buf.getvalue()

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

            if source_lang == "ja":
                roi_pil = Image.fromarray(bubble_crop)
                source_text = self.manga_ocr(roi_pil)
            else:
                detections = self.easyocr_reader.readtext(bubble_crop)
                source_text = " ".join([t[1] for t in detections])

            if not self._is_valid_source_text(source_text, source_lang):
                continue

            target_text = self._translate(source_text)
            if "[Translation Error]" in target_text:
                continue

            translations[i] = target_text
            sentiments[i] = self._get_sentiment(target_text)

            # ===============================================================
            # ✨ THE ULTIMATE MASK FIX (ERASES ORIGINAL TEXT & PUNCTUATION)
            # ===============================================================
            bubble_crop_cv = bubble_crop
            gray_crop = cv2.cvtColor(bubble_crop_cv, cv2.COLOR_RGB2GRAY)

            # 1. Adaptive Otsu thresholding
            blurred = cv2.GaussianBlur(gray_crop, (3, 3), 0)
            if np.median(gray_crop) > 127:
                _, binary_ink = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            else:
                _, binary_ink = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # Morphological noise cleanup
            clean_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            binary_ink = cv2.morphologyEx(binary_ink, cv2.MORPH_OPEN, clean_kernel)

            # 2. EasyOCR box mask (safety net for known text regions)
            ocr_box_mask = np.zeros_like(gray_crop)
            for (bbox_pts, _text, _conf) in self.easyocr_reader.readtext(bubble_crop_cv, paragraph=False):
                cv2.fillPoly(ocr_box_mask, [np.array(bbox_pts, dtype=np.int32)], 255)
            ocr_box_mask = cv2.dilate(ocr_box_mask, np.ones((5, 5), np.uint8))
            ocr_ink = cv2.bitwise_and(binary_ink, ocr_box_mask)

            # 3. Flood-fill edges to isolate floating ink (dots, vertical punctuation)
            h, w = binary_ink.shape
            flood_mask = np.zeros((h + 2, w + 2), np.uint8)
            floating_ink = binary_ink.copy()
            for x in range(w):
                if floating_ink[0, x] == 255:
                    cv2.floodFill(floating_ink, flood_mask, (x, 0), 0)
                if floating_ink[h - 1, x] == 255:
                    cv2.floodFill(floating_ink, flood_mask, (x, h - 1), 0)
            for y in range(h):
                if floating_ink[y, 0] == 255:
                    cv2.floodFill(floating_ink, flood_mask, (0, y), 0)
                if floating_ink[y, w - 1] == 255:
                    cv2.floodFill(floating_ink, flood_mask, (w - 1, y), 0)

            # 4. Combine both masks
            final_text_mask = cv2.bitwise_or(ocr_ink, floating_ink)
            global_mask[py1:py2, px1:px2] = cv2.bitwise_or(
                global_mask[py1:py2, px1:px2], final_text_mask
            )

        cleaned = self._inpaint(image_pil, global_mask)
        final = self._render_text(cleaned, boxes, translations, sentiments, target_lang)

        buf = io.BytesIO()
        final.save(buf, format="PNG")
        return buf.getvalue()

    @modal.fastapi_endpoint(method="POST")
    async def translate(self, request: Request):
        try:
            form = await request.form()
            image_file = form.get("image")
            source_lang = form.get("source_lang", "ja")
            target_lang = form.get("target_lang", "ar")

            if not image_file:
                return FastAPIResponse(content='{"error": "No image provided"}', status_code=400, media_type="application/json")

            image_bytes = await image_file.read()
            translated_bytes = self.translate_page.local(image_bytes, source_lang, target_lang)
            return FastAPIResponse(content=translated_bytes, media_type="image/png")
        except Exception as e:
            return FastAPIResponse(content=f'{{"error": "{str(e)}"}}', status_code=500, media_type="application/json")

    @modal.fastapi_endpoint(method="GET")
    async def health(self):
        return {
            "status": "ready",
            "device": self.device,
            "lama_available": self.lama is not None,
        }
