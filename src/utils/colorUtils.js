/**
 * colorUtils.js
 * Colour space conversions and perceptual distance functions.
 * All functions are pure — no side effects, fully unit testable.
 */

import { MST_REFERENCE, UNDERTONES } from './constants.js';

// ── sRGB → Linear RGB ─────────────────────────────────────────────────────────
export function srgbToLinear(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

// ── Linear RGB → XYZ (D65) ────────────────────────────────────────────────────
export function rgbToXyz(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  return {
    x: lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375,
    y: lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750,
    z: lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041,
  };
}

// ── XYZ → CIE-LAB (D65 white point) ──────────────────────────────────────────
const D65 = { x: 0.95047, y: 1.00000, z: 1.08883 };

function labF(t) {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

export function xyzToLab(x, y, z) {
  const fx = labF(x / D65.x);
  const fy = labF(y / D65.y);
  const fz = labF(z / D65.z);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

// ── RGB → LAB (combined) ──────────────────────────────────────────────────────
export function rgbToLab(r, g, b) {
  const xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

// ── Hex → RGB ─────────────────────────────────────────────────────────────────
export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

// ── RGB → Hex ─────────────────────────────────────────────────────────────────
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// ── RGB → HSL ─────────────────────────────────────────────────────────────────
export function rgbToHsl(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l   = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// ── CIEDE2000 Colour Distance ─────────────────────────────────────────────────
export function deltaE2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const kL = 1, kC = 1, kH = 1;
  const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  const Cb = (C1 + C2) / 2;
  const Cb7 = Cb ** 7;
  const G  = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
  const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);

  const h1p = Math.atan2(b1, a1p) * (180 / Math.PI) + (b1 < 0 || a1p < 0 ? 360 : 0);
  const h2p = Math.atan2(b2, a2p) * (180 / Math.PI) + (b2 < 0 || a2p < 0 ? 360 : 0);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = Math.abs(h2p - h1p) <= 180
      ? h2p - h1p
      : h2p - h1p + (h2p <= h1p ? 360 : -360);
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * (Math.PI / 180));

  const Lbp  = (L1 + L2) / 2;
  const Cbp  = (C1p + C2p) / 2;
  let Hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    Hbp = Math.abs(h1p - h2p) <= 180
      ? (h1p + h2p) / 2
      : (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2;
  }

  const T = 1
    - 0.17 * Math.cos((Hbp - 30)  * Math.PI / 180)
    + 0.24 * Math.cos((2 * Hbp)   * Math.PI / 180)
    + 0.32 * Math.cos((3 * Hbp + 6)  * Math.PI / 180)
    - 0.20 * Math.cos((4 * Hbp - 63) * Math.PI / 180);

  const SL  = 1 + 0.015 * (Lbp - 50) ** 2 / Math.sqrt(20 + (Lbp - 50) ** 2);
  const SC  = 1 + 0.045 * Cbp;
  const SH  = 1 + 0.015 * Cbp * T;
  const Cbp7 = Cbp ** 7;
  const RC  = 2 * Math.sqrt(Cbp7 / (Cbp7 + 25 ** 7));
  const dTheta = 30 * Math.exp(-((Hbp - 275) / 25) ** 2);
  const RT  = -Math.sin(2 * dTheta * Math.PI / 180) * RC;

  return Math.sqrt(
    (dLp / (kL * SL)) ** 2 +
    (dCp / (kC * SC)) ** 2 +
    (dHp / (kH * SH)) ** 2 +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );
}

// ── Nearest MST from LAB colour ───────────────────────────────────────────────
export function labToMst(lab) {
  let minDelta = Infinity;
  let bestIndex = 0;

  MST_REFERENCE.forEach((ref, i) => {
    const { r, g, b } = hexToRgb(ref.hex);
    const refLab       = rgbToLab(r, g, b);
    const delta        = deltaE2000(lab, refLab);
    if (delta < minDelta) {
      minDelta  = delta;
      bestIndex = i;
    }
  });

  const confidence = Math.max(0, Math.min(100, Math.round(100 - (minDelta / 50) * 100)));
  return {
    mstIndex:   MST_REFERENCE[bestIndex].index,
    mstLabel:   MST_REFERENCE[bestIndex].label,
    confidence,
  };
}

// ── Undertone from hex ────────────────────────────────────────────────────────
export function classifyUndertone(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { h }       = rgbToHsl(r, g, b);
  if (h >= 15  && h <= 45)  return UNDERTONES.WARM;
  if (h >= 300 || h <= 14)  return UNDERTONES.COOL;
  return UNDERTONES.NEUTRAL;
}

// ── Hex → RGBA string ─────────────────────────────────────────────────────────
export function hexToRgba(hex, opacity) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ── Average colour from pixel array ──────────────────────────────────────────
export function averageColor(pixels) {
  let r = 0, g = 0, b = 0;
  const n = pixels.length;
  pixels.forEach(p => { r += p.r; g += p.g; b += p.b; });
  return { r: r / n, g: g / n, b: b / n };
}
