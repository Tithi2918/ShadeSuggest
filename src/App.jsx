import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@state/AppState';
import LandingPage from '@/pages/LandingPage';
import AppPage from '@/pages/AppPage';
import HistoryPage from '@/pages/HistoryPage';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
