import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@components/Header';
import HistoryCard from '@components/HistoryCard';
import { getHistory, clearHistory } from '@utils/historyStore';
import { useAppState } from '@state/AppState';


export default function HistoryPage() {
  const [entries, setEntries] = useState(() => getHistory());
  const [cleared, setCleared] = useState(false);
  const { dispatch } = useAppState();
  const navigate = useNavigate();

  const handleClear = () => {
    clearHistory();
    setEntries([]);
    setCleared(true);
  };

  const handleEntryClick = (entry) => {
    // Single atomic dispatch — avoids RESET→ANALYSIS_COMPLETE flash
    dispatch({
      type: 'RESTORE_HISTORY',
      payload: {
        mstIndex:    entry.mstIndex,
        mstLabel:    entry.mstLabel,
        undertone:   entry.undertone,
        dominantHex: entry.dominantHex,
        confidence:  entry.confidence,
        recommendations: entry.recommendations,
      },
    });
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-5xl mx-auto px-8 lg:px-16 py-12" id="history-main">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl text-charcoal mb-1">Past Analyses</h1>
            <p className="text-muted text-sm">
              {entries.length > 0
                ? `${entries.length} saved result${entries.length !== 1 ? 's' : ''}`
                : 'No saved analyses yet'}
            </p>
          </div>
          {entries.length > 0 && (
            <button
              id="clear-history-button"
              onClick={handleClear}
              className="text-xs text-muted border border-brand-light/60 rounded-full px-3 py-1.5 hover:border-red-200 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
              <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-charcoal font-medium mb-1">
                {cleared ? 'History cleared' : 'No history yet'}
              </p>
              <p className="text-muted text-sm">
                {cleared
                  ? 'Run a new analysis to start building your history.'
                  : 'Once you analyse a photo, your results will appear here.'}
              </p>
            </div>
            <Link
              to="/app"
              id="history-empty-cta"
              className="px-6 py-2.5 bg-brand text-white text-sm font-body rounded-full hover:bg-brand/90 transition-colors"
            >
              Analyse My Skin Tone
            </Link>
          </div>
        )}

        {/* History list */}
        {entries.length > 0 && (
          <ol className="flex flex-col gap-4" aria-label="Analysis history">
            {entries.map((entry) => (
              <li key={entry.id}>
                <HistoryCard
                  entry={entry}
                  onClick={() => handleEntryClick(entry)}
                />
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
