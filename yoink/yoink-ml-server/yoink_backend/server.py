"""
Lightweight API wrapper around inference.py so the Next.js app can call
the classifier over HTTP instead of running it as a standalone script.

Run this from inside the yoink_backend/ folder:
    uvicorn server:app --reload --port 8000

Requires (install once):
    pip install fastapi uvicorn python-multipart --break-system-packages
    pip install torch torchvision pillow ftfy regex tqdm --break-system-packages
    pip install git+https://github.com/openai/CLIP.git --break-system-packages
"""

import io
import clip
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from inference import (
    load_resnet,
    classify_with_resnet,
    classify_with_clip,
    CLIP_FALLBACK_CATEGORIES,
    CONFIDENCE_THRESHOLD,
    device,
)

app = FastAPI()

# Allow your Next.js dev server to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading models — this happens once at server startup, may take a minute...")
resnet_model, resnet_classes = load_resnet()
clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)
print("Models ready. Server can now accept requests.")


@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    resnet_label, resnet_confidence = classify_with_resnet(resnet_model, resnet_classes, image)

    if resnet_confidence >= CONFIDENCE_THRESHOLD:
        return {"label": resnet_label, "confidence": resnet_confidence, "source": "resnet"}

    clip_label, clip_confidence = classify_with_clip(
        clip_model, clip_preprocess, image, CLIP_FALLBACK_CATEGORIES
    )
    return {"label": clip_label, "confidence": clip_confidence, "source": "clip_fallback"}


@app.get("/health")
async def health():
    return {"status": "ok"}
