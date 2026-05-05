/**
 * skinToneDetection.js
 * Hybrid skin tone pipeline:
 *   1. MediaPipe FaceMesh → 468 landmarks
 *   2. Cheek pixel sampling → average RGB
 *   3. ONNX EfficientNet-B0 → MST class probabilities
 *   4. CIEDE2000 colour fallback if ONNX disagrees by > 3 MST indices
 *   5. HSL hue → undertone (warm / neutral / cool)
 *
 * All canvas contexts use { willReadFrequently: true } per browser spec.
 * A promise-lock prevents MediaPipe double-initialisation.
 */

import * as ort from 'onnxruntime-web';
import { MST_REFERENCE, MODEL_CONFIG, LANDMARKS } from '@utils/constants';
import { rgbToLab, labToMst, classifyUndertone } from '@utils/colorUtils';

// ── WASM paths — served locally from public/onnx/ (no internet required) ─────
ort.env.wasm.wasmPaths = '/onnx/';

// ── MediaPipe singleton promise-lock ──────────────────────────────────────────
let faceMeshInstance = null;
let faceMeshInitialising = null;

async function getFaceMesh() {
  if (faceMeshInstance) return faceMeshInstance;
  if (faceMeshInitialising) return faceMeshInitialising;

  faceMeshInitialising = new Promise((resolve, reject) => {
    // Dynamic import keeps MediaPipe out of the initial bundle
    import('@mediapipe/face_mesh').then(({ FaceMesh }) => {
      const fm = new FaceMesh({
        locateFile: (file) => `/mediapipe/${file}`,
      });

      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      fm.onResults((results) => {
        fm._lastResults = results;
      });

      fm.initialize()
        .then(() => {
          faceMeshInstance = fm;
          resolve(fm);
        })
        .catch(reject);
    }).catch(reject);
  });

  return faceMeshInitialising;
}

// ── ONNX session singleton ────────────────────────────────────────────────────
let onnxSession = null;

