// STUB — will be replaced by teammate's real MediaPipe overlay renderer.
// Honors the documented API:
//   renderTryOn({ canvas, bitmap, landmarks, activeShades })
//   exportPreview(canvas) → string (PNG data URL)
import { TRYON_DEFAULTS } from '@utils/constants';

/**
 * Render a try-on preview onto a canvas element.
 * @param {{ canvas: HTMLCanvasElement, bitmap: ImageBitmap, landmarks: object, activeShades: { lipstick?: object, blush?: object } }} params
 */
export function renderTryOn({ canvas, bitmap, landmarks: _landmarks, activeShades = {} }) { // eslint-disable-line no-unused-vars
  if (!canvas || !bitmap) return;

  const ctx = canvas.getContext('2d');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  // Draw base image
  ctx.drawImage(bitmap, 0, 0);

  const w = canvas.width;
  const h = canvas.height;

  // Lip overlay (stub: filled ellipse over approximate lip region)
  if (activeShades.lipstick) {
    ctx.save();
    ctx.globalAlpha = TRYON_DEFAULTS.LIP_OPACITY;
    ctx.fillStyle = activeShades.lipstick.hex_code;
    ctx.beginPath();
    ctx.ellipse(w * 0.50, h * 0.70, w * 0.08, h * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Blush overlays (left + right cheek)
  if (activeShades.blush) {
    const radius = w * TRYON_DEFAULTS.BLUSH_RADIUS;
    ctx.save();
    ctx.globalAlpha = TRYON_DEFAULTS.BLUSH_OPACITY;
    ctx.fillStyle = activeShades.blush.hex_code;
    // Left cheek
    ctx.beginPath();
    ctx.arc(w * 0.28, h * 0.55, radius, 0, Math.PI * 2);
    ctx.fill();
    // Right cheek
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.55, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Export the current canvas as a PNG data URL.
 * @param {HTMLCanvasElement} canvas
 * @returns {string}
 */
export function exportPreview(canvas) {
  return canvas.toDataURL('image/png');
}
