"""
Zero-shot condition estimation using CLIP - no labeled dataset required.

Honest caveat: CLIP was trained on general image-caption pairs, which mostly
describe *what* is in an image rather than *how worn* it looks. Condition is
a subtler concept than object identity, so treat this as a rough prototype
signal, not a validated measurement - worth stating plainly in a demo rather
than overselling the accuracy.

Two approaches are included:
1. classify_condition_discrete() - simple zero-shot classification into
   condition buckets, same pattern as the object-identification fallback.
2. score_condition_continuous() - a more sophisticated approach: projects
   the image onto a "new <-> worn" axis defined by the difference between
   two anchor text embeddings, giving a continuous 0-1 score instead of a
   coarse bucket. More technically interesting, still no training data needed.
"""

import torch
import clip
from PIL import Image

device = torch.device("cuda" if torch.cuda.is_available() else
                       "mps" if torch.backends.mps.is_available() else "cpu")

DISCRETE_CONDITION_LABELS = [
    "a photo of a brand new, unused item",
    "a photo of a gently used item in good condition",
    "a photo of a worn item with visible wear",
    "a photo of a damaged or heavily worn item",
]

# Anchor prompts defining the two ends of the "new <-> worn" axis
NEW_ANCHOR = "a photo of a brand new, pristine, unused item"
WORN_ANCHOR = "a photo of a very old, worn, damaged, heavily used item"


def classify_condition_discrete(clip_model, clip_preprocess, image: Image.Image):
    """Simple zero-shot classification into one of four condition buckets."""
    image_input = clip_preprocess(image.convert("RGB")).unsqueeze(0).to(device)
    text_input = clip.tokenize(DISCRETE_CONDITION_LABELS).to(device)

    with torch.no_grad():
        logits_per_image, _ = clip_model(image_input, text_input)
        probs = logits_per_image.softmax(dim=-1)
        top_prob, top_idx = probs[0].max(dim=0)

    return DISCRETE_CONDITION_LABELS[top_idx.item()], top_prob.item()


def score_condition_continuous(clip_model, clip_preprocess, image: Image.Image):
    """
    Projects the image's CLIP embedding onto the axis between a 'new' anchor
    and a 'worn' anchor, returning a continuous score from 0 (matches 'worn'
    anchor) to 1 (matches 'new' anchor).

    This is more informative than a 4-bucket classification since it doesn't
    force the image into a discrete category, but it's still fundamentally
    limited by whether CLIP's embedding space actually captures wear/condition
    as a meaningful direction - worth validating against a few known examples
    before trusting it, rather than assuming it's accurate out of the box.
    """
    image_input = clip_preprocess(image.convert("RGB")).unsqueeze(0).to(device)
    text_input = clip.tokenize([NEW_ANCHOR, WORN_ANCHOR]).to(device)

    with torch.no_grad():
        image_features = clip_model.encode_image(image_input)
        text_features = clip_model.encode_text(text_input)

        # normalize to unit vectors so we're comparing directions, not magnitudes
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

        new_similarity = (image_features @ text_features[0]).item()
        worn_similarity = (image_features @ text_features[1]).item()

    # convert the two similarities into a single 0-1 score along the axis
    # (this is a simple softmax-style normalization, not a calibrated probability)
    exp_new = torch.exp(torch.tensor(new_similarity * 10))  # temperature scaling
    exp_worn = torch.exp(torch.tensor(worn_similarity * 10))
    new_score = (exp_new / (exp_new + exp_worn)).item()

    return new_score  # closer to 1.0 = looks new, closer to 0.0 = looks worn


def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python condition_estimation.py <image.jpg>")
        return

    clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)

    for image_path in sys.argv[1:]:
        image = Image.open(image_path)

        discrete_label, discrete_confidence = classify_condition_discrete(clip_model, clip_preprocess, image)
        continuous_score = score_condition_continuous(clip_model, clip_preprocess, image)

        print(f"[{image_path}]")
        print(f"  Discrete:   {discrete_label} (confidence: {discrete_confidence:.3f})")
        print(f"  Continuous: {continuous_score:.3f} (1.0 = looks new, 0.0 = looks worn)")
        print()


if __name__ == "__main__":
    main()