async function getOnnxSession() {
  if (onnxSession) return onnxSession;
  onnxSession = await ort.InferenceSession.create(MODEL_CONFIG.PATH, {
    executionProviders: ['wasm'],
  });
  return onnxSession;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Draw bitmap to an offscreen canvas and return { ctx, canvas, w, h } */
function bitmapToCanvas(bitmap) {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  return { ctx, canvas, w: bitmap.width, h: bitmap.height };
}

/**
 * Sample pixel colours at normalised (x,y) landmark coordinates,
 * skip near-edge points, return averaged {r,g,b}.
 */
function sampleLandmarkRegion(ctx, w, h, points) {
  let r = 0, g = 0, b = 0, n = 0;
  const margin = 2;
  for (const pt of points) {
    const px = Math.round(pt.x * w);
    const py = Math.round(pt.y * h);
    if (px < margin || py < margin || px >= w - margin || py >= h - margin) continue;
    const [pr, pg, pb] = ctx.getImageData(px, py, 1, 1).data;
    r += pr; g += pg; b += pb; n++;
  }
  if (n === 0) return null;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

/** Preprocess bitmap to a flat Float32 tensor [1, 3, 224, 224] */
function preprocessBitmap(bitmap) {
  const size = MODEL_CONFIG.INPUT_SIZE;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const [mr, mg, mb] = MODEL_CONFIG.MEAN;
  const [sr, sg, sb] = MODEL_CONFIG.STD;
  const tensor = new Float32Array(3 * size * size);

  for (let i = 0; i < size * size; i++) {
    tensor[i]                  = (data[i * 4]     / 255 - mr) / sr; // R
    tensor[size * size + i]    = (data[i * 4 + 1] / 255 - mg) / sg; // G
    tensor[2 * size * size + i]= (data[i * 4 + 2] / 255 - mb) / sb; // B
  }
  return tensor;
}

/** Softmax over a Float32Array */
function softmax(arr) {
  const max = Math.max(...arr);
  const exps = Array.from(arr).map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

/**
 * Run ONNX EfficientNet-B0 on the bitmap.
 * Returns { mstIndex: 1-10, confidence: 0-100 }
 */
async function runOnnx(bitmap) {
  const session = await getOnnxSession();
  const data = preprocessBitmap(bitmap);
  const size = MODEL_CONFIG.INPUT_SIZE;
  const inputTensor = new ort.Tensor('float32', data, [1, 3, size, size]);
  const feeds = { [MODEL_CONFIG.INPUT_NAME]: inputTensor };
  const results = await session.run(feeds);
  const logits = results[MODEL_CONFIG.OUTPUT_NAME].data;
  const probs = softmax(logits);
  const best = probs.reduce((iMax, v, i, a) => (v > a[iMax] ? i : iMax), 0);
  return {
    mstIndex: best + 1, // classes are 0-indexed → MST 1-10
    confidence: Math.round(probs[best] * 100),
  };
}


// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Detect skin tone from an ImageBitmap.
 * @param {ImageBitmap} bitmap
 * @returns {Promise<{ok,mstIndex,mstLabel,undertone,dominantHex,confidence,landmarks}>}
 */
export async function detectSkinTone(bitmap) {
  try {
    // ── Step 1: MediaPipe FaceMesh ────────────────────────────────────────────
    const fm = await getFaceMesh();

    // Convert bitmap → HTMLImageElement for MediaPipe
    const { ctx, w, h } = bitmapToCanvas(bitmap);

    // Render to a real (visible/offscreen) canvas so MediaPipe can send() it
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });
    tmpCtx.drawImage(bitmap, 0, 0);

    // MediaPipe send() is async but fires onResults synchronously
    await fm.send({ image: tmpCanvas });
    const results = fm._lastResults;

    if (!results?.multiFaceLandmarks?.[0]) {
      return { ok: false, error: 'No face detected. Please use a clear, front-facing photo.' };
    }

    const raw = results.multiFaceLandmarks[0]; // array of {x,y,z}

    // Build named landmark groups for tryOnRenderer
    const landmarks = {
      LEFT_CHEEK:          LANDMARKS.LEFT_CHEEK.map((i) => raw[i]),
      RIGHT_CHEEK:         LANDMARKS.RIGHT_CHEEK.map((i) => raw[i]),
      LIPS_OUTER:          LANDMARKS.LIPS_OUTER.map((i) => raw[i]),
      LIPS_INNER:          LANDMARKS.LIPS_INNER.map((i) => raw[i]),
      LEFT_EYE:            LANDMARKS.LEFT_EYE.map((i) => raw[i]),
      RIGHT_EYE:           LANDMARKS.RIGHT_EYE.map((i) => raw[i]),
      LEFT_BLUSH_CENTER:   LANDMARKS.LEFT_BLUSH_CENTER.map((i) => raw[i]),
      RIGHT_BLUSH_CENTER:  LANDMARKS.RIGHT_BLUSH_CENTER.map((i) => raw[i]),
    };

    // ── Step 2: Cheek pixel sampling → dominant RGB ───────────────────────────
    const leftSample  = sampleLandmarkRegion(ctx, w, h, landmarks.LEFT_CHEEK);
    const rightSample = sampleLandmarkRegion(ctx, w, h, landmarks.RIGHT_CHEEK);

    let dominantRgb = { r: 180, g: 140, b: 110 }; // fallback neutral
    if (leftSample && rightSample) {
      dominantRgb = {
        r: Math.round((leftSample.r + rightSample.r) / 2),
        g: Math.round((leftSample.g + rightSample.g) / 2),
        b: Math.round((leftSample.b + rightSample.b) / 2),
      };
    } else if (leftSample) {
      dominantRgb = leftSample;
    } else if (rightSample) {
      dominantRgb = rightSample;
    }

    const dominantHex = `#${[dominantRgb.r, dominantRgb.g, dominantRgb.b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')}`;

    // Colour-based MST index via CIEDE2000 (labToMst returns the MST_REFERENCE entry)
    const dominantLab    = rgbToLab(dominantRgb.r, dominantRgb.g, dominantRgb.b);
    const colourMstEntry = labToMst(dominantLab);
    const colourMstIndex = colourMstEntry?.index ?? 5;

    // ── Step 3: ONNX inference ────────────────────────────────────────────────
    let onnxMstIndex = colourMstIndex;
    let confidence   = 72; // fallback confidence

    try {
      const onnxResult = await runOnnx(bitmap);
      onnxMstIndex = onnxResult.mstIndex;
      confidence   = onnxResult.confidence;
    } catch (onnxErr) {
      console.warn('[ShadeSense] ONNX inference failed, falling back to colour-based:', onnxErr);
    }

    // ── Step 4: Sanity check — use colour result if they disagree > 3 indices ─
    const finalMstIndex = Math.abs(onnxMstIndex - colourMstIndex) > 3
      ? colourMstIndex
      : onnxMstIndex;

    const mstEntry = MST_REFERENCE.find((t) => t.index === finalMstIndex)
      ?? MST_REFERENCE[4]; // fallback MST-05

    // ── Step 5: Undertone — classifyUndertone(hex) from colorUtils ──────────
    const undertone = classifyUndertone(dominantHex);

    // Clamp confidence: if colour fallback was used, cap at 72
    const finalConfidence = Math.abs(onnxMstIndex - colourMstIndex) > 3
      ? Math.min(confidence, 72)
      : confidence;

    return {
      ok: true,
      mstIndex:    mstEntry.index,
      mstLabel:    mstEntry.label,
      undertone,
      dominantHex,
      confidence:  finalConfidence,
      landmarks,
    };
  } catch (err) {
    return { ok: false, error: err.message || 'Skin tone detection failed. Please try again.' };
  }
}
