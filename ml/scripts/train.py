"""
train.py
Fine-tunes EfficientNet-B0 on the ShadeSense MST skin tone dataset.
Architecture:
  - Backbone: EfficientNet-B0 pretrained on ImageNet (frozen except last 2 blocks)
  - Head: Dropout(0.3) → Linear(1280, 512) → ReLU → Dropout(0.2) → Linear(512, 10)
  - Loss: CrossEntropyLoss with label smoothing
  - Optimiser: AdamW with cosine annealing LR schedule
Output:
  ml/checkpoints/best_model.pth
  ml/checkpoints/training_log.csv
"""

import os
import csv
import time
import argparse
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import timm
from tqdm import tqdm

# ── Paths ─────────────────────────────────────────────────────────────────────
PROCESSED_DIR  = Path("ml/dataset/processed")
CHECKPOINT_DIR = Path("ml/checkpoints")
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

# ── Hyperparameters ───────────────────────────────────────────────────────────
NUM_CLASSES    = 10
IMG_SIZE       = 224
BATCH_SIZE     = 32
NUM_EPOCHS     = 30
LR             = 3e-4
WEIGHT_DECAY   = 1e-4
LABEL_SMOOTH   = 0.1
DROPOUT_1      = 0.3
DROPOUT_2      = 0.2
SEED           = 42

# ── Reproducibility ───────────────────────────────────────────────────────────
torch.manual_seed(SEED)

def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available():
        return torch.device("mps")   # Apple Silicon
    return torch.device("cpu")

# ── Transforms ────────────────────────────────────────────────────────────────
# ImageNet mean/std for pretrained EfficientNet-B0
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

train_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(
        brightness=0.3,
        contrast=0.3,
        saturation=0.2,
        hue=0.05,
    ),
    transforms.RandomGrayscale(p=0.05),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

val_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# ── Dataset ───────────────────────────────────────────────────────────────────
def get_dataloaders():
    train_ds = datasets.ImageFolder(PROCESSED_DIR / "train", transform=train_transforms)
    val_ds   = datasets.ImageFolder(PROCESSED_DIR / "val",   transform=val_transforms)
    test_ds  = datasets.ImageFolder(PROCESSED_DIR / "test",  transform=val_transforms)

    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=2, pin_memory=True)
    val_dl   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)
    test_dl  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)

    print(f"Classes: {train_ds.classes}")
    print(f"Train: {len(train_ds)} | Val: {len(val_ds)} | Test: {len(test_ds)}")
    return train_dl, val_dl, test_dl, train_ds.classes

# ── Model ─────────────────────────────────────────────────────────────────────
def build_model(num_classes=NUM_CLASSES):
    model = timm.create_model("efficientnet_b0", pretrained=True, num_classes=0)

    # Freeze all layers first
    for param in model.parameters():
        param.requires_grad = False

    # Unfreeze last 2 blocks for fine-tuning
    blocks = list(model.blocks.children())
    for block in blocks[-2:]:
        for param in block.parameters():
            param.requires_grad = True

    # Unfreeze the conv_head and bn2
    for param in model.conv_head.parameters():
        param.requires_grad = True
    for param in model.bn2.parameters():
        param.requires_grad = True

    # Custom classification head
    in_features = model.num_features  # 1280 for EfficientNet-B0
    model.classifier = nn.Sequential(
        nn.Dropout(p=DROPOUT_1),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(p=DROPOUT_2),
        nn.Linear(512, num_classes),
    )

    return model

# ── Training loop ─────────────────────────────────────────────────────────────
def train_epoch(model, loader, criterion, optimiser, device):
    model.train()
    running_loss, correct, total = 0.0, 0, 0

    for images, labels in tqdm(loader, desc="  Train", leave=False):
        images, labels = images.to(device), labels.to(device)
        optimiser.zero_grad()
        outputs = model(images)
        loss    = criterion(outputs, labels)
        loss.backward()
        optimiser.step()

        running_loss += loss.item() * images.size(0)
        _, predicted  = outputs.max(1)
        correct       += predicted.eq(labels).sum().item()
        total         += labels.size(0)

    return running_loss / total, 100.0 * correct / total

@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss, correct, total = 0.0, 0, 0

    for images, labels in tqdm(loader, desc="  Eval ", leave=False):
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss    = criterion(outputs, labels)

        running_loss += loss.item() * images.size(0)
        _, predicted  = outputs.max(1)
        correct       += predicted.eq(labels).sum().item()
        total         += labels.size(0)

    return running_loss / total, 100.0 * correct / total

# ── Adjacent accuracy (±1 MST index) ─────────────────────────────────────────
@torch.no_grad()
def adjacent_accuracy(model, loader, device):
    model.eval()
    correct, total = 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs        = model(images)
        _, predicted   = outputs.max(1)
        correct += (torch.abs(predicted - labels) <= 1).sum().item()
        total   += labels.size(0)
    return 100.0 * correct / total

# ── Main ──────────────────────────────────────────────────────────────────────
def main(args):
    device = get_device()
    print(f"\nShadeSense — EfficientNet-B0 Fine-tuning")
    print(f"Device : {device}")
    print(f"Epochs : {args.epochs}")
    print("=" * 50)

    train_dl, val_dl, test_dl, classes = get_dataloaders()

    model     = build_model(num_classes=NUM_CLASSES).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTH)
    optimiser = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR, weight_decay=WEIGHT_DECAY
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimiser, T_max=args.epochs, eta_min=1e-6)

    best_val_acc = 0.0
    log_rows     = []

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_dl, criterion, optimiser, device)
        val_loss,   val_acc   = evaluate(model, val_dl, criterion, device)
        scheduler.step()

        elapsed = time.time() - t0
        print(
            f"Epoch {epoch:02d}/{args.epochs} | "
            f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
            f"Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}% | "
            f"LR: {scheduler.get_last_lr()[0]:.2e} | "
            f"Time: {elapsed:.1f}s"
        )

        log_rows.append({
            "epoch": epoch, "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 2), "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 2),
        })

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch":      epoch,
                "model_state": model.state_dict(),
                "val_acc":    val_acc,
                "classes":    classes,
            }, CHECKPOINT_DIR / "best_model.pth")
            print(f"  ✓ New best model saved (val_acc={val_acc:.2f}%)")

    # Save training log
    log_path = CHECKPOINT_DIR / "training_log.csv"
    with open(log_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=log_rows[0].keys())
        writer.writeheader()
        writer.writerows(log_rows)

    # Final test evaluation
    print("\n── Test Set Evaluation ──────────────────────────────────")
    checkpoint = torch.load(CHECKPOINT_DIR / "best_model.pth", map_location=device)
    model.load_state_dict(checkpoint["model_state"])
    test_loss, test_acc = evaluate(model, test_dl, criterion, device)
    adj_acc             = adjacent_accuracy(model, test_dl, device)
    print(f"  Test Accuracy (exact) : {test_acc:.2f}%")
    print(f"  Test Accuracy (±1 MST): {adj_acc:.2f}%")
    print(f"  Test Loss             : {test_loss:.4f}")
    print(f"  Best Val Accuracy     : {best_val_acc:.2f}%")
    print(f"\nTraining log saved to  : {log_path}")
    print(f"Best model saved to    : {CHECKPOINT_DIR / 'best_model.pth'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=NUM_EPOCHS)
    args = parser.parse_args()
    main(args)
