"""
Combined inference: tries the fine-tuned ResNet first, falls back to CLIP
zero-shot classification when the ResNet isn't confident enough.

Requires: pip install ftfy regex tqdm --break-system-packages
          pip install git+https://github.com/openai/CLIP.git
"""

import torch
import clip
from PIL import Image
from torchvision import transforms, models
import torch.nn as nn
from condition_estimation import classify_condition_discrete, score_condition_continuous

RESNET_CHECKPOINT_PATH = "item_classifier_resnet18.pt"
CONFIDENCE_THRESHOLD = 0.7  # set this based on train_resnet.py's confidence analysis output

# Broader vocabulary for CLIP to fall back on - can include items outside
# your 35 trained classes, since CLIP needs no training data for any of them
CLIP_FALLBACK_CATEGORIES = [
    "backpack", "bed", "bike", "bottle", "bucket", "calculator", "chair",
    "computer", "couch", "curtains", "desk lamp", "fan", "file cabinet",
    "fork", "helmet", "kettle", "keyboard", "knife", "lamp shade", "laptop",
    "monitor", "mouse", "mug", "pan", "printer", "radio", "refrigerator",
    "shelf", "speaker", "spoon", "table", "telephone", "television", "webcam",
    "alarm clock", "iron", "vacuum cleaner", "rice cooker", "microwave",
    "guitar", "skateboard", "tennis racket", "suitcase", "umbrella",
]

device = torch.device("cuda" if torch.cuda.is_available() else
                       "mps" if torch.backends.mps.is_available() else "cpu")


def load_resnet():
    checkpoint = torch.load(RESNET_CHECKPOINT_PATH, map_location=device)
    class_names = checkpoint["class_names"]

    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    return model, class_names


resnet_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def classify_with_resnet(model, class_names, image: Image.Image):
    tensor = resnet_transform(image.convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)
        top_prob, top_idx = probs.max(dim=1)
    return class_names[top_idx.item()], top_prob.item()


def classify_with_clip(clip_model, clip_preprocess, image: Image.Image, categories):
    image_input = clip_preprocess(image.convert("RGB")).unsqueeze(0).to(device)
    text_input = clip.tokenize(categories).to(device)

    with torch.no_grad():
        logits_per_image, _ = clip_model(image_input, text_input)
        probs = logits_per_image.softmax(dim=-1)
        top_prob, top_idx = probs[0].max(dim=0)

    return categories[top_idx.item()], top_prob.item()


def estimate_condition(clip_model, clip_preprocess, image: Image.Image):
    """Run condition estimation after item classification using the same CLIP model."""
    discrete_label, discrete_confidence = classify_condition_discrete(
        clip_model, clip_preprocess, image
    )
    continuous_score = score_condition_continuous(clip_model, clip_preprocess, image)

    return {
        "label": discrete_label,
        "confidence": discrete_confidence,
        "new_score": continuous_score,
    }


def classify_item(image_path: str, resnet_model, resnet_classes, clip_model, clip_preprocess):
    """Classify an item, then estimate its condition from the same image."""
    image = Image.open(image_path)

    resnet_label, resnet_confidence = classify_with_resnet(resnet_model, resnet_classes, image)

    if resnet_confidence >= CONFIDENCE_THRESHOLD:
        classification = {
            "label": resnet_label,
            "confidence": resnet_confidence,
            "source": "resnet",
        }
    else:
        clip_label, clip_confidence = classify_with_clip(
            clip_model, clip_preprocess, image, CLIP_FALLBACK_CATEGORIES
        )
        classification = {
            "label": clip_label,
            "confidence": clip_confidence,
            "source": "clip_fallback",
            "resnet_attempt": {"label": resnet_label, "confidence": resnet_confidence},
        }

    # This is deliberately after the classification branch so the pipeline order is
    # always classification -> condition estimation, even when CLIP is the fallback.
    classification["condition"] = estimate_condition(clip_model, clip_preprocess, image)
    return classification


def main():
    print("Loading models...")
    resnet_model, resnet_classes = load_resnet()
    clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)
    print("Ready.\n")

    # quick manual test - replace with your own image path
    test_image_path = "test_images/backpack_1.jpeg"
    result = classify_item(test_image_path, resnet_model, resnet_classes, clip_model, clip_preprocess)

    print(f"Prediction: {result['label']} (confidence: {result['confidence']:.3f}, source: {result['source']})")
    condition = result["condition"]
    print(
        f"Condition: {condition['label']} "
        f"(confidence: {condition['confidence']:.3f}, new score: {condition['new_score']:.3f})"
    )
    if result["source"] == "clip_fallback":
        attempt = result["resnet_attempt"]
        print(f"  (ResNet's best guess was '{attempt['label']}' at {attempt['confidence']:.3f}, below threshold)")


if __name__ == "__main__":
    main()
