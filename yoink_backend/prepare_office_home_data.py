"""
Loads Office-Home via FiftyOne's own Hugging Face loader (not the plain
`datasets` library) since this particular upload is a FiftyOne-native
export - its labels live in a separate samples.json/metadata structure
that the standard imagefolder loader can't see, which is why the first
version of this script only found an 'image' field and nothing else.

Filters to our selected classes and the Product + Real World domains
(skipping Art/Clipart, which are illustrations rather than real photos),
exports to a train/val folder structure for torchvision's ImageFolder.

Confirmed field structure from an actual run:
  sample.object -> Classification object, sample.object.label is the class
                   name (e.g. 'Alarm_Clock', underscore-separated)
  sample.domain -> Classification object, sample.domain.label is the domain
                   name (e.g. 'Real World', SPACE-separated - different
                   formatting convention than the class labels, confirmed
                   from real output, not a guess)

Run: pip install -U fiftyone pillow --break-system-packages
Then: python prepare_office_home_data.py
"""

import random
import shutil
from pathlib import Path

from fiftyone.utils.huggingface import load_from_hub

OUTPUT_DIR = Path("data_sorted")
VAL_SPLIT = 0.2
SEED = 42

# Confirmed real domain label values - only keep actual photos, not illustrations
DOMAINS_TO_KEEP = {"Product", "Real World"}

# Underscore-separated, matching the dataset's actual metadata.json class list
SELECTED_CLASSES = {
    "Alarm_Clock", "Backpack", "Bed", "Bike", "Bottle", "Bucket",
    "Calculator", "Chair", "Computer", "Couch", "Curtains", "Desk_Lamp",
    "Fan", "File_Cabinet", "Fork", "Helmet", "Kettle", "Keyboard",
    "Knives", "Lamp_Shade", "Laptop", "Monitor", "Mouse", "Mug",
    "Pan", "Printer", "Radio", "Refrigerator", "Shelf", "Speaker",
    "Spoon", "Table", "Telephone", "TV", "Webcam",
}

random.seed(SEED)


def normalize_label(label: str) -> str:
    """Turn a class name into a filesystem-safe, lowercase folder name."""
    return label.strip().lower()


def main():
    print("Loading Office-Home via FiftyOne's Hugging Face integration "
          "(uses local cache if already downloaded)...")
    dataset = load_from_hub("Voxel51/Office-Home")
    print(f"\nDataset has {len(dataset)} total samples.")

    kept_count = 0
    skipped_class = 0
    skipped_domain = 0
    skipped_no_label = 0
    class_counts = {}

    for sample in dataset:
        label_obj = sample.object
        domain_obj = sample.domain

        if label_obj is None or domain_obj is None:
            skipped_no_label += 1
            continue

        label_str = label_obj.label
        domain_str = domain_obj.label

        if domain_str not in DOMAINS_TO_KEEP:
            skipped_domain += 1
            continue
        if label_str not in SELECTED_CLASSES:
            skipped_class += 1
            continue

        class_counts[label_str] = class_counts.get(label_str, 0) + 1
        kept_count += 1

        split = "val" if random.random() < VAL_SPLIT else "train"
        dest_dir = OUTPUT_DIR / split / normalize_label(label_str)
        dest_dir.mkdir(parents=True, exist_ok=True)

        src_path = Path(sample.filepath)
        dest_path = dest_dir / f"{label_str}_{class_counts[label_str]}{src_path.suffix}"

        # Copy rather than move - keeps FiftyOne's own cached copy intact
        shutil.copy2(src_path, dest_path)

    print(f"\nKept {kept_count} images across {len(class_counts)} classes.")
    print(f"Skipped {skipped_domain} for domain, {skipped_class} for class filter, "
          f"{skipped_no_label} with no label.")
    print("Per-class counts:")
    for cls, count in sorted(class_counts.items()):
        print(f"  {cls}: {count}")

    if len(class_counts) < len(SELECTED_CLASSES):
        missing = SELECTED_CLASSES - set(class_counts.keys())
        print(f"\nWarning: {len(missing)} selected classes had zero matches: {missing}")
        print("Check spelling/casing against the actual dataset labels shown above.")


if __name__ == "__main__":
    main()