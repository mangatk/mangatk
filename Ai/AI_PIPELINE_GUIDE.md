# MangaTK AI Translation Pipeline — Complete Guide

## What This System Does

This system takes a manga page in **Japanese** and outputs a fully translated page in **Arabic** — with the original text removed, replaced with properly styled Arabic text inside the speech bubbles. It uses 5 AI models working in sequence.

---

## The Pipeline (Step by Step)

```
📄 Manga Page → 🔍 Bubble Detector → 📝 OCR → 🎭 Sentiment → 🌐 Translator
                                                                     ↓
                        ✅ Translated Page ← 🎨 Text Renderer ← 🧹 Inpainter
```

| Step | Model | What It Does |
|------|-------|-------------|
| 1 | **YOLOv8** | Finds all speech bubbles on the page |
| 2 | **manga-ocr / EasyOCR** | Reads the Japanese text inside each bubble |
| 3 | **BERT** | Detects if the text is positive, negative, or neutral |
| 4 | **Seq2Seq** | Translates Japanese → Arabic |
| 5 | **LaMa** | Erases the original text from the image cleanly |
| 6 | **Text Renderer** | Draws the Arabic translation back into the bubble |

---

## File Map

All AI files live in `backend/manga/services/`:

```
backend/
├── config/
│   └── settings.py               ← AI model IDs + Modal URL configured here
├── modal_app.py                   ← Modal.com GPU deployment script
├── manga/
│   └── services/
│       ├── __init__.py            ← Package exports
│       ├── custom_translator.py   ← Entry point (routes to Modal or local)
│       ├── pipeline.py            ← Orchestrator (chains the 5 models)
│       ├── bubble_detector.py     ← Step 1: YOLO bubble detection
│       ├── ocr_service.py         ← Step 2: Text extraction
│       ├── sentiment_service.py   ← Step 3: Sentiment analysis
│       ├── translator_service.py  ← Step 4: Translation
│       ├── inpainter_service.py   ← Step 5: Text removal (LaMa)
│       ├── fallback_inpainter.py  ← Step 5 backup: CV-based text removal
│       ├── text_renderer.py       ← Step 6: Arabic text rendering
│       ├── modal_client.py        ← HTTP client for Modal endpoint
│       ├── fonts/                 ← Arabic fonts (auto-downloaded)
│       └── weights/               ← Local model files (optional)
```

---

## File-by-File Explanation

### 1. `custom_translator.py` — The Entry Point

> **This is the ONLY file the rest of the website talks to.**

```
Website Views → CustomTranslator → (Modal or Local Pipeline)
```

- Every translation request from the website calls `CustomTranslator.translate_chapter()`
- It checks: **is `MODAL_ENDPOINT_URL` set in settings?**
  - ✅ **Yes** → Sends images to Modal.com GPU via HTTP
  - ❌ **No** → Runs the local pipeline on the same machine
- **You never need to change any other website code** — this file handles the routing

Key methods:
- `translate_chapter(zip_path, output_dir)` — Synchronous translation
- `translate_chapter_async(...)` — Background thread with progress callbacks
- `test_model()` — Health check (tests if models are loaded)

---

### 2. `pipeline.py` — The Orchestrator

> **Chains all 5 AI models together for each page.**

This is the brain of the local translation. For each page:

```python
# Pseudocode of what pipeline.py does:
for each page in chapter:
    boxes = bubble_detector.detect(page)        # Find bubbles
    for each bubble in boxes:
        text = ocr.extract_text(bubble)          # Read Japanese
        translation = translator.translate(text) # → Arabic
        sentiment = sentiment.analyze(translation) # positive/negative/neutral
    cleaned = inpainter.inpaint(page, mask)      # Erase original text
    final = text_renderer.render(cleaned, translations, sentiments)  # Draw Arabic
```

Key design: **Lazy-loaded singletons** — models only load into memory when the first translation request arrives, and stay loaded for all subsequent requests.

---

### 3. `bubble_detector.py` — Step 1: Find Bubbles

