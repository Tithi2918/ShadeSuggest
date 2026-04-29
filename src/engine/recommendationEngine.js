// STUB — will be replaced by teammate's real recommendation engine.
// Honors the documented API:
//   getRecommendations({ mstIndex, undertone, activeBrands, catalogue }) → { foundation, blush, lipstick }

const LIMITS = { foundation: 3, blush: 2, lipstick: 2 };

/**
 * Score a product's undertone compatibility.
 * Exact match = 2, neutral = 1, mismatch = 0
 */
function undertoneScore(productUndertone, skinUndertone) {
  if (productUndertone === skinUndertone) return 2;
  if (productUndertone === 'neutral' || skinUndertone === 'neutral') return 1;
  return 0;
}

/**
 * Get makeup recommendations for a skin tone.
 * @param {{ mstIndex: number, undertone: string, activeBrands: string[], catalogue: object[] }} params
 * @returns {{ foundation: object[], blush: object[], lipstick: object[] }}
 */
export function getRecommendations({ mstIndex, undertone, activeBrands = [], catalogue = [] }) {
  const brands = activeBrands.length > 0 ? activeBrands : null;

  const scored = catalogue
    .filter((p) => {
      const [lo, hi] = p.mst_range;
      if (mstIndex < lo || mstIndex > hi) return false;
      if (brands && !brands.includes(p.brand)) return false;
      return true;
    })
    .map((p) => ({ ...p, _score: undertoneScore(p.undertone, undertone) }))
    .sort((a, b) => b._score - a._score);

  const pick = (category) =>
    scored.filter((p) => p.category === category).slice(0, LIMITS[category]);

  return {
    foundation: pick('foundation'),
    blush:      pick('blush'),
    lipstick:   pick('lipstick'),
  };
}
