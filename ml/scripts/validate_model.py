"""
validate_model.py
Runs detailed validation on the trained model.
Outputs per-class accuracy, confusion matrix, and
adjacent accuracy (±1 MST index) — the key metric
defined in SRS acceptance criterion AC-003.
"""

import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import timm
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from tqdm import tqdm

CHECKPOINT_DIR = Path("ml/checkpoints")
PROCESSED_DIR  = Path("ml/dataset/processed")
NUM_CLASSES    = 10
IMG_SIZE       = 224
BATCH_SIZE     = 32

MST_LABELS     = [f"MST-{i:02d}" for i in range(1, NUM_CLASSES + 1)]
IMAGENET_MEAN  = [0.485, 0.456, 0.406]
IMAGENET_STD   = [0.229, 0.224, 0.225]

def build_model():
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=0)
    in_features = model.num_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(512, NUM_CLASSES),
    )
    return model

def get_test_loader():
    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
    ds = datasets.ImageFolder(PROCESSED_DIR / "test", transform=transform)
    return DataLoader(ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

def print_confusion_matrix(matrix):
    print("\n── Confusion Matrix (rows=actual, cols=predicted) ───────")
    header = "       " + "  ".join(f"{l[-2:]}" for l in MST_LABELS)
    print(header)
    for i, row in enumerate(matrix):
        row_str = "  ".join(f"{v:3d}" for v in row)
        print(f"  {MST_LABELS[i]}: {row_str}")

@torch.no_grad()
def validate():
    print("ShadeSense — Model Validation")
    print("=" * 50)

    device     = torch.device("cpu")
    checkpoint = torch.load(CHECKPOINT_DIR / "best_model.pth", map_location=device)
    model      = build_model()
    model.load_state_dict(checkpoint["model_state"])
    model.eval()
    model.to(device)

    loader = get_test_loader()

    all_preds  = []
    all_labels = []

    for images, labels in tqdm(loader, desc="Validating"):
        images  = images.to(device)
        outputs = model(images)
        _, pred = outputs.max(1)
        all_preds.extend(pred.cpu().numpy())
        all_labels.extend(labels.numpy())

    all_preds  = np.array(all_preds)
    all_labels = np.array(all_labels)

    # Overall accuracy
    exact_acc = 100.0 * np.mean(all_preds == all_labels)
    adj_acc   = 100.0 * np.mean(np.abs(all_preds - all_labels) <= 1)

    print(f"\n── Overall Metrics ──────────────────────────────────────")
    print(f"  Exact accuracy   : {exact_acc:.2f}%")
    print(f"  Adjacent (±1)    : {adj_acc:.2f}%")
    print(f"  SRS target (±1)  : 85.00%  → {'PASS ✓' if adj_acc >= 85.0 else 'FAIL ✗'}")

    # Per-class accuracy
    print(f"\n── Per-Class Accuracy ───────────────────────────────────")
    for cls_idx in range(NUM_CLASSES):
        mask     = all_labels == cls_idx
        if mask.sum() == 0:
            print(f"  {MST_LABELS[cls_idx]}: no samples")
            continue
        cls_acc  = 100.0 * np.mean(all_preds[mask] == cls_idx)
        bar      = "█" * int(cls_acc / 5)
        print(f"  {MST_LABELS[cls_idx]}: {cls_acc:6.2f}%  {bar}")

    # Confusion matrix
    confusion = np.zeros((NUM_CLASSES, NUM_CLASSES), dtype=int)
    for pred, label in zip(all_preds, all_labels):
        confusion[label][pred] += 1
    print_confusion_matrix(confusion)

    # Save results
    results = {
        "exact_accuracy":    round(exact_acc, 4),
        "adjacent_accuracy": round(adj_acc, 4),
        "srs_target_pass":   adj_acc >= 85.0,
        "per_class": {
            MST_LABELS[i]: round(
                100.0 * np.mean(all_preds[all_labels == i] == i), 4
            ) if (all_labels == i).sum() > 0 else 0.0
            for i in range(NUM_CLASSES)
        }
    }

    out_path = CHECKPOINT_DIR / "validation_results.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nValidation results saved to: {out_path}")

if __name__ == "__main__":
    validate()
