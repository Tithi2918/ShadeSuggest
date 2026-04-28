// STUB — will be replaced by teammate's real catalogue store.
// Honors the documented API: catalogueStore.load(), catalogueStore.filter({ brands, categories, mstIndex })

let _cache = null;

export const catalogueStore = {
  /**
   * Load all products from public/products.json (cached after first call).
   * @returns {Promise<object[]>}
   */
  async load() {
    if (_cache) return _cache;
    const res = await fetch('/products.json');
    if (!res.ok) throw new Error('Failed to load product catalogue.');
    _cache = await res.json();
    return _cache;
  },

  /**
   * Filter catalogue products.
   * @param {{ brands?: string[], categories?: string[], mstIndex?: number }} opts
   * @returns {object[]}
   */
  filter({ brands = [], categories = [], mstIndex = null } = {}) {
    if (!_cache) return [];
    return _cache.filter((p) => {
      if (brands.length > 0 && !brands.includes(p.brand)) return false;
      if (categories.length > 0 && !categories.includes(p.category)) return false;
      if (mstIndex !== null) {
        const [lo, hi] = p.mst_range;
        if (mstIndex < lo || mstIndex > hi) return false;
      }
      return true;
    });
  },
};
