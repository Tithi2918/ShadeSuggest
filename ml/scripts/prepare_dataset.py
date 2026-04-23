"""
prepare_dataset.py
Downloads and prepares the training dataset for ShadeSense skin tone classifier.
Dataset: Monk Skin Tone Examples (Google) + augmented synthetic samples
Output structure:
  ml/dataset/
    raw/          <- original downloaded images
    processed/    <- resized, normalised, split
      train/
        mst_01/ ... mst_10/
      val/
        mst_01/ ... mst_10/
      test/
        mst_01/ ... mst_10/
"""

import os
import shutil
import random
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from tqdm import tqdm

# ── Config ────────────────────────────────────────────────────────────────────
DATASET_ROOT  = Path("ml/dataset")
RAW_DIR       = DATASET_ROOT / "raw"
PROCESSED_DIR = DATASET_ROOT / "processed"
SPLITS        = {"train": 0.70, "val": 0.15, "test": 0.15}
IMG_SIZE      = 224          # EfficientNet-B0 input size
SEED          = 42
NUM_CLASSES   = 10           # MST-01 through MST-10

MST_LABELS = [f"mst_{i:02d}" for i in range(1, NUM_CLASSES + 1)]

# ── MST reference hex colours (Google Monk Scale) ────────────────────────────
MST_HEX = [
    "#F6EDE4",  # MST-01
    "#F3E7DB",  # MST-02
    "#F7EAD0",  # MST-03
    "#EAD9BB",  # MST-04
    "#D7BD96",  # MST-05
    "#A07850",  # MST-06
    "#825C43",  # MST-07
    "#604134",  # MST-08
    "#3A312A",  # MST-09
    "#292420",  # MST-10
]

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def generate_synthetic_face(mst_index, img_size=224):
    """
    Generate a synthetic face-like image for a given MST index.
    Creates an oval face region filled with skin tone colour +
    gaussian noise to simulate real skin texture variation.
    This is used to bootstrap the dataset before real images are added.
    """
    base_rgb = hex_to_rgb(MST_HEX[mst_index])
    img = np.zeros((img_size, img_size, 3), dtype=np.uint8)

    # Background
    img[:] = [230, 220, 210]

    # Face oval
    center = (img_size // 2, img_size // 2)
    axes   = (img_size // 3, int(img_size // 2.4))
    cv2.ellipse(img, center, axes, 0, 0, 360, base_rgb[::-1], -1)

    # Add gaussian noise to simulate texture
    noise = np.random.normal(0, 12, img.shape).astype(np.int16)
    img   = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Add slight colour variation across face region
    variation = np.random.randint(-15, 15, 3)
    mask = np.zeros((img_size, img_size), dtype=np.uint8)
    cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
    for c in range(3):
        channel = img[:, :, c].astype(np.int16)
        channel[mask > 0] = np.clip(channel[mask > 0] + variation[c], 0, 255)
        img[:, :, c] = channel.astype(np.uint8)

    return img

def create_split_dirs():
    for split in SPLITS:
        for label in MST_LABELS:
            (PROCESSED_DIR / split / label).mkdir(parents=True, exist_ok=True)

def split_and_copy(images_by_class):
    random.seed(SEED)
    for label, paths in images_by_class.items():
        random.shuffle(paths)
        n      = len(paths)
        n_train = int(n * SPLITS["train"])
        n_val   = int(n * SPLITS["val"])

        splits = {
            "train": paths[:n_train],
            "val":   paths[n_train:n_train + n_val],
            "test":  paths[n_train + n_val:],
        }

        for split, files in splits.items():
            for src in files:
                dst = PROCESSED_DIR / split / label / Path(src).name
                shutil.copy2(src, dst)

    print("Dataset split complete.")
    for split in SPLITS:
        total = sum(
            len(list((PROCESSED_DIR / split / l).iterdir()))
            for l in MST_LABELS
        )
        print(f"  {split:>6}: {total} images")

def generate_synthetic_dataset(n_per_class=200):
    """Generate synthetic training images when real dataset is not available."""
    print(f"Generating {n_per_class} synthetic images per MST class...")
    raw_by_class = {}

    for idx, label in enumerate(tqdm(MST_LABELS)):
        class_dir = RAW_DIR / label
        class_dir.mkdir(parents=True, exist_ok=True)
        paths = []

        for i in range(n_per_class):
            img      = generate_synthetic_face(idx)
            out_path = class_dir / f"synthetic_{i:04d}.jpg"
            cv2.imwrite(str(out_path), img)
            paths.append(str(out_path))

        raw_by_class[label] = paths

    return raw_by_class

def preprocess_image(src_path, dst_path):
    img = Image.open(src_path).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    img.save(dst_path, "JPEG", quality=95)

def preprocess_all():
    print("Preprocessing images to 224x224...")
    for split in SPLITS:
        for label in MST_LABELS:
            src_dir = PROCESSED_DIR / split / label
            for img_path in tqdm(list(src_dir.glob("*.jpg")), desc=f"{split}/{label}"):
                preprocess_image(img_path, img_path)

def print_dataset_summary():
    print("\n── Dataset Summary ─────────────────────────────────────")
    for split in SPLITS:
        print(f"\n  {split.upper()}")
        for label in MST_LABELS:
            count = len(list((PROCESSED_DIR / split / label).iterdir()))
            bar   = "█" * (count // 5)
            print(f"    {label}: {count:>4} {bar}")
    print("─────────────────────────────────────────────────────────\n")

def main(args):
    print("ShadeSense — Dataset Preparation")
    print("=" * 50)

    if args.synthetic:
        print("Mode: Synthetic dataset generation")
        raw_by_class = generate_synthetic_dataset(n_per_class=args.n_per_class)
    else:
        print("Mode: Real dataset (place images in ml/dataset/raw/mst_01 ... mst_10)")
        raw_by_class = {}
        for label in MST_LABELS:
            class_dir = RAW_DIR / label
            if class_dir.exists():
                paths = [str(p) for p in class_dir.glob("*.jpg")]
                paths += [str(p) for p in class_dir.glob("*.png")]
                raw_by_class[label] = paths
                print(f"  {label}: {len(paths)} images found")
            else:
                print(f"  {label}: directory not found — skipping")

    create_split_dirs()
    split_and_copy(raw_by_class)
    preprocess_all()
    print_dataset_summary()
    print("Dataset preparation complete.")
    print(f"Processed data saved to: {PROCESSED_DIR.resolve()}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ShadeSense dataset preparation")
    parser.add_argument("--synthetic",    action="store_true", help="Generate synthetic dataset")
    parser.add_argument("--n_per_class",  type=int, default=200, help="Synthetic images per class")
    args = parser.parse_args()
    main(args)
