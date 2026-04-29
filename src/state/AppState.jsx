// STUB — will be replaced by teammate's real implementation.
// Honors the documented action contract exactly.
import { createContext, useContext, useReducer } from 'react';
import { STEPS } from '@utils/constants';

const initialState = {
  step: STEPS.UPLOAD,
  imageFile: null,
  dataUrl: null,
  bitmap: null,
  width: null,
  height: null,
  // analysis results
  mstIndex: null,
  mstLabel: null,
  undertone: null,
  dominantHex: null,
  confidence: null,
  landmarks: null,
  // recommendations
  recommendations: null,
  // brand filter
  activeBrands: [],
  // try-on
  activeTryOnShade: null,
  // error
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        imageFile: action.payload.file,
        dataUrl: action.payload.dataUrl,
        bitmap: action.payload.bitmap,
        width: action.payload.width,
        height: action.payload.height,
        error: null,
      };

    case 'ANALYSIS_START':
      return { ...state, step: STEPS.ANALYSING, error: null };

    case 'ANALYSIS_COMPLETE':
      return {
        ...state,
        step: STEPS.RESULTS,
        mstIndex: action.payload.mstIndex,
        mstLabel: action.payload.mstLabel,
        undertone: action.payload.undertone,
        dominantHex: action.payload.dominantHex,
        confidence: action.payload.confidence,
        landmarks: action.payload.landmarks,
        recommendations: action.payload.recommendations,
      };

    case 'SET_BRAND_FILTER':
      return { ...state, activeBrands: action.payload.brands };

    case 'SET_TRYON_SHADE':
      return { ...state, activeTryOnShade: action.payload.shade };

    case 'SET_ERROR':
      return { ...state, error: action.payload.message, step: STEPS.UPLOAD };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used inside AppProvider');
  return ctx;
}
