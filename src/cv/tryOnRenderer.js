/**
 * tryOnRenderer.js
 * Canvas-based makeup overlay.
 *
 * Primary path:  MediaPipe landmark polygon → multiply/screen blending
 * Fallback path: Chrome FaceDetector API → face-relative ellipses
 * Last resort:   fixed proportions (original selfie with face in upper frame)
 *
 * API (unchanged):
 *   renderTryOn({ canvas, bitmap, landmarks, activeShades, opacity?, faceBounds? })
 *   exportPreview(canvas) → PNG data URL
 */

import { TRYON_DEFAULTS } from '@utils/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toPixels(points, w, h) {
  return points.map((p) => [p.x * w, p.y * h]);
}

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

function renderLipstickLandmark(ctx, w, h, landmarks, shade, opacity) {
  const { r, g, b } = hexToRgb(shade.hex_code);
  const outerPx = toPixels(landmarks.LIPS_OUTER, w, h);
  const innerPx = landmarks.LIPS_INNER?.length
    ? toPixels(landmarks.LIPS_INNER, w, h)
    : [];

  const off    = new OffscreenCanvas(w, h);
  const offCtx = off.getContext('2d');
  offCtx.shadowColor = `rgba(${r},${g},${b},0.6)`;
  offCtx.shadowBlur  = Math.max(w * 0.008, 4);
  offCtx.fillStyle   = `rgb(${r},${g},${b})`;

  drawPolygon(offCtx, outerPx);
  if (innerPx.length) {
    drawPolygon(offCtx, innerPx);
    offCtx.fill('evenodd');
  } else {
    offCtx.fill();
  }

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

/**
 * Draw a lip ellipse relative to a face bounding box.
 * faceBounds = { x, y, width, height } in canvas pixels.
 */
function renderLipstickGeometric(ctx, shade, opacity, faceBounds) {
  const { r, g, b } = hexToRgb(shade.hex_code);
  let cx, cy, rx, ry;

  if (faceBounds) {
    // Lips: ~lower 25% of face height, centred horizontally on face
    cx = faceBounds.x + faceBounds.width  * 0.50;
    cy = faceBounds.y + faceBounds.height * 0.80;  // 80% down the face box
    rx = faceBounds.width  * 0.20;
    ry = faceBounds.height * 0.055;
  } else {
    // Absolute last resort — assume face in upper ~60% of a portrait selfie
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    cx = w * 0.50;
    cy = h * 0.42;   // 42% from top, not 70%
    rx = w * 0.09;
    ry = h * 0.022;
  }

  ctx.save();
  ctx.globalAlpha = opacity * 0.75;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle   = `rgb(${r},${g},${b})`;
  ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
  ctx.shadowBlur  = Math.max(cx * 0.015, 6);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Blush renderer ────────────────────────────────────────────────────────────

function renderBlushLandmark(ctx, w, h, landmarks, shade, opacity) {
  const { r, g, b } = hexToRgb(shade.hex_code);
  const radius = w * TRYON_DEFAULTS.BLUSH_RADIUS;

  const getCheekCenter = (pts) => {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { cx: cx * w, cy: cy * h };
  };

  const cheeks = [
    landmarks.LEFT_BLUSH_CENTER?.length  ? getCheekCenter(landmarks.LEFT_BLUSH_CENTER)  : null,
    landmarks.RIGHT_BLUSH_CENTER?.length ? getCheekCenter(landmarks.RIGHT_BLUSH_CENTER) : null,
  ].filter(Boolean);

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

function renderBlushGeometric(ctx, shade, opacity, faceBounds) {
  const { r, g, b } = hexToRgb(shade.hex_code);
  let cheeks;

  if (faceBounds) {
    const { x, y, width, height } = faceBounds;
    const cy = y + height * 0.60;
    const rad = width * 0.18;
    cheeks = [
      { cx: x + width * 0.18, cy, rad },
      { cx: x + width * 0.82, cy, rad },
    ];
  } else {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const rad = w * TRYON_DEFAULTS.BLUSH_RADIUS;
    cheeks = [
      { cx: w * 0.28, cy: h * 0.38, rad },
      { cx: w * 0.72, cy: h * 0.38, rad },
    ];
  }

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const { cx, cy, rad } of cheeks) {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 1.4);
    grad.addColorStop(0,   `rgba(${r},${g},${b},${opacity})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${opacity * 0.5})`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Try to get a face bounding box from the browser's native FaceDetector API.
 * Returns null if the API is unavailable or no face is found.
 * @param {ImageBitmap} bitmap
 * @returns {Promise<{x,y,width,height}|null>}
 */
export async function detectFaceBounds(bitmap) {
  if (!('FaceDetector' in window)) return null;
  try {
    const detector = new window.FaceDetector({ fastMode: true });
    const faces    = await detector.detect(bitmap);
    return faces[0]?.boundingBox ?? null;
  } catch {
    return null;
  }
}

/**
 * Render makeup try-on overlays onto a canvas element.
 *
 * @param {{
 *   canvas:      HTMLCanvasElement,
 *   bitmap:      ImageBitmap,
 *   landmarks:   object | null,
 *   activeShades: { lipstick?: object, blush?: object },
 *   opacity?:    number,
 *   faceBounds?: { x, y, width, height } | null
 * }} params
 */
export function renderTryOn({
  canvas,
  bitmap,
  landmarks,
  activeShades = {},
  opacity,
  faceBounds = null,
}) {
  if (!canvas || !bitmap) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width  = bitmap.width;
  canvas.height = bitmap.height;

  const w = canvas.width;
  const h = canvas.height;

  ctx.drawImage(bitmap, 0, 0);

  if (activeShades.lipstick) {
    const lipOpacity = opacity ?? TRYON_DEFAULTS.LIP_OPACITY;
    if (landmarks?.LIPS_OUTER?.length) {
      renderLipstickLandmark(ctx, w, h, landmarks, activeShades.lipstick, lipOpacity);
    } else {
      renderLipstickGeometric(ctx, activeShades.lipstick, lipOpacity, faceBounds);
    }
  }

  if (activeShades.blush) {
    const blushOpacity = opacity ?? TRYON_DEFAULTS.BLUSH_OPACITY;
    if (landmarks?.LEFT_BLUSH_CENTER?.length || landmarks?.RIGHT_BLUSH_CENTER?.length) {
      renderBlushLandmark(ctx, w, h, landmarks, activeShades.blush, blushOpacity);
    } else {
      renderBlushGeometric(ctx, activeShades.blush, blushOpacity, faceBounds);
    }
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
