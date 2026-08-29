"""
Fine-tunes a pretrained ResNet18 on our selected Office-Home classes.
Same approach as the kitchenware version, generalized to however many
classes are found in data_sorted/train.

After training, runs a confidence analysis on the validation set so you
can see how confident the model is on correct vs incorrect predictions -
this is what you'll use to pick the CLIP-fallback threshold, not a guess.
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

DATA_DIR = "data_sorted"
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 1e-3
MODEL_OUT_PATH = "item_classifier_resnet18.pt"

device = torch.device("cuda" if torch.cuda.is_available() else
                       "mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")

normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                  std=[0.229, 0.224, 0.225])

train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),  # helps since these are real-world photos with varied lighting
    transforms.ToTensor(),
    normalize,
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    normalize,
])

train_dataset = datasets.ImageFolder(f"{DATA_DIR}/train", transform=train_transform)
val_dataset = datasets.ImageFolder(f"{DATA_DIR}/val", transform=val_transform)

class_names = train_dataset.classes
print(f"Training on {len(class_names)} classes: {class_names}")

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
num_features = model.fc.in_features
model.fc = nn.Linear(num_features, len(class_names))
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)


def run_epoch(loader, training: bool):
    model.train() if training else model.eval()
    total_loss, correct, total = 0.0, 0, 0

    with torch.set_grad_enabled(training):
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)

            if training:
                optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)

            if training:
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)
            correct += (outputs.argmax(1) == labels).sum().item()
            total += labels.size(0)

    return total_loss / total, correct / total


def analyze_confidence(loader):
    """
    Runs inference on the validation set and separates confidence scores
    into 'correct' and 'incorrect' buckets, so you can see where a
    sensible CLIP-fallback threshold would sit - printed as a simple
    histogram-style breakdown, no extra plotting dependency needed.
    """
    model.eval()
    correct_confidences = []
    incorrect_confidences = []

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            probs = torch.softmax(model(images), dim=1)
            top_probs, top_classes = probs.max(dim=1)

            for prob, pred, true in zip(top_probs, top_classes, labels):
                if pred.item() == true.item():
                    correct_confidences.append(prob.item())
                else:
                    incorrect_confidences.append(prob.item())

    print("\n--- Confidence analysis (for choosing your CLIP-fallback threshold) ---")
    if correct_confidences:
        print(f"Correct predictions:   mean confidence = {sum(correct_confidences)/len(correct_confidences):.3f}, "
              f"min = {min(correct_confidences):.3f}")
    if incorrect_confidences:
        print(f"Incorrect predictions: mean confidence = {sum(incorrect_confidences)/len(incorrect_confidences):.3f}, "
              f"max = {max(incorrect_confidences):.3f}")
    else:
        print("No incorrect predictions on the validation set - consider testing threshold "
              "behavior on genuinely out-of-distribution images instead (e.g. a class not in training).")

    for threshold in [0.5, 0.6, 0.7, 0.8, 0.9]:
        correct_above = sum(1 for c in correct_confidences if c >= threshold)
        incorrect_above = sum(1 for c in incorrect_confidences if c >= threshold)
        print(f"  threshold={threshold}: {correct_above}/{len(correct_confidences)} correct kept, "
              f"{incorrect_above}/{max(len(incorrect_confidences),1)} incorrect still passed through")


def main():
    best_val_acc = 0.0

    for epoch in range(1, EPOCHS + 1):
        train_loss, train_acc = run_epoch(train_loader, training=True)
        val_loss, val_acc = run_epoch(val_loader, training=False)

        print(f"Epoch {epoch}/{EPOCHS} | "
              f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
              f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "model_state_dict": model.state_dict(),
                "class_names": class_names,
            }, MODEL_OUT_PATH)
            print(f"  -> saved new best model ({val_acc:.4f}) to {MODEL_OUT_PATH}")

    print(f"\nTraining complete. Best val accuracy: {best_val_acc:.4f}")

    # Reload best checkpoint before analyzing confidence, so the analysis
    # matches the model you're actually shipping, not the last epoch trained
    checkpoint = torch.load(MODEL_OUT_PATH, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    analyze_confidence(val_loader)


if __name__ == "__main__":
    main()