> **Uses YOLOv8 to detect speech bubble locations.**

- **Input**: A manga page image
- **Output**: Array of bounding boxes `[[x1,y1,x2,y2], ...]`
- **Model**: `Bart2277/comic-detector` from HuggingFace

How it finds the model:
1. Checks `weights/comic_bubble_yolov8.pt` (local file)
2. If not found → downloads from `Bart2277/comic-detector` on HuggingFace
3. Caches the download so it only happens once

---

### 4. `ocr_service.py` — Step 2: Read Text

> **Extracts Japanese text from each detected bubble.**

- **Input**: Cropped bubble image
- **Output**: Japanese text string (e.g. `"こんにちは"`)
- **Models**: 
  - **manga-ocr** — specialized for manga (vertical Japanese text)
  - **EasyOCR** — used for text mask regions (for inpainting)

Also includes `is_valid_source_text()` — filters out non-text detections (sound effects, single dots, etc.) by checking if >30% of characters are Japanese.

---

### 5. `sentiment_service.py` — Step 3: Detect Emotion

> **Determines if the text is positive, negative, or neutral.**

- **Input**: Translated Arabic text
- **Output**: `"positive"`, `"negative"`, or `"neutral"`
- **Model**: `Bart2277/sentment_analysis_model_for_comics` from HuggingFace

**Why?** Different emotions get different visual treatment:
- 😊 Positive → **Lalezar** font (bold/fun)
- 😠 Negative → **Aref Ruqaa** font (dramatic) + red text color
- 😐 Neutral → **Noto Naskh Arabic** font (standard)

---

### 6. `translator_service.py` — Step 4: Translate

> **Translates Japanese → Arabic using a Seq2Seq model.**

- **Input**: Japanese text
- **Output**: Arabic text
- **Model**: `Bart2277/JPtoAR_transaltion_model_for_comics` from HuggingFace

How it finds the model:
1. Checks `weights/translation_model/` (local folder)
2. If not found → reads `AI_TRANSLATION_PIPELINE.TRANSLATION_MODEL` from settings
3. Default: `Bart2277/JPtoAR_transaltion_model_for_comics`

---

### 7. `inpainter_service.py` — Step 5: Erase Text

> **Removes original Japanese text from the image, filling in the background.**

- **Input**: Original image + binary mask (white = text to remove)
- **Output**: Clean image with text erased
- **Model**: **LaMa** (Large Mask Inpainting)

**Fallback behavior**:
1. Tries LaMa first (ML-based, produces the cleanest results)
2. If LaMa fails → automatically uses `fallback_inpainter.py`

---

### 8. `fallback_inpainter.py` — Step 5 Backup

> **CV-based text removal. No ML model needed.**

Uses OpenCV algorithms instead of an AI model:
- Adaptive thresholding to detect shapes
- Contour analysis to separate bubble borders from text
- Connected component analysis to identify "floating" text blobs
- Fills detected text areas with the dominant background color

Has two paths:
- **Path A (Leaky bubbles)**: For bubbles where the contour covers >90% of the bounding box
- **Path B (Normal bubbles)**: Uses solidity analysis and margin-based erosion

---

### 9. `text_renderer.py` — Step 6: Draw Arabic Text

> **Renders the translated Arabic text back into the cleaned bubbles.**

- **Input**: Cleaned image + translations + sentiments + bubble boxes
- **Output**: Final translated manga page

Features:
- **RTL (Right-to-Left)** Arabic text support
- **Auto-sizing**: Finds the largest font size that fits inside the bubble
- **Sentiment-based styling**:
  - Font selection (3 Arabic fonts based on emotion)
  - Color selection (dark/light based on bubble background brightness)
  - Negative text gets red coloring
- **8-directional outline** for readability
- **Auto-downloads fonts** from GitHub on first use

---

### 10. `modal_app.py` — Cloud GPU Deployment

> **Runs the entire pipeline on Modal.com's GPU servers.**

This is a standalone script you deploy to Modal. It:

