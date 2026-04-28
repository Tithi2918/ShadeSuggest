import Header from '@components/Header';
import UploadPanel from '@components/UploadPanel';
import AnalysisPanel from '@components/AnalysisPanel';
import ResultsPanel from '@components/ResultsPanel';
import { useAppState } from '@state/AppState';
import { STEPS } from '@utils/constants';

export default function AppPage() {
  const { state } = useAppState();

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main id="app-main">
        {state.step === STEPS.UPLOAD && <UploadPanel />}
        {state.step === STEPS.ANALYSING && <AnalysisPanel />}
        {state.step === STEPS.RESULTS && <ResultsPanel />}
      </main>
    </div>
  );
}
