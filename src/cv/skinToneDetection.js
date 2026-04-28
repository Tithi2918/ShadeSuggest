// STUB — will be replaced by teammate's real EfficientNet-B0 ONNX inference.
// Honors the documented return shape:
// { ok, mstIndex, mstLabel, undertone, dominantHex, confidence, landmarks }
import { MST_REFERENCE } from '@utils/constants';

/**
 * Detect skin tone from an ImageBitmap.
 * @param {ImageBitmap} bitmap
 * @returns {Promise<{ ok: boolean, mstIndex: number, mstLabel: string, undertone: string, dominantHex: string, confidence: number, landmarks: object }>}
 */
export async function detectSkinTone(bitmap) {
  // Simulate ML pipeline latency
  await new Promise((r) => setTimeout(r, 1500));

  // Pick a deterministic-ish tone based on bitmap dimensions
  const idx = (bitmap.width * bitmap.height) % MST_REFERENCE.length;
  const tone = MST_REFERENCE[idx];

  // Stub landmarks (MediaPipe face mesh points as normalised [x, y] pairs)
  const landmarks = {
    LEFT_CHEEK:  [{ x: 0.32, y: 0.52 }],
    RIGHT_CHEEK: [{ x: 0.68, y: 0.52 }],
    LIPS_OUTER:  [{ x: 0.50, y: 0.70 }],
    LIPS_INNER:  [{ x: 0.50, y: 0.69 }],
    LEFT_BLUSH_CENTER:  [{ x: 0.28, y: 0.55 }],
    RIGHT_BLUSH_CENTER: [{ x: 0.72, y: 0.55 }],
  };

  return {
    ok: true,
    mstIndex: tone.index,
    mstLabel: tone.label,
    undertone: tone.undertone,
    dominantHex: tone.hex,
    confidence: Math.floor(78 + Math.random() * 18), // 78–95
    landmarks,
  };
}
