import { useState, useMemo } from 'react';
import { useAppState } from '@state/AppState';
import { getRecommendations } from '@engine/recommendationEngine';
import { BRAND_LIST, MST_REFERENCE } from '@utils/constants';
import ProductCard from '@components/ProductCard';

// Static import — avoids 304 fetch issue with public/products.json
import catalogue from '../../public/products.json';

const CATEGORY_CONFIG = [
  { key: 'foundation', label: 'Foundation' },
  { key: 'blush',      label: 'Blush' },
  { key: 'lipstick',   label: 'Lipstick' },
];

export default function ResultsPanel() {
  const { state, dispatch } = useAppState();
  const { mstIndex, mstLabel, undertone, dominantHex, confidence, recommendations } = state;

  const [activeBrands, setActiveBrands] = useState([]);

  const mstEntry = MST_REFERENCE.find((m) => m.index === mstIndex);

  const filtered = useMemo(() => {
    if (!recommendations) return { foundation: [], blush: [], lipstick: [] };
    // Pass full static catalogue; getRecommendations filters by activeBrands internally
    return getRecommendations({ mstIndex, undertone, activeBrands, catalogue });
  }, [activeBrands, mstIndex, undertone, recommendations]);

  const toggleBrand = (brand) => {
    const next = activeBrands.includes(brand)
      ? activeBrands.filter((b) => b !== brand)
      : [...activeBrands, brand];
    setActiveBrands(next);
    dispatch({ type: 'SET_BRAND_FILTER', payload: { brands: next } });
  };

  const clearBrands = () => {
    setActiveBrands([]);
    dispatch({ type: 'SET_BRAND_FILTER', payload: { brands: [] } });
  };

  const undertoneLabel = undertone
    ? undertone.charAt(0).toUpperCase() + undertone.slice(1)
    : '';

  return (
    <div id="results-panel" className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-10 anim-fade-up">

      {/* ── Skin Tone Card ───────────────────────────────────────────────── */}
      <section
        aria-labelledby="skin-tone-heading"
        className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-brand-light"
      >
        <div
          className="w-24 h-24 rounded-full flex-shrink-0 border-4 border-white shadow-md anim-scale-in"
          style={{ backgroundColor: dominantHex }}
          aria-label={`Dominant skin tone colour: ${dominantHex}`}
        />
        <div className="flex-1 text-center sm:text-left">
          <h2 id="skin-tone-heading" className="font-display text-3xl text-charcoal mb-1">
            {mstLabel}
          </h2>
          {mstEntry && (
            <p className="text-muted text-sm mb-3">{mstEntry.description}</p>
          )}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
            <span className="px-3 py-1 bg-brand-light text-brand text-xs rounded-full font-medium">
              {undertoneLabel} undertone
            </span>
            <span className="px-3 py-1 bg-brand-light text-brand text-xs rounded-full font-medium">
              {dominantHex}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-1.5 bg-brand-light rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={confidence}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Detection confidence"
            >
              <div
                className="h-full bg-brand rounded-full"
                style={{
                  width: `${confidence}%`,
                  animation: 'progressFill 1.2s ease-out 0.3s both',
                  '--progress-target': `${confidence}%`,
                }}
              />
            </div>
            <span className="text-xs text-muted tabular-nums">{confidence}% confidence</span>
          </div>
        </div>
        <button
          id="reset-button"
          onClick={() => dispatch({ type: 'RESET' })}
          className="self-start text-xs text-muted hover:text-charcoal border border-brand-light/60 rounded-full px-3 py-1.5 transition-colors"
        >
          Start Over
        </button>
      </section>

      {/* ── Brand Filter ─────────────────────────────────────────────────── */}
      <section aria-label="Filter by brand">
        <p className="text-xs text-muted uppercase tracking-widest mb-3">Filter by brand</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Brand filters">
          {BRAND_LIST.map((brand) => {
            const isActive = activeBrands.includes(brand);
            return (
              <button
                key={brand}
                id={`brand-filter-${brand.replace(/[^a-z]/gi, '-').toLowerCase()}`}
                onClick={() => toggleBrand(brand)}
                aria-pressed={isActive}
                className={`px-4 py-1.5 rounded-full text-xs font-body transition-all duration-150 border ${
                  isActive
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-muted border-brand-light hover:border-brand/40 hover:text-charcoal'
                }`}
              >
                {brand}
              </button>
            );
          })}
          {activeBrands.length > 0 && (
            <button
              onClick={clearBrands}
              className="px-4 py-1.5 rounded-full text-xs text-muted border border-dashed border-muted/40 hover:border-charcoal hover:text-charcoal transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* ── Product Grids ─────────────────────────────────────────────────── */}
      {CATEGORY_CONFIG.map(({ key, label }) => {
        const products = filtered[key] ?? [];
        return (
          <section key={key} aria-labelledby={`${key}-heading`}>
            <h3
              id={`${key}-heading`}
              className="font-display text-2xl text-charcoal mb-5 flex items-center gap-3"
            >
              {label}
              <span className="text-sm font-body text-muted font-normal">
                {products.length} shade{products.length !== 1 ? 's' : ''}
              </span>
            </h3>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, i) => (
                  <div key={product.id} className="anim-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <ProductCard product={product} category={key} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm py-6 border border-dashed border-brand-light rounded-xl text-center">
                No {label.toLowerCase()} shades match your current filter.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