1. **Builds a Docker-like image** with all Python dependencies
2. **Pre-downloads ALL models** at build time (fonts, YOLO, OCR, LaMa, etc.)
3. **Loads models into GPU** when a container starts
4. **Exposes HTTP endpoints**:
   - `POST /translate` — Send an image, get back translated image
   - `GET /health` — Check if the pipeline is ready

```bash
# Deploy to Modal:
pip install modal
modal setup           # One-time auth
modal deploy modal_app.py
```

After deploying, Modal gives you a URL. Put it in your `.env`:
```
MODAL_ENDPOINT_URL=https://YOUR_USER--mangatk-translation-translate.modal.run
```

---

### 11. `modal_client.py` — Django ↔ Modal Bridge

> **Sends images from your Django server to the Modal GPU endpoint.**

- Converts PIL images to PNG bytes
- Sends them via HTTP POST to the Modal endpoint
- Receives the translated PNG back
- Handles chapter-level translation (extracts ZIP, sends each page, saves results)

---

### 12. `settings.py` (AI section)

> **Central configuration for all AI models.**

```python
# These are already set with your HuggingFace models:
AI_TRANSLATION_PIPELINE = {
    'TRANSLATION_MODEL': 'Bart2277/JPtoAR_transaltion_model_for_comics',
    'SENTIMENT_MODEL': 'Bart2277/sentment_analysis_model_for_comics',
    'BUBBLE_DETECTOR_MODEL': 'Bart2277/comic-detector',
    'SOURCE_LANG': 'ja',
    'TARGET_LANG': 'ar',
}

# Set this to use Modal GPU (leave empty for local):
MODAL_ENDPOINT_URL = ''
```

All values can be overridden via `.env` file:
```
AI_TRANSLATION_MODEL=Bart2277/JPtoAR_transaltion_model_for_comics
AI_SENTIMENT_MODEL=Bart2277/sentment_analysis_model_for_comics
MODAL_ENDPOINT_URL=https://...
```

---

## How Everything Connects

```
┌─────────────────────────────────────────────────┐
│              🌐 Website (Django)                │
│                                                 │
│  Views (dashboard/user) → custom_translator.py  │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │ MODAL_ENDPOINT_URL set? │
          └────────────┼────────────┘
                 ╱            ╲
              YES               NO
               │                 │
    ┌──────────▼──────────┐  ┌──▼───────────────────────────┐
    │  ☁️ Modal.com GPU    │  │  🖥️ Local Pipeline            │
    │                     │  │                              │
    │  modal_client.py    │  │  pipeline.py                 │
    │       ↓ HTTP POST   │  │    ├── bubble_detector.py    │
    │  modal_app.py       │  │    ├── ocr_service.py        │
    │    (T4 GPU)         │  │    ├── sentiment_service.py  │
    │                     │  │    ├── translator_service.py  │
    └─────────────────────┘  │    ├── inpainter_service.py  │
                             │    │    └── fallback_inpainter│
                             │    └── text_renderer.py      │
                             └──────────────────────────────┘
```

---

## Two Ways to Run

### Option A: Modal.com GPU (Recommended)

Best for: Production, no local GPU needed.

```bash
# 1. Install & auth
pip install modal
modal setup

# 2. Deploy (downloads all models, ~10 min first time)
cd backend
modal deploy modal_app.py

# 3. Copy the URL, set in .env
MODAL_ENDPOINT_URL=https://YOUR_USER--mangatk-translation-translate.modal.run

# 4. Start Django — it will auto-route to Modal
python manage.py runserver
```

### Option B: Local Pipeline

Best for: Development, offline, full control.

```bash
# 1. Install AI dependencies
pip install -r requirements.txt

# 2. Make sure MODAL_ENDPOINT_URL is empty in .env
# MODAL_ENDPOINT_URL=

# 3. Start Django — models download on first translation
python manage.py runserver
```

> **Note:** Models auto-download from HuggingFace on first use. First translation takes longer as models load. Subsequent translations are fast (models stay in memory).
