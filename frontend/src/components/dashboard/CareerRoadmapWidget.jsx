import React from 'react';

function CareerRoadmapWidget({ roadmap, progress, onClick }) {
  if (!roadmap) return null;
  let totalItems = 0;
  let completedItems = 0;
  if (roadmap.months) {
    roadmap.months.forEach((m, mIdx) => {
      m.weeks?.forEach((w, wIdx) => {
        w.topics?.forEach((t, tIdx) => {
          totalItems++;
          const key = `m${m.month ?? mIdx}_w${wIdx}_t${tIdx}`;
          if (progress[key]) completedItems++;
        });
      });
    });
  }
  if (roadmap.additionalTopics) {
    roadmap.additionalTopics.forEach((_, i) => {
      totalItems++;
      if (progress[`add_${i}`]) completedItems++;
    });
  }
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  return (
    <div onClick={onClick} className="cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:scale-[1.01] transition-all duration-300" style={{
      background: 'rgba(56,189,248,0.04)', borderRadius: 20, border: '1px solid rgba(56,189,248,0.12)', padding: '16px 20px', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Career Roadmap Progress</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-highlight)', marginTop: 4 }}>{roadmap.career}</div>
        </div>
        <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 12, padding: '4px 10px' }}>
           <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-highlight)' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(3,8,15,0.6)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-primary)', borderRadius: 3, transition: 'width 1s ease-in-out' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
        <span>{completedItems} topics completed</span>
        <span>{totalItems} total learning milestones</span>
      </div>
    </div>
  );
}

export default CareerRoadmapWidget;
