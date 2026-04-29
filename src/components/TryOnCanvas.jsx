import { useEffect, useRef } from 'react';
import { useAppState } from '@state/AppState';
import { renderTryOn, exportPreview } from '@cv/tryOnRenderer';

export default function TryOnCanvas() {
  const { state, dispatch } = useAppState();
  const { bitmap, landmarks, activeTryOnShade } = state;
  const canvasRef = useRef(null);

  // Re-render whenever the active shade or bitmap changes
  useEffect(() => {
    if (!bitmap || !canvasRef.current) return;

    const activeShades = {};
    if (activeTryOnShade) {
      activeShades[activeTryOnShade.category] = activeTryOnShade;
    }

    renderTryOn({
      canvas: canvasRef.current,
      bitmap,
      landmarks,
      activeShades,
    });
  }, [bitmap, landmarks, activeTryOnShade]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = exportPreview(canvasRef.current);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'shadesense-preview.png';
    a.click();
  };

  const handleClear = () => {
    dispatch({ type: 'SET_TRYON_SHADE', payload: { shade: null } });
  };

  if (!bitmap) return null;

  return (
    <section aria-labelledby="tryon-heading" className="bg-white border border-brand-light rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 id="tryon-heading" className="font-display text-2xl text-charcoal">
          Virtual Try-On
        </h3>
        <div className="flex gap-2">
          <button
            id="tryon-clear"
            onClick={handleClear}
            disabled={!activeTryOnShade}
            className="px-4 py-1.5 text-xs border border-brand-light text-muted rounded-full hover:border-brand/40 hover:text-charcoal transition-colors disabled:opacity-30"
          >
            Clear
          </button>
          <button
            id="tryon-download"
            onClick={handleDownload}
            className="px-4 py-1.5 text-xs bg-brand text-white rounded-full hover:bg-brand/90 transition-colors"
          >
            Download Preview
          </button>
        </div>
      </div>

      {activeTryOnShade && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <div
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: activeTryOnShade.hex_code }}
          />
          Applying <strong className="text-charcoal">{activeTryOnShade.shade_name}</strong> by {activeTryOnShade.brand}
        </div>
      )}

      {!activeTryOnShade && (
        <p className="text-sm text-muted text-center py-2">
          Press <strong>Try On</strong> on any product card to preview it here.
        </p>
      )}

      <div className="rounded-xl overflow-hidden border border-brand-light/60">
        <canvas
          ref={canvasRef}
          id="tryon-canvas"
          className="w-full h-auto block"
          aria-label="Virtual try-on canvas"
        />
      </div>
    </section>
  );
}
