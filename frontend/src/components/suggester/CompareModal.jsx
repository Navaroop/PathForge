import React from 'react';

const CompareModal = ({ isOpen, onClose, selection, isLoading, result }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-primary)] rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-[var(--border-glass)] scale-in-center">
        <div className="px-6 py-5 border-b border-[var(--border-glass)] flex justify-between items-center bg-[var(--bg-surface)]">
          <h3 className="font-bold text-[var(--text-primary)] text-lg sm:text-xl flex items-center gap-3">
            <span className="text-2xl drop-shadow-sm">⚖️</span> 
            <span className="truncate max-w-md">{selection[0]?.subject} <span className="text-[var(--accent-highlight)] mx-2 text-sm">vs</span> {selection[1]?.subject}</span>
          </h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-full w-8 h-8 flex items-center justify-center font-bold pb-1 transition-colors shadow-sm">&times;</button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto bg-[var(--bg-primary)] relative flex-1 border-t border-[rgba(56,189,248,0.05)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-[var(--border-glass)] border-t-[var(--accent-highlight)] animate-spin" />
              <p className="text-[var(--accent-highlight)] font-bold animate-pulse text-sm tracking-widest uppercase">Analyzing & Comparing Syllabi...</p>
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none prose-headings:text-[var(--text-primary)] prose-strong:text-[var(--accent-highlight)] text-[var(--text-secondary)]">
              {result?.split('\n').map((line, i) => {
                if (line.startsWith('##')) return <h3 key={i} className="mt-6 mb-3 pb-2 border-b border-[var(--border-glass)] text-[var(--accent-highlight)] uppercase tracking-widest text-xs font-bold">{line.replace(/#/g, '').trim()}</h3>;
                if (line.startsWith('#')) return <h2 key={i} className="mt-6 mb-3 text-[var(--text-primary)]">{line.replace(/#/g, '').trim()}</h2>;
                if (line.startsWith('-') || line.startsWith('*')) return <li key={i} className="text-[var(--text-secondary)] ml-4 mb-1">{line.substring(1).trim()}</li>;
                if (line.trim() === '') return <div key={i} className="h-2" />;
                
                const parts = line.split(/(\*\*.*?\*\*)/).map((p, idx) => {
                   if (p.startsWith('**') && p.endsWith('**')) return <strong key={idx}>{p.slice(2, -2)}</strong>;
                   return p;
                });
                return <p key={i} className="text-[var(--text-secondary)] mb-2 leading-relaxed">{parts}</p>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
