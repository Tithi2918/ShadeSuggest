/**
 * tryOnRenderer.js
 * Canvas-based makeup overlay using MediaPipe landmarks.
 *
 * Lips:  polygon from LIPS_OUTER clipped with LIPS_INNER cut-out,
 *        painted with 'multiply' blending for a realistic tint.
 *        Gaussian edge softening via canvas shadow + offscreen composition.
 *
 * Blush: radial gradient over LEFT/RIGHT_BLUSH_CENTER landmarks,
 *        painted with 'screen' blending for a natural flush.
 *
 * Falls back to geometric approximation when landmarks are null
 * (e.g. if MediaPipe failed to detect a face).
 *
 * API (unchanged):
 *   renderTryOn({ canvas, bitmap, landmarks, activeShades, opacity? })
 *   exportPreview(canvas) → PNG data URL
 */

import { TRYON_DEFAULTS } from '@utils/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a hex colour string to { r, g, b } (0-255). */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Map an array of normalised landmark points {x, y} → pixel coords [x, y].
 * @param {Array<{x,y}>} points
 * @param {number} w Canvas width
 * @param {number} h Canvas height
 * @returns {Array<[number,number]>}
 */
function toPixels(points, w, h) {
  return points.map((p) => [p.x * w, p.y * h]);
}

/** Draw a closed polygon path from pixel-coord pairs. */
function drawPolygon(ctx, pixelPoints) {
  if (!pixelPoints.length) return;
  ctx.beginPath();
  ctx.moveTo(pixelPoints[0][0], pixelPoints[0][1]);
  for (let i = 1; i < pixelPoints.length; i++) {
    ctx.lineTo(pixelPoints[i][0], pixelPoints[i][1]);
  }
  ctx.closePath();
}

// ── Lip renderer ──────────────────────────────────────────────────────────────

/**
 * Render lipstick using landmark-based polygon clipping with multiply blending.
 * An offscreen canvas is used so we can apply blur before compositing.
 */
function renderLipstick(ctx, w, h, landmarks, shade, opacity) {
  const { r, g, b } = hexToRgb(shade.hex_code);

  if (landmarks?.LIPS_OUTER?.length) {
    // ── Landmark-based path ──────────────────────────────────────────────────
    const outerPx = toPixels(landmarks.LIPS_OUTER, w, h);
    const innerPx = landmarks.LIPS_INNER?.length
      ? toPixels(landmarks.LIPS_INNER, w, h)
      : [];

    // Draw lips on an offscreen canvas with soft edges
    const off = new OffscreenCanvas(w, h);
    const offCtx = off.getContext('2d');

    // Soft shadow for edge blur
    offCtx.shadowColor = `rgba(${r},${g},${b},0.6)`;
    offCtx.shadowBlur = Math.max(w * 0.008, 4); // ~0.8% of width

    offCtx.fillStyle = `rgb(${r},${g},${b})`;

    // Draw outer lip shape
    drawPolygon(offCtx, outerPx);

    // Subtract inner lip (teeth) using even-odd rule
    if (innerPx.length) {
      drawPolygon(offCtx, innerPx);
      offCtx.fill('evenodd');
    } else {
      offCtx.fill();
    }

    // Composite onto main canvas with multiply + target opacity
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  } else {
    // ── Geometric fallback (no landmarks) ───────────────────────────────────
    ctx.save();
    ctx.globalAlpha = opacity * 0.7;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
    ctx.shadowBlur = w * 0.01;
    ctx.beginPath();
    ctx.ellipse(w * 0.50, h * 0.70, w * 0.09, h * 0.028, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Blush renderer ────────────────────────────────────────────────────────────

/**
 * Render blush as a radial gradient over each cheek using screen blending.
 */
function renderBlush(ctx, w, h, landmarks, shade, opacity) {
  const { r, g, b } = hexToRgb(shade.hex_code);
  const radius = w * TRYON_DEFAULTS.BLUSH_RADIUS;

  // Determine cheek center points from landmarks or fallback geometry
  const cheeks = [];

  if (landmarks?.LEFT_BLUSH_CENTER?.length) {
    const pts = landmarks.LEFT_BLUSH_CENTER;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    cheeks.push({ cx: cx * w, cy: cy * h });
  } else {
    cheeks.push({ cx: w * 0.28, cy: h * 0.55 });
  }

  if (landmarks?.RIGHT_BLUSH_CENTER?.length) {
    const pts = landmarks.RIGHT_BLUSH_CENTER;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    cheeks.push({ cx: cx * w, cy: cy * h });
  } else {
    cheeks.push({ cx: w * 0.72, cy: h * 0.55 });
  }

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const { cx, cy } of cheeks) {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.4);
    grad.addColorStop(0,   `rgba(${r},${g},${b},${opacity})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${opacity * 0.5})`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render makeup try-on overlays onto a canvas element.
 *
 * @param {{
 *   canvas:      HTMLCanvasElement,
 *   bitmap:      ImageBitmap,
 *   landmarks:   object | null,
 *   activeShades: { lipstick?: object, blush?: object },
 *   opacity?:    number  (0-1, default from TRYON_DEFAULTS)
 * }} params
 */
export function renderTryOn({
  canvas,
  bitmap,
  landmarks,
  activeShades = {},
  opacity,
}) {
  if (!canvas || !bitmap) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width  = bitmap.width;
  canvas.height = bitmap.height;

  const w = canvas.width;
  const h = canvas.height;

  // Draw base photo
  ctx.drawImage(bitmap, 0, 0);

  if (activeShades.lipstick) {
    const lipOpacity = opacity ?? TRYON_DEFAULTS.LIP_OPACITY;
    renderLipstick(ctx, w, h, landmarks, activeShades.lipstick, lipOpacity);
  }

  if (activeShades.blush) {
    const blushOpacity = opacity ?? TRYON_DEFAULTS.BLUSH_OPACITY;
    renderBlush(ctx, w, h, landmarks, activeShades.blush, blushOpacity);
  }
}

/**
 * Export the canvas as a PNG data URL.
 * @param {HTMLCanvasElement} canvas
 * @returns {string}
 */
export function exportPreview(canvas) {
  return canvas.toDataURL('image/png');
}
