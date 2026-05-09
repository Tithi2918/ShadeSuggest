/**
 * skinToneDetection.js
 * Hybrid skin tone pipeline:
 *   1. MediaPipe FaceMesh → 468 landmarks (lazy-init on first send())
 *   2. Cheek pixel sampling → dominant RGB
 *   3. ONNX EfficientNet-B0 → MST class probabilities
 *   4. CIEDE2000 colour fallback if ONNX disagrees by > 3 MST indices
 *   5. HSL hue → undertone via colorUtils.classifyUndertone(hex)
 *
 * All canvas contexts use { willReadFrequently: true }.
 * A promise-lock prevents MediaPipe double-initialisation.
 * A 15s timeout prevents hanging if WASM fails to load.
 */

import * as ort from 'onnxruntime-web';
import { MST_REFERENCE, MODEL_CONFIG, LANDMARKS } from '@utils/constants';
import { rgbToLab, labToMst, classifyUndertone } from '@utils/colorUtils';

// ── ONNX WASM paths — served from public/onnx/ (no CDN required) ─────────────
ort.env.wasm.wasmPaths = '/onnx/';

// ── MediaPipe singleton ───────────────────────────────────────────────────────
// NOTE: @mediapipe/face_mesh@0.4.x does NOT have initialize().
// Initialisation (WASM loading) happens lazily on the FIRST call to send().
let faceMeshPromise = null;

function getFaceMesh() {
  if (faceMeshPromise) return faceMeshPromise;

  faceMeshPromise = (async () => {
    const { FaceMesh } = await import('@mediapipe/face_mesh');
    const fm = new FaceMesh({
      locateFile: (file) => `/mediapipe/${file}`,
    });
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    // initialize() exists in 0.4.x and pre-loads WASM + model data
    // so the first send() doesn't race against WASM compilation.
    await fm.initialize();
    return fm;
  })();

  return faceMeshPromise;
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

/** Wrap a promise with a timeout; rejects with message on expiry. */
function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
}

/**
 * Sample pixel colours at normalised (x,y) landmark coords,
 * skip near-edge points, return averaged { r, g, b }.
 */
function sampleLandmarkRegion(ctx, w, h, points) {
  let r = 0, g = 0, b = 0, n = 0;
  const margin = 2;
  for (const pt of points) {
    const px = Math.round(pt.x * w);
    const py = Math.round(pt.y * h);
    if (px < margin || py < margin || px >= w - margin || py >= h - margin) continue;
    const d = ctx.getImageData(px, py, 1, 1).data;
    r += d[0]; g += d[1]; b += d[2]; n++;
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
    tensor[i]                   = (data[i * 4]     / 255 - mr) / sr;
    tensor[size * size + i]     = (data[i * 4 + 1] / 255 - mg) / sg;
    tensor[2 * size * size + i] = (data[i * 4 + 2] / 255 - mb) / sb;
  }
  return tensor;
}

