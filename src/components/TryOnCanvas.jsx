import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppState } from '@state/AppState';
import { renderTryOn, exportPreview, detectFaceBounds, estimateFaceBoundsFromPixels } from '@cv/tryOnRenderer';
import { TRYON_DEFAULTS } from '@utils/constants';

const DEFAULT_LIP_OPACITY   = TRYON_DEFAULTS.LIP_OPACITY;
const DEFAULT_BLUSH_OPACITY = TRYON_DEFAULTS.BLUSH_OPACITY;

export default function TryOnCanvas() {
  const { state, dispatch } = useAppState();
  const { bitmap, landmarks, activeTryOnShade } = state;
  const canvasRef = useRef(null);

  const [showBefore, setShowBefore] = useState(false);
  const [opacity, setOpacity]       = useState(null);
  const [faceBounds, setFaceBounds] = useState(null);

  // Track last shade id so we can detect shade switches
  const lastShadeIdRef = useRef(null);
  if (activeTryOnShade?.id !== lastShadeIdRef.current) {
    lastShadeIdRef.current = activeTryOnShade?.id ?? null;
    if (opacity !== null) setOpacity(null);
    if (showBefore)       setShowBefore(false);
    // Don't reset faceBounds — it's tied to the bitmap, not the shade
  }

  // Re-render whenever shade, bitmap, opacity, or before/after changes
  const redraw = useCallback(() => {
    if (!bitmap || !canvasRef.current) return;

    if (showBefore || !activeTryOnShade) {
      // "Before" view — just draw the raw photo
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      canvasRef.current.width  = bitmap.width;
      canvasRef.current.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);
      return;
    }

    const activeShades = {};
    activeShades[activeTryOnShade.category] = activeTryOnShade;

    // Resolve opacity: custom slider value, or per-category default
    const resolvedOpacity = opacity !== null
      ? opacity
      : activeTryOnShade.category === 'lipstick'
        ? DEFAULT_LIP_OPACITY
        : DEFAULT_BLUSH_OPACITY;

    renderTryOn({
      canvas:  canvasRef.current,
      bitmap,
      landmarks,
      activeShades,
      opacity: resolvedOpacity,
      faceBounds,
    });
  }, [bitmap, landmarks, activeTryOnShade, opacity, showBefore, faceBounds]);

  // Cascade: FaceDetector API → pixel-scan (Kovac) → heuristic in renderer
  // Runs once per bitmap (not per shade) so overlays are positioned on the face.
  useEffect(() => {
    if (landmarks || !bitmap) return;
    let cancelled = false;
    detectFaceBounds(bitmap)
      .then((bounds) => bounds ?? estimateFaceBoundsFromPixels(bitmap))
      .then((bounds) => { if (!cancelled) setFaceBounds(bounds); });
    return () => { cancelled = true; };
  }, [bitmap, landmarks]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = exportPreview(canvasRef.current);
    const a = document.createElement('a');
    a.href     = dataUrl;
    a.download = 'shadesense-preview.png';
    a.click();
  };

  const handleClear = () => {
    dispatch({ type: 'SET_TRYON_SHADE', payload: { shade: null } });
  };

  // Default opacity for slider display
  const displayOpacity = opacity !== null
    ? opacity
    : activeTryOnShade?.category === 'lipstick'
      ? DEFAULT_LIP_OPACITY
      : DEFAULT_BLUSH_OPACITY;

  if (!bitmap) return null;

  return (
    <section
      aria-labelledby="tryon-heading"
      className="bg-white border border-brand-light rounded-2xl p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 id="tryon-heading" className="font-display text-2xl text-charcoal">
          Virtual Try-On
        </h3>
        <div className="flex gap-2">
          <button
            id="tryon-clear"
            onClick={handleClear}
            disabled={!activeTryOnShade}
            className="px-4 py-1.5 text-xs border border-brand-light text-muted rounded-full
              hover:border-brand/40 hover:text-charcoal transition-colors disabled:opacity-30"
          >
            Clear
          </button>
          <button
            id="tryon-download"
            onClick={handleDownload}
            className="px-4 py-1.5 text-xs bg-brand text-white rounded-full
              hover:bg-brand/90 transition-colors"
          >
            Download Preview
          </button>
        </div>
      </div>

      {/* Active shade chip */}
      {activeTryOnShade && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <div
            className="w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0"
            style={{ backgroundColor: activeTryOnShade.hex_code }}
          />
          Applying{' '}
          <strong className="text-charcoal">{activeTryOnShade.shade_name}</strong>
          {' '}by {activeTryOnShade.brand}
        </div>
      )}

      {/* No-landmarks notice */}
      {!landmarks && (
        <p className="text-xs text-muted bg-brand-light/50 border border-brand/10 rounded-xl px-4 py-2.5">
          ℹ️ Face landmarks weren't detected — try-on uses an approximate overlay.
          For best results upload a clear, front-facing photo.
        </p>
      )}

      {/* Opacity slider + before/after toggle */}
      {activeTryOnShade && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Opacity */}
          <label className="flex items-center gap-3 text-xs text-muted flex-1 w-full">
            <span className="flex-shrink-0 w-14">Opacity</span>
            <input
              id="tryon-opacity"
              type="range"
              min={0.05}
              max={0.95}
              step={0.05}
              value={displayOpacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="flex-1 accent-brand h-1 rounded-full"
              aria-label="Makeup overlay opacity"
            />
            <span className="flex-shrink-0 w-8 text-right tabular-nums">
              {Math.round(displayOpacity * 100)}%
            </span>
          </label>

          {/* Before / After toggle */}
          <div
            role="group"
            aria-label="Before / After"
            className="flex rounded-full border border-brand-light overflow-hidden text-xs flex-shrink-0"
          >
            <button
              id="tryon-before"
              onClick={() => setShowBefore(true)}
              className={`px-4 py-1.5 transition-colors ${
                showBefore
                  ? 'bg-brand text-white'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              Before
            </button>
            <button
              id="tryon-after"
              onClick={() => setShowBefore(false)}
              className={`px-4 py-1.5 transition-colors ${
                !showBefore
                  ? 'bg-brand text-white'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              After
            </button>
          </div>
        </div>
      )}

      {/* Prompt when nothing selected */}
      {!activeTryOnShade && (
        <p className="text-sm text-muted text-center py-2">
          Press <strong>Try On</strong> on any product card to preview it here.
        </p>
      )}

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border border-brand-light/60 relative">
        <canvas
          ref={canvasRef}
          id="tryon-canvas"
          className="w-full h-auto block"
          aria-label="Virtual try-on canvas"
        />
        {/* Before/After label badge */}
        {activeTryOnShade && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full pointer-events-none">
            {showBefore ? 'Before' : 'After'}
          </div>
        )}
      </div>
    </section>
  );
}
