// ── MST Reference Table ───────────────────────────────────────────────────────
export const MST_REFERENCE = [
  { index: 1,  label: "MST-01", hex: "#F6EDE4", description: "Lightest",    undertone: "cool"    },
  { index: 2,  label: "MST-02", hex: "#F3E7DB", description: "Very Light",  undertone: "neutral" },
  { index: 3,  label: "MST-03", hex: "#F7EAD0", description: "Light",       undertone: "warm"    },
  { index: 4,  label: "MST-04", hex: "#EAD9BB", description: "Light Medium",undertone: "warm"    },
  { index: 5,  label: "MST-05", hex: "#D7BD96", description: "Medium",      undertone: "neutral" },
  { index: 6,  label: "MST-06", hex: "#A07850", description: "Medium Deep", undertone: "warm"    },
  { index: 7,  label: "MST-07", hex: "#825C43", description: "Deep Medium", undertone: "warm"    },
  { index: 8,  label: "MST-08", hex: "#604134", description: "Deep",        undertone: "neutral" },
  { index: 9,  label: "MST-09", hex: "#3A312A", description: "Very Deep",   undertone: "neutral" },
  { index: 10, label: "MST-10", hex: "#292420", description: "Deepest",     undertone: "cool"    },
];

// ── MediaPipe Landmark Indices ────────────────────────────────────────────────
export const LANDMARKS = {
  LEFT_CHEEK:         [50, 101, 118, 117, 205],
  RIGHT_CHEEK:        [280, 330, 347, 346, 425],
  LIPS_OUTER:         [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  LIPS_INNER:         [308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 185, 40, 39, 37],
  LEFT_EYE:           [33, 7, 163, 144, 145, 153, 154, 155, 133],
  RIGHT_EYE:          [362, 382, 381, 380, 374, 373, 390, 249, 263],
  LEFT_BLUSH_CENTER:  [50, 101, 118],
  RIGHT_BLUSH_CENTER: [280, 330, 347],
};

// ── Brands ────────────────────────────────────────────────────────────────────
export const BRANDS = {
  MAC:        "MAC",
  MAYBELLINE: "Maybelline",
  LOREAL:     "L'Oréal",
  RARE_BEAUTY: "Rare Beauty",
};

export const BRAND_LIST = Object.values(BRANDS);

// ── Product Categories ────────────────────────────────────────────────────────
export const CATEGORIES = {
  FOUNDATION: "foundation",
  BLUSH:      "blush",
  LIPSTICK:   "lipstick",
  EYESHADOW:  "eyeshadow",
};

// ── Undertones ────────────────────────────────────────────────────────────────
export const UNDERTONES = {
  WARM:    "warm",
  NEUTRAL: "neutral",
  COOL:    "cool",
};

// ── Model Config ──────────────────────────────────────────────────────────────
export const MODEL_CONFIG = {
  PATH:          "/models/shadesense_skin_tone.onnx",
  METADATA_PATH: "/models/model_metadata.json",
  INPUT_SIZE:    224,
  INPUT_NAME:    "input",
  OUTPUT_NAME:   "output",
  MEAN:          [0.485, 0.456, 0.406],
  STD:           [0.229, 0.224, 0.225],
};

// ── Image Ingestion Constraints ───────────────────────────────────────────────
export const IMAGE_CONSTRAINTS = {
  MAX_SIZE_BYTES:   10 * 1024 * 1024,  // 10 MB
  MIN_WIDTH:        640,
  MIN_HEIGHT:       480,
  ALLOWED_TYPES:    ["image/jpeg", "image/png", "image/webp"],
};

// ── Try-On Defaults ───────────────────────────────────────────────────────────
export const TRYON_DEFAULTS = {
  LIP_OPACITY:   0.45,
  BLUSH_OPACITY: 0.25,
  BLUSH_RADIUS:  0.12,  // fraction of image width
};

// ── App Steps ─────────────────────────────────────────────────────────────────
export const STEPS = {
  UPLOAD:    "upload",
  ANALYSING: "analysing",
  RESULTS:   "results",
};
