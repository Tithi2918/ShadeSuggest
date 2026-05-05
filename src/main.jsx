import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// NOTE: StrictMode is intentionally removed.
// MediaPipe FaceMesh crashes when initialised twice (React StrictMode
// double-invokes effects in development). The promise-lock guard in
// skinToneDetection.js covers production, but double-init still triggers
// in dev. Keep StrictMode OFF.
createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>,
);
