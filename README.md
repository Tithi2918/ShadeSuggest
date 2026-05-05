<div align="center">

<img src="public/shadesense-logo.png" alt="ShadeSense Logo" width="80" height="80" />

# ShadeSense

**AI-powered skin tone detection & personalised makeup shade recommendations**

[![MIT License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-yellow?logo=vite)](https://vitejs.dev)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime_Web-1.25-green)](https://onnxruntime.ai)
[![MediaPipe](https://img.shields.io/badge/MediaPipe_FaceMesh-0.4-red)](https://developers.google.com/mediapipe)

*Your photo never leaves your device.*

[Live Demo](#) · [Report a Bug](https://github.com/Tithi2918/ShadeSuggest/issues) · [Request a Feature](https://github.com/Tithi2918/ShadeSuggest/issues)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [How It Works](#how-it-works)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Local Asset Setup (WASM)](#local-asset-setup-wasm)
8. [Architecture Deep Dive](#architecture-deep-dive)
9. [Product Catalogue](#product-catalogue)
10. [ML Model](#ml-model)
11. [Contributing](#contributing)
12. [Licence](#licence)

---

## Overview

**ShadeSense** is a fully client-side, privacy-first web application that analyses a user's skin tone from a selfie and recommends real makeup shades from **MAC**, **Maybelline**, **L'Oréal**, and **Rare Beauty**. All CV inference runs in the browser via WebAssembly — no image is ever uploaded to a server.

The pipeline fuses two complementary AI approaches:

| Layer | Technology | Purpose |
|---|---|---|
| Facial landmark detection | MediaPipe FaceMesh (WASM) | Locate cheek regions for accurate skin sampling |
| Skin tone classification | EfficientNet-B0 (ONNX) | Map skin tone to the Monk Skin Tone (MST) scale |
| Colour fallback | CIEDE2000 ΔE | Robust classification when model confidence is low |
| Undertone analysis | HSL hue analysis | Warm / Cool / Neutral undertone detection |

---

## Features

- 📸 **Selfie upload** — drag-and-drop or file picker, JPEG/PNG/WEBP
- 🤖 **On-device AI inference** — EfficientNet-B0 quantised to 4.7 MB, running via ONNX Runtime Web
- 🎭 **Face mesh landmark extraction** — MediaPipe FaceMesh with 468 landmarks, served from local WASM (no CDN)
- 🎨 **Monk Skin Tone Scale** — classification into 10 MST levels (MST-01 to MST-10)
- 🌡️ **Undertone detection** — warm, cool, or neutral, derived from HSL hue of dominant skin pixel
- 💄 **Personalised shade catalogue** — filtered by MST level, undertone, and brand
- 🏷️ **Brand filters** — one-click filter by MAC, Maybelline, L'Oréal, Rare Beauty
- 🕒 **Analysis history** — localStorage-persisted past results with one-click restore
- ⚡ **Zero network dependency** — WASM, model files, and product catalogue all served locally
- 📱 **Responsive UI** — works on mobile and desktop

---

## How It Works

```
User uploads selfie
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│               STEP 1 — Image Ingestion                  │
│  ImageBitmap created from File (stays in-memory)        │
│  DataURL generated for preview only                     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│          STEP 2 — MediaPipe FaceMesh (WASM)             │
│  Image scaled to max 640px → sent to FaceMesh           │
│  468 facial landmarks extracted                         │
│  Cheek landmark indices sampled for skin RGB            │
│  [Falls back to centre-crop if face not detected]       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         STEP 3 — ONNX EfficientNet-B0 Inference         │
│  Image resized to 224×224, normalised (ImageNet stats)  │
│  Model outputs 10-class softmax (MST-01 to MST-10)      │
│  Best class + confidence extracted                      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│       STEP 4 — CIEDE2000 Sanity Check (Fallback)        │
│  If ONNX confidence < threshold OR |ONNX − colour| > 3  │
│  → use colour-based MST (CIEDE2000 ΔE matching)         │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│          STEP 5 — Recommendation Engine                 │
│  Filter product catalogue by MST level + undertone      │
│  Score products (exact undertone match = 2, neutral = 1)│
│  Return ranked lists for Foundation, Blush, Lipstick    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
                   Results Page
         Skin tone card + brand-filtered product grid
```

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **Routing** | React Router DOM v6 |
| **Styling** | Tailwind CSS v3 |
| **ML Inference** | ONNX Runtime Web 1.25 (WASM backend) |
| **Face Detection** | @mediapipe/face_mesh 0.4 (WASM, served locally) |
| **State Management** | React `useReducer` + Context API |
| **Storage** | localStorage (analysis history) |
| **Testing** | Vitest + Testing Library |
| **Linting** | ESLint 10 + Prettier |

---

## Project Structure

```
ShadeSuggest/
├── public/
│   ├── models/
│   │   └── shades/            # EfficientNet-B0 ONNX model + metadata
│   │       ├── model.onnx
│   │       └── model_metadata.json
│   ├── mediapipe/             # MediaPipe FaceMesh WASM assets (local)
│   │   ├── face_mesh.js
│   │   ├── face_mesh_solution_simd_wasm_bin.js
│   │   ├── face_mesh_solution_simd_wasm_bin.wasm
│   │   ├── face_mesh_solution_packed_assets_loader.js
│   │   └── face_mesh_solution_packed_assets.data
│   ├── onnx/                  # ONNX Runtime WASM binaries (local)
│   │   ├── ort-wasm.wasm
│   │   └── ort-wasm-simd.wasm
│   └── products.json          # Static makeup product catalogue (120 shades)
│
├── src/
│   ├── components/
│   │   ├── Header.jsx         # Sticky nav with RESET-aware "Analyse My Skin" CTA
│   │   ├── UploadPanel.jsx    # Drag-and-drop file ingestion
│   │   ├── AnalysisPanel.jsx  # Orchestrates CV pipeline, shows progress
│   │   ├── ResultsPanel.jsx   # Skin tone card + brand-filtered product grid
│   │   ├── ProductCard.jsx    # Individual shade card with compatibility badge
│   │   └── HistoryCard.jsx    # Past analysis entry
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx    # Marketing page with scroll animations
│   │   ├── AppPage.jsx        # Step router (Upload → Analysing → Results)
│   │   └── HistoryPage.jsx    # Past analyses with one-click restore
│   │
│   ├── cv/
│   │   ├── skinToneDetection.js   # Full hybrid detection pipeline
│   │   ├── imageIngestion.js      # File → ImageBitmap
│   │   └── tryOnRenderer.js       # (Retained for future use)
│   │
│   ├── engine/
│   │   └── recommendationEngine.js # MST + undertone → product recommendations
│   │
│   ├── state/
│   │   └── AppState.jsx        # Global reducer + context (UPLOAD/ANALYSING/RESULTS)
│   │
│   ├── utils/
│   │   ├── constants.js        # MST_REFERENCE, LANDMARKS, MODEL_CONFIG
│   │   ├── colorUtils.js       # RGB→LAB, CIEDE2000, HSL undertone classifier
│   │   └── historyStore.js     # localStorage read/write helpers
│   │
│   └── hooks/
│       └── useInView.js        # Intersection observer for scroll animations
│
├── ml/                         # Model training artefacts (see ml/README.md)
├── docs/                       # Design docs and architecture notes
├── tests/                      # Vitest unit tests
└── vite.config.js              # Vite config with MediaPipe WASM exclusion
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Tithi2918/ShadeSuggest.git
cd ShadeSuggest

# 2. Install dependencies
npm install

# 3. Copy WASM binary assets to public/ (required for offline inference)
npm run copy-wasm

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome (recommended for best WASM performance).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint across `src/` |
| `npm run format` | Auto-format `src/` with Prettier |
| `npm run test` | Run Vitest unit tests |
| `npm run copy-wasm` | Copy ONNX and MediaPipe WASM binaries to `public/` |

---

## Local Asset Setup (WASM)

ShadeSense runs **entirely offline** — no CDN requests are made at runtime. All binary assets must be present in `public/` before starting the dev server.

The `npm run copy-wasm` script handles this automatically:

```bash
npm run copy-wasm
# Copies:
#   node_modules/onnxruntime-web/dist/*.wasm → public/onnx/
#   node_modules/@mediapipe/face_mesh/face_mesh*.{js,wasm,data,binarypb} → public/mediapipe/
```

> **Important:** `public/mediapipe/` and `public/onnx/` are `.gitignore`-d because the files are large binary blobs. Run `npm run copy-wasm` after every `npm install`.

---

## Architecture Deep Dive

### State Machine

The application follows a three-step linear flow managed by `useReducer`:

```
UPLOAD  ──(ANALYSIS_START)──▶  ANALYSING  ──(ANALYSIS_COMPLETE)──▶  RESULTS
  ▲                                                                      │
  └──────────────────────(RESET / RESTORE_HISTORY)──────────────────────┘
```

Key actions:

| Action | Description |
|---|---|
| `UPLOAD_SUCCESS` | Stores `imageFile`, `dataUrl`, `bitmap` |
| `ANALYSIS_START` | Transitions to `ANALYSING` step |
| `ANALYSIS_COMPLETE` | Stores MST result, undertone, landmarks, recommendations |
| `RESTORE_HISTORY` | Atomically restores a past analysis (single dispatch, no flash) |
| `RESET` | Returns to initial upload state |

### CV Pipeline (`src/cv/skinToneDetection.js`)

The detection pipeline is intentionally **fault-tolerant** — each layer degrades gracefully:

```
MediaPipe FaceMesh
  ├─ Success → sample cheek landmarks for dominant RGB
  └─ Fail    → centre-crop sampling fallback

ONNX EfficientNet-B0
  ├─ Success + high confidence → use model MST class
  └─ Fail / low confidence    → CIEDE2000 colour-based MST

Undertone
  └─ Always derived from dominant RGB HSL hue (warm/cool/neutral)
```

**MediaPipe initialisation notes:**
- `@mediapipe/face_mesh` is excluded from Vite's esbuild pre-bundling (`optimizeDeps.exclude`) to prevent transformation of its `typeof window` runtime checks
- `.wasm` files are served with `Content-Type: application/wasm` via a custom Vite middleware
- `fm.initialize()` is called before the first `send()` to pre-load WASM and model data

### Recommendation Engine (`src/engine/recommendationEngine.js`)

Products are scored and filtered on two dimensions:

1. **MST range match** — each product specifies a range of compatible MST levels
2. **Undertone compatibility** — exact undertone match scores 2, neutral match scores 1

Products are returned ranked by compatibility score, then alphabetically.

---

## Product Catalogue

`public/products.json` contains **120 real makeup shades** across three categories:

| Category | Brands | Shades |
|---|---|---|
| Foundation | MAC, Maybelline, L'Oréal, Rare Beauty | 40 |
| Blush | MAC, Maybelline, Rare Beauty | 40 |
| Lipstick | MAC, Maybelline, L'Oréal, Rare Beauty | 40 |

Each product entry includes:

```jsonc
{
  "id": "mac-foundation-nw15",
  "brand": "MAC",
  "product_name": "Studio Fix Fluid",
  "shade_name": "NW15",
  "category": "foundation",
  "hex_code": "#E8C9A0",
  "undertone": "warm",
  "finish": "matte",
  "mst_min": 2,
  "mst_max": 4,
  "price_usd": 35.00,
  "purchase_url": "https://www.maccosmetics.com/..."
}
```

---

## ML Model

The skin tone classifier is an **EfficientNet-B0** fine-tuned on a subset of the [UTKFace](https://susanqq.github.io/UTKFace/) dataset.

| Property | Value |
|---|---|
| Architecture | EfficientNet-B0 |
| Dataset | UTKFace (23,700 images, balanced sampling) |
| Output classes | 10 (MST-01 to MST-10) |
| Input size | 224 × 224 |
| Normalisation | ImageNet mean/std |
| Original size | 18 MB (PyTorch) |
| Exported size | 4.7 MB (ONNX, INT8 quantised) |
| Validation accuracy | ~79% on held-out MST distribution |

Model files are located at `public/models/shades/`. See `ml/` for training scripts and `public/models/model_metadata.json` for inference parameters.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Run `npm run copy-wasm` after `npm install`
4. Make your changes and add tests where appropriate
5. Ensure lint passes: `npm run lint`
6. Commit with a conventional commit message: `git commit -m "feat: describe your change"`
7. Open a Pull Request targeting `main`

### Branch Conventions

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `backend/ml-pipeline` | CV engine and ML model work |
| `frontend/ui` | UI component development |
| `integration/main` | Integration branch (merged into main) |

---

## Licence

This project is licensed under the **MIT Licence** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the ShadeSense team</p>
  <p><em>Your photo never leaves your device.</em></p>
</div>
