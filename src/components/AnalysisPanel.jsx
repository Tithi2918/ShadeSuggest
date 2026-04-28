import { useEffect, useState } from 'react';
import { useAppState } from '@state/AppState';
import { detectSkinTone } from '@cv/skinToneDetection';
import { catalogueStore } from '@engine/catalogueStore';
import { getRecommendations } from '@engine/recommendationEngine';
import { addEntry } from '@utils/historyStore';
import { v4 as uuidv4 } from 'uuid';

const PIPELINE_STEPS = [
  { id: 'ingest',    label: 'Ingesting image' },
  { id: 'detect',   label: 'Detecting skin tone' },
  { id: 'recommend', label: 'Finding your shades' },
];

export default function AnalysisPanel() {
  const { state, dispatch } = useAppState();
  const [activeStep, setActiveStep] = useState(0); // index of step currently running
  const [done, setDone] = useState([]); // indices of completed steps

  useEffect(() => {
    let cancelled = false;

    async function runPipeline() {
      try {
        // Step 0: ingest (already done, just show the tick)
        await delay(600);
        if (cancelled) return;
        setDone([0]);
        setActiveStep(1);

        // Step 1: detect skin tone
        const detection = await detectSkinTone(state.bitmap);
        if (cancelled) return;
        if (!detection.ok) throw new Error('Skin tone detection failed.');
        setDone([0, 1]);
        setActiveStep(2);

        // Step 2: recommendations
        await delay(400);
        const catalogue = await catalogueStore.load();
        const recommendations = getRecommendations({
          mstIndex: detection.mstIndex,
          undertone: detection.undertone,
          activeBrands: [],
          catalogue,
        });
        if (cancelled) return;
        setDone([0, 1, 2]);

        // Persist to history
        const entry = {
          id: uuidv4(),
          date: new Date().toISOString(),
          mstIndex: detection.mstIndex,
          mstLabel: detection.mstLabel,
          undertone: detection.undertone,
          dominantHex: detection.dominantHex,
          confidence: detection.confidence,
          recommendations,
        };
        addEntry(entry);

        await delay(300);
        if (cancelled) return;

        dispatch({
          type: 'ANALYSIS_COMPLETE',
          payload: {
            mstIndex: detection.mstIndex,
            mstLabel: detection.mstLabel,
            undertone: detection.undertone,
            dominantHex: detection.dominantHex,
            confidence: detection.confidence,
            landmarks: detection.landmarks,
            recommendations,
          },
        });
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'SET_ERROR', payload: { message: err.message || 'Analysis failed. Please try again.' } });
        }
      }
    }

    runPipeline();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id="analysis-panel"
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-16"
      aria-live="polite"
      aria-label="Analysis in progress"
    >
      {/* Pulsing brand ring */}
      <div className="relative mb-10">
        <div className="w-20 h-20 rounded-full border-4 border-brand-light animate-ping absolute inset-0 opacity-40" />
        <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center">
          <svg className="w-9 h-9 text-brand animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      </div>

      <h2 className="font-display text-3xl text-charcoal mb-2 text-center">Analysing your photo</h2>
      <p className="text-muted text-sm mb-10 text-center">This only takes a moment…</p>

      {/* Step list */}
      <ol className="flex flex-col gap-4 w-full max-w-xs">
        {PIPELINE_STEPS.map((step, i) => {
          const isDone = done.includes(i);
          const isActive = activeStep === i && !isDone;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 transition-opacity duration-500 ${
                i > activeStep && !isDone ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {/* Status icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                isDone ? 'bg-brand' : isActive ? 'bg-brand-light border-2 border-brand' : 'bg-brand-light/50 border-2 border-brand/20'
              }`}>
                {isDone ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-brand/20" />
                )}
              </div>
              <span className={`text-sm font-body ${isDone ? 'text-charcoal' : isActive ? 'text-brand font-medium' : 'text-muted'}`}>
                {step.label}
              </span>
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
