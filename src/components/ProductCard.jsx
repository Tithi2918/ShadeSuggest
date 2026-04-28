import { useAppState } from '@state/AppState';

function CompatibilityBadge({ score }) {
  if (score === 2) return <span className="text-xs text-brand font-medium">✓ Great Match</span>;
  if (score === 1) return <span className="text-xs text-muted">○ Good Match</span>;
  return null;
}

export default function ProductCard({ product, category }) {
  const { state, dispatch } = useAppState();
  const isTryingOn = state.activeTryOnShade?.id === product.id;

  const undertoneScore =
    product.undertone === state.undertone ? 2 :
    product.undertone === 'neutral' || state.undertone === 'neutral' ? 1 : 0;

  const handleTryOn = () => {
    dispatch({
      type: 'SET_TRYON_SHADE',
      payload: {
        shade: isTryingOn ? null : { ...product, category },
      },
    });
  };

  return (
    <article
      className="group bg-white border border-brand-light rounded-2xl p-5 flex flex-col gap-4
        hover:-translate-y-1 hover:shadow-md transition-all duration-200"
    >
      {/* Swatch + compatibility */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
          style={{ backgroundColor: product.hex_code }}
          aria-label={`Shade colour: ${product.shade_name}`}
        />
        <div className="min-w-0">
          <p className="text-xs text-muted uppercase tracking-wider truncate">{product.brand}</p>
          <p className="text-sm text-charcoal font-medium truncate">{product.product_name}</p>
        </div>
      </div>

      {/* Shade info */}
      <div>
        <p className="text-sm font-medium text-charcoal">{product.shade_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted capitalize">{product.finish} · {product.undertone}</span>
        </div>
        <CompatibilityBadge score={undertoneScore} />
      </div>

      {/* Price + actions */}
      <div className="mt-auto flex items-center gap-2">
        <span className="text-sm font-medium text-charcoal">${product.price_usd.toFixed(2)}</span>
        <div className="flex-1" />
        <button
          id={`tryon-${product.id}`}
          onClick={handleTryOn}
          className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-150 ${
            isTryingOn
              ? 'bg-brand text-white border-brand'
              : 'border-brand/40 text-brand hover:bg-brand-light'
          }`}
          aria-pressed={isTryingOn}
        >
          {isTryingOn ? 'Applied' : 'Try On'}
        </button>
        <a
          href={product.purchase_url}
          target="_blank"
          rel="noopener noreferrer"
          id={`buy-${product.id}`}
          className="px-3 py-1.5 text-xs rounded-full bg-brand text-white hover:bg-brand/90 transition-colors"
          aria-label={`Buy ${product.product_name} ${product.shade_name}`}
        >
          Buy →
        </a>
      </div>
    </article>
  );
}
