import React from 'react';

function FireAttendanceWidget({ records, onClick }) {
  const att = records.reduce((s, r) => s + (r.attendedClasses || 0), 0);
  const tot = records.reduce((s, r) => s + (r.totalClasses || 0), 0);
  const pct = tot > 0 ? (att / tot * 100) : 0;

  const zone = pct >= 75 ? 'green' : pct >= 65 ? 'yellow' : 'red';

  const barBg =
    zone === 'green' ? 'linear-gradient(90deg,#22c55e,#16a34a)' :
      zone === 'yellow' ? 'linear-gradient(90deg,var(--color-warning),#f97316)' :
        'linear-gradient(90deg,var(--color-error),#ef4444)';

  const pctColor =
    zone === 'green' ? '#16a34a' : zone === 'yellow' ? '#d97706' : '#dc2626';

  const badge =
    zone === 'green' ? { text: 'On Fire! 🔥', color: '#16a34a', bg: '#dcfce7' } :
      zone === 'yellow' ? { text: 'Warming Up ⚠️', color: '#d97706', bg: '#fef3c7' } :
        { text: 'Danger! ⛔', color: '#dc2626', bg: '#fee2e2' };

  const fireAnim =
    zone === 'green' ? 'fire-blaze' :
      zone === 'yellow' ? 'fire-warm' :
        'fire-dim';

  return (
    <div onClick={onClick} className="cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] hover:scale-[1.01] transition-all duration-300" style={{
      background: 'rgba(56,189,248,0.04)',
      borderRadius: '20px',
      padding: '20px 22px 18px',
      border: '1px solid rgba(56,189,248,0.12)',
    }}>
      <style>{`
        @keyframes fire-blaze-kf {
          0%,100% { text-shadow:0 0 14px #ff4500,0 0 28px #ff6a00; transform:scale(1.08); }
          50%      { text-shadow:0 0 24px #ff4500,0 0 48px #ffd700; transform:scale(1.15); }
        }
        @keyframes fire-warm-kf {
          0%,100% { text-shadow:0 0 6px #f97316; transform:scale(1); }
          50%      { text-shadow:0 0 14px #fb923c; transform:scale(1.05); }
        }
        @keyframes fire-dim-kf {
          0%,100% { opacity:.6; transform:scale(.85); }
          50%      { opacity:.72; transform:scale(.88); }
        }
        .fire-blaze { animation: fire-blaze-kf 1.4s ease-in-out infinite; }
        .fire-warm  { animation: fire-warm-kf  2s   ease-in-out infinite; opacity:.85; }
        .fire-dim   { animation: fire-dim-kf   2.5s ease-in-out infinite;
                      filter:grayscale(.45); font-size:1.8rem !important; }
        @keyframes att-shimmer {
          0%   { left:-80%; }
          100% { left:180%; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Fire Check</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>All subjects combined</div>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 12px', borderRadius: 20,
          fontWeight: 800, background: badge.bg, color: badge.color,
          border: `1px solid ${badge.color}40`
        }}>
          {badge.text}
        </span>
      </div>

      {/* Fire emoji */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <span className={fireAnim} style={{ fontSize: '2.6rem', display: 'inline-block' }}>🔥</span>
      </div>

      {/* Zone marker labels */}
      <div style={{ position: 'relative', height: 14, marginBottom: 2 }}>
        <span style={{ position: 'absolute', left: '65%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--accent-highlight)', fontWeight: 800 }}>65%</span>
        <span style={{ position: 'absolute', left: '75%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--accent-highlight)', fontWeight: 800 }}>75%</span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 28, background: 'rgba(3,8,15,0.6)', borderRadius: 14,
        overflow: 'hidden', border: '1px solid rgba(56,189,248,0.2)', position: 'relative',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: barBg,
          borderRadius: 14, position: 'relative', overflow: 'hidden',
          transition: 'width .7s cubic-bezier(.4,0,.2,1), background .5s',
          boxShadow: `0 0 15px ${pctColor}60`
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
            background: 'rgba(255,255,255,.28)', borderRadius: '14px 14px 0 0',
          }} />
          <div style={{
            position: 'absolute', top: 0, bottom: 0, width: 70,
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)',
            animation: 'att-shimmer 2.2s ease-in-out infinite',
          }} />
        </div>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '65%',
          width: 1.5, background: 'rgba(56,189,248,.4)', zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '75%',
          width: 1.5, background: 'rgba(56,189,248,.4)', zIndex: 2,
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
        {[
          { label: 'Overall', value: tot > 0 ? pct.toFixed(2) + '%' : '—', color: pctColor },
          { label: 'Attended', value: att, color: 'var(--accent-highlight)' },
          { label: 'Total', value: tot, color: 'var(--accent-highlight)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(56,189,248,0.02)', borderRadius: 12, padding: 10,
            textAlign: 'center', border: '1px solid rgba(56,189,248,0.12)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {records.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 10, fontWeight: 600 }}>
          No attendance data yet — add subjects in Attendance page
        </div>
      )}
    </div>
  );
}

export default FireAttendanceWidget;
