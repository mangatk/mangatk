import modal
import os
import io

# ==============================================================================
# Modal Image Definition
# This tells Modal what libraries to install on the remote GPU.
# You don't need these on your local Contabo server!
# ==============================================================================
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        "torchvision",
        "transformers",
        "ultralytics",      # YOLOv8
        "manga-ocr",        # Manga OCR
        "simple-lama-inpainting", # SimpleLaMa
        "opencv-python-headless",
        "Pillow",
        "numpy"
    )
)

# Define the Modal App
app = modal.App("mangatk-ml-pipeline")

# ==============================================================================
# 1. Text Detection (YOLOv8)
# ==============================================================================
@app.function(image=image, gpu="T4")
def detect_text_bubbles(image_bytes: bytes):
    """
    Takes raw image bytes, runs YOLOv8 to find text bubbles.
    Returns: list of bounding boxes and a mask image.
    """
    import cv2
    import numpy as np
    from PIL import Image
    from ultralytics import YOLO
    
    # [TO DO: Download/Initialize your YOLOv8 weights here]
    # model = YOLO("path/to/your/comic-text-detector.pt")
    
    print("Running YOLOv8 to detect text bubbles...")
    # Placeholder: Assuming we return fake bounding box for now
    boxes = [{"x": 10, "y": 10, "w": 100, "h": 50}]
    
    # Generate generic mask based on boxes
    fake_mask = np.zeros((100, 100), dtype=np.uint8)
    
    _, mask_encoded = cv2.imencode(".png", fake_mask)
    return boxes, mask_encoded.tobytes()

# ==============================================================================
# 2A. OCR (Manga OCR)
# ==============================================================================
@app.function(image=image, gpu="T4")
def perform_ocr(image_bytes: bytes, boxes: list):
    """
    Extracts Japanese/Korean text from the cropped boxes.
    """
    from PIL import Image
    # import manga_ocr
    # mocr = manga_ocr.MangaOcr()
    
    print(f"Running Manga OCR on {len(boxes)} text bubbles...")
    
    # [TO DO: Initialize Manga OCR and run inference on cropped regions]
    extracted_text = "こんにちは" # Hello (Placeholder)
    
    return [extracted_text]

# ==============================================================================
# 2B. Inpainting (SimpleLaMa)
# ==============================================================================
@app.function(image=image, gpu="T4")
def erase_text(image_bytes: bytes, mask_bytes: bytes):
    """
    Uses SimpleLaMa to erase text based on YOLOv8 mask.
    """
    from simple_lama_inpainting import SimpleLama
    from PIL import Image
    
    # [TO DO: Initialize LaMa and run]
    # simple_lama = SimpleLama()
    # result = simple_lama(original_img, mask_img)
    
    print("Running SimpleLaMa inpainting to erase original text...")
    
    # Placeholder: returning original image bytes for now
    return image_bytes 

# ==============================================================================
# 3. NLP Analysis (RoBERTa)
# ==============================================================================
@app.function(image=image, gpu="T4")
def analyze_sentiment(texts: list):
    """
    Analyzes sentiment of text to determine UI font style (Angry, Shouting, etc.)
    """
    from transformers import pipeline
    
    # [TO DO: Initialize RoBERTa pipeline]
    # classifier = pipeline("text-classification", model="cardiffnlp/twitter-roberta-base-sentiment")
    
    print(f"Running RoBERTa sentiment analysis on {len(texts)} texts...")
    
    return ["neutral"] * len(texts)

# ==============================================================================
# 4. Translation (Seq2Seq)
# ==============================================================================
@app.function(image=image, gpu="T4")
def translate_to_arabic(texts: list):
    """
    Translates raw text to Arabic using Seq2Seq model.
    """
    from transformers import pipeline
    
    # [TO DO: Initialize Seq2Seq model, e.g., NLLB, MarianMT, seamlessM4T]
    print(f"Running Seq2Seq Translation to Arabic...")
    
    return ["مرحبا"] * len(texts) # Hello in Arabic

# ==============================================================================
# 5. Typesetting 
# ==============================================================================
@app.function(image=image)
def typeset_arabic(clean_image_bytes: bytes, boxes: list, translated_texts: list, sentiments: list):
    """
    Draws the Arabic text back onto the cleaned image using Pillow.
    """
    from PIL import Image, ImageDraw, ImageFont
    
    print("Typesetting Arabic text back onto the image...")
    # [TO DO: Use ImageDraw.text to place Arabic text inside boxes based on sentiment (font style)]
    
    return clean_image_bytes

# ==============================================================================
# MAIN PIPELINE ENDPOINT (Webhook)
# This is what your Django app will call!
# ==============================================================================
@app.local_entrypoint()
def main():
    pass

@app.function(image=image)
@modal.web_endpoint(method="POST")
def translate_image_api(files: dict):
    """
    The orchestrator. Django sends an image, this orchestrates the ML steps securely.
    """
    # 1. Read input image
    image_bytes = files.get("image")
    if not image_bytes:
        return {"error": "No image provided"}
        
    print("Starting ML Translation Pipeline...")
    
    # 2. Get boxes and mask (YOLOv8)
    boxes, mask_bytes = detect_text_bubbles.remote(image_bytes)
    
    # 3. Parallel Execution: OCR and LaMa at the same time!
    # By using .spawn(), Modal runs them in parallel on separate GPUs
    ocr_call = perform_ocr.spawn(image_bytes, boxes)
    lama_call = erase_text.spawn(image_bytes, mask_bytes)
    
    # Wait for results
    raw_texts = ocr_call.get()
    clean_image_bytes = lama_call.get()
    
    # 4. Sentiment Analysis (RoBERTa)
    sentiments = analyze_sentiment.remote(raw_texts)
    
    # 5. Translation (Seq2Seq)
    arabic_texts = translate_to_arabic.remote(raw_texts)
    
    # 6. Typesetting
    final_image_bytes = typeset_arabic.remote(clean_image_bytes, boxes, arabic_texts, sentiments)
    
    from fastapi.responses import Response
    return Response(content=final_image_bytes, media_type="image/jpeg")

