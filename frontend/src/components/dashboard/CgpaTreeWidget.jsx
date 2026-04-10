import React from 'react';

const SEM_ORDER = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8',
];
const SEM_SHORT = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

function CgpaTreeWidget({ records, onClick }) {
  const validRecs = records.filter(s => s.gpa != null);
  const avgCgpa = validRecs.length > 0
    ? Math.round((validRecs.reduce((s, r) => s + r.gpa, 0) / validRecs.length) * 100) / 100
    : null;
  const bestGpa = validRecs.length > 0 ? Math.max(...validRecs.map(r => r.gpa)) : null;

  function zoneOf(g) {
    if (g === null) return {
      emoji: null, col: '#94a3b8', label: 'No data',
      glowBg: 'transparent', bar: '#e2e8f0',
      glowAnim: 'none', floatAnim: 'none',
    };
    if (g >= 8) return {
      emoji: '🌲', col: '#16a34a', label: 'Thriving',
      glowBg: 'rgba(34,197,94,.12)',
      bar: 'linear-gradient(90deg,#166534,#22c55e)',
      glowAnim: 'cgpa-glow-evergreen 2.5s ease-in-out infinite',
      floatAnim: 'cgpa-float 3.6s ease-in-out infinite',
    };
    if (g >= 6) return {
      emoji: '🪴', col: '#65a30d', label: 'Growing',
      glowBg: 'rgba(163,230,53,.10)',
      bar: 'linear-gradient(90deg,#365314,#a3e635)',
      glowAnim: 'cgpa-glow-potted 3s ease-in-out infinite',
      floatAnim: 'cgpa-float 3.2s ease-in-out infinite',
    };
    if (g >= 2) return {
      emoji: '🌱', col: '#d97706', label: 'Sprouting',
      glowBg: 'rgba(251,191,36,.09)',
      bar: 'linear-gradient(90deg,#92400e,var(--color-warning))',
      glowAnim: 'cgpa-glow-seedling 3.5s ease-in-out infinite',
      floatAnim: 'cgpa-float-fast 2.8s ease-in-out infinite',
    };
    return {
      emoji: '🥀', col: '#dc2626', label: 'Struggling',
      glowBg: 'rgba(248,113,113,.09)',
      bar: 'linear-gradient(90deg,#7f1d1d,var(--color-error))',
      glowAnim: 'cgpa-glow-wilted 4s ease-in-out infinite',
      floatAnim: 'cgpa-float-fast 2.5s ease-in-out infinite',
    };
  }

  const avgZone = zoneOf(avgCgpa);
  const ovrBarPct = avgCgpa !== null ? (avgCgpa / 10 * 100).toFixed(1) + '%' : '0%';
  const emojiSize = (g) => g === null ? 22 : Math.round(22 + (g / 10) * 26);

  const KEYFRAMES = `
    @keyframes cgpa-grow-in{0%{opacity:0;transform:scale(.25) translateY(14px);}65%{transform:scale(1.1) translateY(-4px);}100%{opacity:1;transform:scale(1) translateY(0);}}
    @keyframes cgpa-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
    @keyframes cgpa-float-fast{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}
    @keyframes cgpa-shimmer{0%{left:-80%;}100%{left:180%;}}
    @keyframes cgpa-bar-fill{from{width:0;}to{width:var(--cgpa-w);}}
    @keyframes cgpa-glow-evergreen{0%,100%{text-shadow:0 0 8px rgba(34,197,94,.45),0 0 22px rgba(34,197,94,.22),0 0 45px rgba(34,197,94,.1);}50%{text-shadow:0 0 18px rgba(34,197,94,.8),0 0 38px rgba(34,197,94,.45),0 0 70px rgba(34,197,94,.2);}}
    @keyframes cgpa-glow-potted{0%,100%{text-shadow:0 0 7px rgba(163,230,53,.38),0 0 18px rgba(163,230,53,.16);}50%{text-shadow:0 0 15px rgba(163,230,53,.65),0 0 32px rgba(163,230,53,.3);}}
    @keyframes cgpa-glow-seedling{0%,100%{text-shadow:0 0 6px rgba(251,191,36,.32),0 0 15px rgba(251,191,36,.13);}50%{text-shadow:0 0 13px rgba(251,191,36,.58),0 0 28px rgba(251,191,36,.24);}}
    @keyframes cgpa-glow-wilted{0%,100%{text-shadow:0 0 5px rgba(248,113,113,.28),0 0 12px rgba(248,113,113,.1);}50%{text-shadow:0 0 11px rgba(248,113,113,.45),0 0 24px rgba(248,113,113,.18);}}
  `;

  const T = {
    card: 'rgba(56,189,248,0.04)',
    border: 'rgba(56,189,248,0.12)',
    colBorder: 'rgba(56,189,248,0.12)',
    headerText: 'var(--text-primary)',
    subText: 'var(--text-secondary)',
    pillBg: 'rgba(56,189,248,0.02)',
    pillBorder: 'rgba(56,189,248,0.15)',
    trackBg: 'rgba(3,8,15,0.6)',
    markerColor: 'var(--accent-primary)',
    legendText: 'var(--accent-highlight)',
    legendBorder: 'rgba(56,189,248,0.15)',
    emptyText: 'var(--text-muted)',
  };

  return (
    <div onClick={onClick} className="cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-300" style={{
      background: T.card,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",
      boxShadow: '0 2px 16px rgba(124,110,249,0.08)',
    }}>
      <style>{KEYFRAMES}</style>

      {/* ── Header ── */}
      <div style={{ padding: '14px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.colBorder}` }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.headerText, letterSpacing: '.05em', textTransform: 'uppercase' }}>CGPA Growth Tracker</div>
          <div style={{ fontSize: 10, color: T.subText, marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Semester 1 → 8 · Auto-synced</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { v: avgCgpa !== null ? avgCgpa.toFixed(2) : '—', c: avgZone.col, l: 'Avg CGPA' },
            { v: bestGpa !== null ? bestGpa.toFixed(1) : '—', c: 'var(--accent-highlight)', l: 'Best GPA' },
            { v: avgCgpa !== null ? avgZone.label : 'No data', c: avgZone.col, l: 'Status' },
          ].map(p => (
            <div key={p.l} style={{ background: T.pillBg, border: `1px solid ${T.pillBorder}`, borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.c, lineHeight: 1 }}>{p.v}</div>
              <div style={{ fontSize: 9, color: T.subText, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>{p.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Emoji grid ── */}
      {validRecs.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: 44 }}>🌱</span>
          <p style={{ fontSize: 12, color: T.emptyText, marginTop: 10 }}>
            Add semester data in CGPA Tracker to see your growth
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)' }}>
          {records.map((slot, i) => {
            const z = zoneOf(slot.gpa);
            const sz = emojiSize(slot.gpa);
            const delay = (i * 0.09).toFixed(2) + 's';
            const fDelay = (i * 0.15).toFixed(2) + 's';
            const barW = slot.gpa !== null ? (slot.gpa / 10 * 100).toFixed(1) + '%' : '0%';
            const animStr = slot.gpa !== null
              ? `cgpa-grow-in .6s cubic-bezier(.34,1.56,.64,1) ${delay} both, cgpa-float ${3 + i * 0.1}s ease-in-out ${fDelay} infinite, ${z.glowAnim}`
              : 'none';

            return (
              <div key={slot.name} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '18px 4px 12px', position: 'relative',
                borderLeft: i > 0 ? `1px solid ${T.colBorder}` : 'none',
                transition: 'background .15s',
              }}>
                {/* Glow blob */}
                {slot.gpa !== null && (
                  <div style={{
                    position: 'absolute', width: sz + 24, height: sz + 24,
                    borderRadius: '50%', background: z.glowBg,
                    top: 20, filter: 'blur(16px)', pointerEvents: 'none',
                  }} />
                )}

                {/* Emoji */}
                <div style={{ height: sz + 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 8, position: 'relative', zIndex: 1 }}>
                  {slot.gpa !== null ? (
                    <span style={{
                      fontSize: sz,
                      fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                      display: 'inline-block', lineHeight: 1,
                      animation: animStr,
                    }}>
                      {z.emoji}
                    </span>
                  ) : (
                    <span style={{ fontSize: 20, opacity: .25 }}>—</span>
                  )}
                </div>

                {/* Mini GPA bar */}
                <div style={{ width: 'calc(100% - 10px)', height: 3, background: T.trackBg, borderRadius: 2, overflow: 'hidden', marginBottom: 6, position: 'relative' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, background: z.bar,
                    width: barW,
                    animation: slot.gpa !== null ? `cgpa-bar-fill .8s cubic-bezier(.4,0,.2,1) ${delay} both` : 'none',
                  }} />
                </div>

                {/* GPA value */}
                <div style={{ fontSize: 11, fontWeight: 700, color: z.col, lineHeight: 1, marginBottom: 3 }}>
                  {slot.gpa !== null ? slot.gpa.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 8.5, color: T.subText, fontWeight: 500, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  {slot.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Overall CGPA bar ── */}
      <div style={{ padding: '12px 18px 14px', borderTop: `1px solid ${T.colBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          <span style={{ fontSize: 10, color: T.subText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Overall CGPA</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: avgZone.col }}>
            {avgCgpa !== null ? avgCgpa.toFixed(2) : '—'}
          </span>
        </div>
        <div style={{ height: 6, background: T.trackBg, borderRadius: 3, overflow: 'hidden', marginBottom: 6, position: 'relative' }}>
          <div style={{
            height: '100%', borderRadius: 3, background: avgZone.bar,
            width: ovrBarPct,
            animation: 'cgpa-bar-fill 1.1s cubic-bezier(.4,0,.2,1) forwards',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, width: 40, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)', animation: 'cgpa-shimmer 2s ease-in-out infinite' }} />
          </div>
        </div>
        <div style={{ position: 'relative', height: 14 }}>
          {[{ p: '20%', l: '2.0' }, { p: '60%', l: '6.0' }, { p: '80%', l: '8.0' }].map(m => (
            <span key={m.l} style={{ position: 'absolute', left: m.p, transform: 'translateX(-50%)', fontSize: 8, color: T.markerColor, fontWeight: 500 }}>{m.l}</span>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', borderTop: `1px solid ${T.colBorder}` }}>
        {[
          { e: '🌲', l: '8–10 Thriving' },
          { e: '🪴', l: '6–8 Growing' },
          { e: '🌱', l: '2–6 Sprouting' },
          { e: '🥀', l: '0–2 Struggling' },
        ].map((item, i) => (
          <div key={item.e} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, padding: '8px 4px', fontSize: 10, color: T.legendText,
            borderLeft: i > 0 ? `1px solid ${T.legendBorder}` : 'none',
          }}>
            <span style={{ fontSize: 14, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{item.e}</span>
            {item.l}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CgpaTreeWidget;
