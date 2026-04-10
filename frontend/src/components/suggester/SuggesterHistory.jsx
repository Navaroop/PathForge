import React, { useState } from 'react';

const SuggesterHistory = ({ history, loadFromHistory, clearHistory, deleteHistoryItem }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-10 text-center shadow-sm">
          <p className="text-3xl mb-2">🕐</p>
          <p className="text-[var(--accent-highlight)] font-bold tracking-wide">No search history yet.</p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Your past searches will appear here.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="font-bold text-[var(--text-primary)] tracking-wide">Search History <span className="text-[var(--text-secondary)] font-normal text-sm ml-1">({history.length})</span></p>
            <button onClick={clearHistory}
              className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.2)] text-[var(--color-error)] font-bold hover:bg-[rgba(248,113,113,0.1)] transition-colors">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {history.map(entry => (
              <div key={entry.id} onClick={() => loadFromHistory(entry)}
                className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4 flex items-center justify-between hover:border-[var(--border-hover)] transition-colors cursor-pointer group">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-highlight)] transition-colors italic">"{entry.query}"</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium tracking-wide">
                    {new Date(entry.createdAt).toLocaleDateString()} · {entry.suggestionsCount} matches · {entry.alternativesCount} alternatives
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(entry.id);
                    }}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[rgba(248,113,113,0.05)] transition-all opacity-0 group-hover:opacity-100"
                    title="Delete entry"
                  >
                    <span className="text-sm">✕</span>
                  </button>
                  <span className="text-lg opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete search history?</h3>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              Do you want to delete this history item? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2 rounded-xl text-[var(--text-primary)] font-bold text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-glass)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteHistoryItem(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-5 py-2 rounded-xl text-white font-bold text-sm bg-[var(--color-error)] shadow hover:shadow-[0_0_15px_rgba(248,113,113,0.4)] transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggesterHistory;
