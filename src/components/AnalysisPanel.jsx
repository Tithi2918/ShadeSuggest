import { useEffect, useState } from 'react';
import { useAppState } from '@state/AppState';
import { detectSkinTone } from '@cv/skinToneDetection';
import { getRecommendations } from '@engine/recommendationEngine';
import { addEntry } from '@utils/historyStore';

// Static import — avoids 304 fetch issue with public/products.json
import catalogue from '../../public/products.json';

const LOW_CONFIDENCE_THRESHOLD = 45;

const PIPELINE_STEPS = [
  {
    id: 'model',
    label: 'Loading AI model',
    detail: 'Initialising MediaPipe FaceMesh…',
  },
  {
    id: 'detect',
    label: 'Detecting skin tone',
    detail: 'Running on-device analysis…',
  },
  {
    id: 'recommend',
    label: 'Finding your shades',
    detail: 'Matching to our product catalogue…',
  },
];

export default function AnalysisPanel() {
  const { state, dispatch } = useAppState();
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function runPipeline() {
      try {
        // Step 0 — model loading (MediaPipe + ONNX initialise on first call)
        // Nothing to await here; the loading happens inside detectSkinTone.
        // We show the step briefly so the user knows something is happening.
        await delay(300);
        if (cancelled) return;
        setDone([0]);
        setActiveStep(1);

        // Step 1 — run real CV pipeline
        const detection = await detectSkinTone(state.bitmap);
        if (cancelled) return;

        if (!detection.ok) {
          dispatch({ type: 'SET_ERROR', payload: { message: detection.error ?? 'Detection failed. Please try again with a clearer photo.' } });
          return;
        }

        // Low-confidence guard
        if (detection.confidence < LOW_CONFIDENCE_THRESHOLD) {
          dispatch({
            type: 'SET_ERROR',
            payload: {
              message: `Confidence too low (${detection.confidence}%). Please use a well-lit, front-facing photo with no heavy filters.`,
            },
          });
          return;
        }

        setDone([0, 1]);
        setActiveStep(2);

        // Step 2 — recommendations (static catalogue, no fetch)
        const recommendations = getRecommendations({
          mstIndex:    detection.mstIndex,
          undertone:   detection.undertone,
          activeBrands: [],
          catalogue,
        });
        if (cancelled) return;
        setDone([0, 1, 2]);

        // Save to history (cap to top-N per category per documented schema)
        const historyEntry = {
          id:          crypto.randomUUID(),
          date:        new Date().toISOString(),
          mstIndex:    detection.mstIndex,
          mstLabel:    detection.mstLabel,
          undertone:   detection.undertone,
          dominantHex: detection.dominantHex,
          confidence:  detection.confidence,
          recommendations: {
            foundation: (recommendations.foundation ?? []).slice(0, 3),
            blush:      (recommendations.blush      ?? []).slice(0, 2),
            lipstick:   (recommendations.lipstick   ?? []).slice(0, 2),
          },
        };
        addEntry(historyEntry);

        await delay(400);
        if (cancelled) return;

        dispatch({
          type: 'ANALYSIS_COMPLETE',
          payload: {
            mstIndex:    detection.mstIndex,
            mstLabel:    detection.mstLabel,
            undertone:   detection.undertone,
            dominantHex: detection.dominantHex,
            confidence:  detection.confidence,
            landmarks:   detection.landmarks,
            recommendations,
          },
        });
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'SET_ERROR',
            payload: { message: err.message || 'Analysis failed. Please try again.' },
          });
        }
      }
    }

    runPipeline();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDone = done.length === PIPELINE_STEPS.length;

  return (
    <div
      id="analysis-panel"
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-16 anim-fade-in"
      aria-live="polite"
      aria-label="Analysis in progress"
    >
      {/* Animated rings */}
      <div className="relative mb-12">
        <div className={`absolute inset-0 w-24 h-24 rounded-full border-2 border-brand/20 transition-opacity duration-700 ${allDone ? 'opacity-0' : 'animate-ping opacity-30'}`} />
        <div className="w-24 h-24 rounded-full bg-brand-light flex items-center justify-center">
          {allDone ? (
            <svg className="w-10 h-10 text-brand anim-scale-in" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-brand animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
        </div>
      </div>

      <h2 className="font-display text-3xl lg:text-4xl text-charcoal mb-2 text-center transition-all duration-500">
        {allDone ? 'Analysis complete!' : 'Analysing your photo'}
      </h2>
      <p className="text-muted text-sm mb-12 text-center">
        {allDone ? 'Loading your personalised recommendations…' : 'This only takes a moment — everything runs on your device.'}
      </p>

      {/* Step list */}
      <ol className="flex flex-col gap-3 w-full max-w-sm">
        {PIPELINE_STEPS.map((step, i) => {
          const isDone   = done.includes(i);
          const isActive = activeStep === i && !isDone;

          return (
            <li
              key={step.id}
              className={`anim-step-slide flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                isDone   ? 'bg-brand-light/60 border-brand/20'   :
                isActive ? 'bg-white border-brand-light shadow-sm' :
                           'bg-white/50 border-transparent opacity-40'
              }`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Status indicator */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isDone   ? 'bg-brand'                              :
                isActive ? 'bg-brand-light border-2 border-brand' :
                           'bg-brand-light/50'
              }`}>
                {isDone ? (
                  <svg className="w-4 h-4 text-white anim-scale-in" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-muted/20" />
                )}
              </div>

              <div className="min-w-0">
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  isDone ? 'text-brand' : isActive ? 'text-charcoal' : 'text-muted'
                }`}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-muted mt-0.5 anim-fade-in">{step.detail}</p>
                )}
              </div>

              {isActive && (
                <div className="ml-auto w-16 h-1 rounded-full bg-brand-light overflow-hidden flex-shrink-0">
                  <div className="h-full bg-brand rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
