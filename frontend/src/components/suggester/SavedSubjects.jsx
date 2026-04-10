import React from 'react';

const SavedSubjects = ({ saved, toggleSave, clearSaved, setActiveTab }) => {
  const cardCls = "bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm hover:border-[var(--border-hover)] transition-colors";

  return (
    <div className="space-y-4">
      {saved.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-10 text-center shadow-sm">
          <p className="text-3xl mb-2">🔖</p>
          <p className="text-[var(--accent-highlight)] font-bold tracking-wide">No saved subjects yet.</p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Bookmark subjects from the suggestions tab.</p>
          <button onClick={() => setActiveTab('suggest')}
            className="mt-4 px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow-[var(--card-shadow)] hover:opacity-90 transition-opacity">
            Go to Suggest →
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="font-bold text-[var(--text-primary)] tracking-wide">Saved Subjects <span className="text-[var(--text-secondary)] font-normal text-sm ml-1">({saved.length})</span></p>
            <button onClick={clearSaved}
              className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.2)] text-[var(--color-error)] font-bold hover:bg-[rgba(248,113,113,0.1)] transition-colors">
              Clear All
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {saved.filter(s => s.source === 'document').length > 0 && (
              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-[rgba(52,211,153,0.1)] text-[var(--color-success)] font-bold">
                📄 Best Matches ({saved.filter(s => s.source === 'document').length})
              </span>
            )}
            {saved.filter(s => s.source === 'alternative').length > 0 && (
              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-[rgba(251,191,36,0.1)] text-[var(--color-warning)] font-bold">
                📋 Also Available ({saved.filter(s => s.source === 'alternative').length})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {saved.map(s => (
              <div key={s.id} className={cardCls}>
                <div className="flex items-start justify-between">
                  <span className={`text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${s.source === 'document' ? 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]' : 'bg-[var(--accent-glow)] text-[var(--accent-primary)]'}`}>
                    {s.source === 'document' ? '📄 Best Match' : '🔄 Alternative'}
                  </span>
                  <button onClick={() => toggleSave(s.subjectName, s.source)}
                    className="text-[10px] px-3 py-1 uppercase tracking-widest rounded-full bg-[rgba(248,113,113,0.1)] text-[var(--color-error)] font-bold hover:bg-[rgba(248,113,113,0.2)] transition-colors">
                    Remove
                  </button>
                </div>
                <p className="font-bold text-[var(--text-primary)] tracking-wide">{s.subjectName}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SavedSubjects;
