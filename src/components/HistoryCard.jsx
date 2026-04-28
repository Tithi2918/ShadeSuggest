

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function HistoryCard({ entry, onClick }) {
  const { mstLabel, undertone, dominantHex, date, confidence, recommendations } = entry;

  const topProducts = [
    ...(recommendations?.foundation?.slice(0, 1) ?? []),
    ...(recommendations?.blush?.slice(0, 1) ?? []),
    ...(recommendations?.lipstick?.slice(0, 1) ?? []),
  ];

  return (
    <article
      className="bg-white border border-brand-light rounded-2xl p-5 flex items-start gap-5
        hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`Past analysis: ${mstLabel}, ${formatDate(date)}`}
    >
      {/* Swatch */}
      <div
        className="w-14 h-14 rounded-full flex-shrink-0 border-4 border-white shadow-md"
        style={{ backgroundColor: dominantHex }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg text-charcoal leading-tight">{mstLabel}</p>
            <p className="text-xs text-muted capitalize mt-0.5">{undertone} undertone · {confidence}% confidence</p>
          </div>
          <p className="text-xs text-muted flex-shrink-0">{formatDate(date)}</p>
        </div>

        {/* Top picks */}
        {topProducts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {topProducts.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1 px-2 py-0.5 bg-brand-light rounded-full text-xs text-brand"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: p.hex_code }}
                />
                {p.shade_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <svg
        className="w-4 h-4 text-muted flex-shrink-0 mt-1 group-hover:text-brand transition-colors"
        fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </article>
  );
}