/** Softmax over a Float32Array → probability distribution */
function softmax(arr) {
  const max = Math.max(...arr);
  const exps = Array.from(arr).map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

/** Run ONNX → { mstIndex: 1-10, confidence: 0-100 } */
async function runOnnx(bitmap) {
  const session = await getOnnxSession();
  const size = MODEL_CONFIG.INPUT_SIZE;
  const data = preprocessBitmap(bitmap);
  const inputTensor = new ort.Tensor('float32', data, [1, 3, size, size]);
  const results = await session.run({ [MODEL_CONFIG.INPUT_NAME]: inputTensor });
  const probs = softmax(results[MODEL_CONFIG.OUTPUT_NAME].data);
  const best = probs.reduce((iMax, v, i, a) => (v > a[iMax] ? i : iMax), 0);
  return { mstIndex: best + 1, confidence: Math.round(probs[best] * 100) };
}

/** Pure colour-based MST via CIEDE2000 — used when MediaPipe or ONNX fails */
function colourBasedMst(r, g, b) {
  const lab   = rgbToLab(r, g, b);
  const entry = labToMst(lab);
  return entry?.index ?? 5;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Detect skin tone from an ImageBitmap.
 * @param {ImageBitmap} bitmap
 * @returns {Promise<{ok,mstIndex,mstLabel,undertone,dominantHex,confidence,landmarks}>}
 */
export async function detectSkinTone(bitmap) {
  try {
    // ── Step 1: MediaPipe FaceMesh ─────────────────────────────────────────
    let rawLandmarks = null;
    let landmarks   = null;

    try {
      const fm = await withTimeout(
        getFaceMesh(),
        10000,
        'MediaPipe failed to load.',
      );

      // Scale image down to max 640px — MediaPipe processes faster on smaller images
      const MAX_DIM = 640;
      const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
      const sw = Math.round(bitmap.width  * scale);
      const sh = Math.round(bitmap.height * scale);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width  = sw;
      tmpCanvas.height = sh;
      tmpCanvas.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, 0, sw, sh);

      // Wrap onResults in a Promise — send() resolves BEFORE onResults fires in v0.4
      rawLandmarks = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          fm.onResults(() => {}); // detach
          resolve(null);
        }, 30000);

        fm.onResults((results) => {
          clearTimeout(timer);
          fm.onResults(() => {}); // detach for GC
          resolve(results?.multiFaceLandmarks?.[0] ?? null);
        });

        fm.send({ image: tmpCanvas }).catch(() => {
          clearTimeout(timer);
          resolve(null);
        });
      });

      if (rawLandmarks) {
        landmarks = {
          LEFT_CHEEK:          LANDMARKS.LEFT_CHEEK.map((i) => rawLandmarks[i]),
          RIGHT_CHEEK:         LANDMARKS.RIGHT_CHEEK.map((i) => rawLandmarks[i]),
          LIPS_OUTER:          LANDMARKS.LIPS_OUTER.map((i) => rawLandmarks[i]),
          LIPS_INNER:          LANDMARKS.LIPS_INNER.map((i) => rawLandmarks[i]),
          LEFT_EYE:            LANDMARKS.LEFT_EYE.map((i) => rawLandmarks[i]),
          RIGHT_EYE:           LANDMARKS.RIGHT_EYE.map((i) => rawLandmarks[i]),
          LEFT_BLUSH_CENTER:   LANDMARKS.LEFT_BLUSH_CENTER.map((i) => rawLandmarks[i]),
          RIGHT_BLUSH_CENTER:  LANDMARKS.RIGHT_BLUSH_CENTER.map((i) => rawLandmarks[i]),
        };
      }
    } catch (mpErr) {
      console.warn('[ShadeSense] MediaPipe:', mpErr.message);
    }

    // ── Step 2: Dominant skin RGB ──────────────────────────────────────────
    let dominantRgb = null;

    if (landmarks) {
      // Sample cheek pixels using MediaPipe landmarks
      const { ctx, w, h } = (() => {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const c = canvas.getContext('2d', { willReadFrequently: true });
        c.drawImage(bitmap, 0, 0);
        return { ctx: c, w: bitmap.width, h: bitmap.height };
      })();

      const left  = sampleLandmarkRegion(ctx, w, h, landmarks.LEFT_CHEEK);
      const right = sampleLandmarkRegion(ctx, w, h, landmarks.RIGHT_CHEEK);

      if (left && right) {
        dominantRgb = {
          r: Math.round((left.r + right.r) / 2),
          g: Math.round((left.g + right.g) / 2),
          b: Math.round((left.b + right.b) / 2),
        };
      } else if (left || right) {
        dominantRgb = left ?? right;
      }
    }

    if (!dominantRgb) {
      // Fallback: Sample the center 20% of the image (assuming a selfie)
      const { ctx, w, h } = (() => {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const c = canvas.getContext('2d', { willReadFrequently: true });
        c.drawImage(bitmap, 0, 0);
        return { ctx: c, w: bitmap.width, h: bitmap.height };
      })();

      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const radius = Math.floor(Math.min(w, h) * 0.1); // 10% radius = 20% width/height region
      
      try {
        const imgData = ctx.getImageData(cx - radius, cy - radius, radius * 2, radius * 2).data;
        let r = 0, g = 0, b = 0;
        const numPixels = imgData.length / 4;
        
        for (let i = 0; i < imgData.length; i += 4) {
          r += imgData[i];
          g += imgData[i + 1];
          b += imgData[i + 2];
        }
        
        if (numPixels > 0) {
          dominantRgb = {
            r: Math.round(r / numPixels),
            g: Math.round(g / numPixels),
            b: Math.round(b / numPixels),
          };
        }
      } catch (e) {
        console.warn('[ShadeSense] Center crop failed:', e);
      }
    }

    // Ultimate safety fallback if all sampling fails
    if (!dominantRgb) {
      dominantRgb = { r: 180, g: 140, b: 110 }; 
    }

    const dominantHex = `#${[dominantRgb.r, dominantRgb.g, dominantRgb.b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')}`;

    // Colour-based MST (CIEDE2000)
    const colourMstIndex = colourBasedMst(dominantRgb.r, dominantRgb.g, dominantRgb.b);

    // ── Step 3: ONNX inference ─────────────────────────────────────────────
    let onnxMstIndex = colourMstIndex;
    let confidence   = 68; // conservative fallback

    try {
      const onnxResult = await withTimeout(
        runOnnx(bitmap),
        15000,
        'ONNX inference timed out.',
      );
      onnxMstIndex = onnxResult.mstIndex;
      confidence   = onnxResult.confidence;
    } catch (onnxErr) {
      console.warn('[ShadeSense] ONNX:', onnxErr.message);
    }

    // ── Step 4: Sanity check ───────────────────────────────────────────────
    // If ONNX and colour disagree by > 3 MST indices, trust the colour result
    const usedFallback  = Math.abs(onnxMstIndex - colourMstIndex) > 3;
    const finalMstIndex = usedFallback ? colourMstIndex : onnxMstIndex;
    const finalConfidence = usedFallback ? Math.min(confidence, 72) : confidence;

    const mstEntry = MST_REFERENCE.find((t) => t.index === finalMstIndex)
      ?? MST_REFERENCE[4]; // fallback MST-05

    // ── Step 5: Undertone ──────────────────────────────────────────────────
    const undertone = classifyUndertone(dominantHex);

    return {
      ok:          true,
      mstIndex:    mstEntry.index,
      mstLabel:    mstEntry.label,
      undertone,
      dominantHex,
      confidence:  finalConfidence,
      landmarks,   // null if MediaPipe failed (try-on will be disabled)
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Skin tone detection failed. Please try again.',
    };
  }
}
