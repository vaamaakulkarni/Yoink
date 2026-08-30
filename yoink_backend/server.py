"""HTTP API for the Yoink image classifier and condition estimator.

Run from this directory with:
    uvicorn server:app --reload --port 8000
"""

import io
from contextlib import asynccontextmanager

import clip
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from inference import analyze_image, device, load_resnet


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Keep model loading out of module import so tools can import this file
    # without immediately allocating the ResNet and CLIP models.
    print("Loading ML models; this can take a minute on first startup...")
    app.state.resnet_model, app.state.resnet_classes = load_resnet()
    app.state.clip_model, app.state.clip_preprocess = clip.load("ViT-B/32", device=device)
    print("ML models ready.")
    yield


app = FastAPI(title="Yoink ML API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Return an item label and a non-authoritative condition suggestion."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Please upload an image file.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        with Image.open(io.BytesIO(contents)) as image:
            result = analyze_image(
                image,
                app.state.resnet_model,
                app.state.resnet_classes,
                app.state.clip_model,
                app.state.clip_preprocess,
            )
    except UnidentifiedImageError as error:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.") from error

    return result


@app.get("/health")
async def health():
    return {"status": "ok"}
