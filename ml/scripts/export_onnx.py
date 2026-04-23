"""
export_onnx.py
Loads the best trained checkpoint and exports it to ONNX format
for use with onnxruntime-web in the browser.
Output:
  ml/exports/shadesense_skin_tone.onnx
  ml/exports/model_metadata.json
"""

import json
from pathlib import Path

import torch
import torch.nn as nn
import timm
import onnx
import onnxruntime as ort
import numpy as np

CHECKPOINT_DIR = Path("ml/checkpoints")
EXPORT_DIR     = Path("ml/exports")
EXPORT_DIR.mkdir(parents=True, exist_ok=True)

NUM_CLASSES  = 10
IMG_SIZE     = 224
EXPORT_PATH  = EXPORT_DIR / "shadesense_skin_tone.onnx"
META_PATH    = EXPORT_DIR / "model_metadata.json"

MST_LABELS = [f"MST-{i:02d}" for i in range(1, NUM_CLASSES + 1)]

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

def build_model(num_classes=NUM_CLASSES):
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=0)
    in_features = model.num_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(512, num_classes),
    )
    return model

def export():
    print("ShadeSense — ONNX Export")
    print("=" * 50)

    device     = torch.device("cpu")
    checkpoint = torch.load(CHECKPOINT_DIR / "best_model.pth", map_location=device)

    model = build_model()
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    print(f"Loaded checkpoint — val_acc: {checkpoint['val_acc']:.2f}%")

    # Dummy input for tracing
    dummy_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)

    # Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        str(EXPORT_PATH),
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input":  {0: "batch_size"},
            "output": {0: "batch_size"},
        },
    )

    print(f"ONNX model exported to: {EXPORT_PATH}")

    # Validate ONNX model
    onnx_model = onnx.load(str(EXPORT_PATH))
    onnx.checker.check_model(onnx_model)
    print("ONNX model validation: PASSED")

    # Verify output with onnxruntime
    session   = ort.InferenceSession(str(EXPORT_PATH))
    dummy_np  = dummy_input.numpy()
    outputs   = session.run(None, {"input": dummy_np})
    logits    = outputs[0]
    predicted = int(np.argmax(logits, axis=1)[0])
    print(f"ORT inference test: predicted class index = {predicted} ({MST_LABELS[predicted]})")

    # Save metadata
    metadata = {
        "model_name":    "shadesense_skin_tone",
        "architecture":  "efficientnet_b0",
        "num_classes":   NUM_CLASSES,
        "input_size":    [1, 3, IMG_SIZE, IMG_SIZE],
        "input_name":    "input",
        "output_name":   "output",
        "classes":       MST_LABELS,
        "imagenet_mean": IMAGENET_MEAN,
        "imagenet_std":  IMAGENET_STD,
        "val_accuracy":  checkpoint["val_acc"],
        "trained_epoch": checkpoint["epoch"],
        "opset_version": 17,
    }

    with open(META_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model metadata saved to: {META_PATH}")

    # Model size
    size_mb = EXPORT_PATH.stat().st_size / (1024 * 1024)
    print(f"Model size: {size_mb:.2f} MB")
    print("\nExport complete. Copy the following to your frontend:")
    print(f"  {EXPORT_PATH.resolve()}")
    print(f"  {META_PATH.resolve()}")
    print("  → place both in: public/models/")

if __name__ == "__main__":
    export()
