import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubjectCard = ({ data, source, isSaved, toggleSave, openChat, toggleCompare, isSelected }) => {
  const navigate = useNavigate();
  const subjectName = typeof data === 'string' ? data : (data.subject || data.name);
  const reasons = data.reasons || (data.specialty ? [data.specialty] : []);
  const item = typeof data === 'string' ? { subject: data } : data;

  const cardCls = "bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm hover:border-[var(--border-hover)] transition-colors";

  return (
    <div className={cardCls}>
      <div className="flex items-start justify-between">
        <span className="text-2xl">📚</span>
        <button onClick={() => toggleSave(subjectName, source)}
          className={`text-lg transition-transform hover:scale-110 ${isSaved ? 'text-[var(--accent-highlight)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-highlight)]'}`}>
          🔖
        </button>
      </div>
      <div>
        <p className="font-bold text-[var(--text-primary)] tracking-wide text-base">{subjectName}</p>
      </div>

      {reasons.length > 0 && (
        <div className="bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.2)] rounded-xl p-3 mt-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-success)] mb-1">Specialty:</p>
          {reasons.map((r, i) => <p key={i} className="text-xs text-[var(--color-success)] leading-snug">• {r}</p>)}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-[var(--border-glass)]">
        <button 
          onClick={(e) => { e.stopPropagation(); openChat(subjectName); }}
          className="flex-1 py-1.5 text-[9px] font-bold tracking-widest uppercase bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--accent-highlight)] border border-[var(--border-glass)] rounded-lg transition-colors flex items-center justify-center gap-1">
          💬 Chat
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/roadmap?subject=${encodeURIComponent(subjectName)}`); }}
          className="flex-1 py-1.5 text-[9px] font-bold tracking-widest uppercase bg-[rgba(52,211,153,0.05)] hover:bg-[rgba(52,211,153,0.1)] text-[var(--color-success)] border border-[rgba(52,211,153,0.2)] rounded-lg transition-colors flex items-center justify-center gap-1">
          🗺️ Roadmap
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleCompare(item.subject ? item : subjectName); }}
          className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest uppercase border rounded-lg transition-colors flex items-center justify-center gap-1
            ${isSelected 
              ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-inner' 
              : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-[var(--border-glass)]'}`}>
          ⚖️ Cmp
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;
