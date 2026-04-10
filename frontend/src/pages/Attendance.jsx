import axiosClient from '../api/axiosClient';
import React, { useState, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SCHEDULE_KEY = 'weekly_schedule';
const THRESHOLD = 75;

// ── Utility ────────────────────────────────────────────────────
const getPct = (a, t) => t > 0 ? parseFloat(((a / t) * 100).toFixed(2)) : 0;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// How many more classes to reach threshold (overall or per subject)
function classesNeeded(attended, total, threshold = THRESHOLD) {
  // need: (attended + x) / (total + x) >= threshold/100
  // => attended + x >= threshold/100 * (total + x)
  // => x*(1 - threshold/100) >= threshold/100*total - attended
  const t = threshold / 100;
  if (getPct(attended, total) >= threshold) return 0;
  return Math.ceil((t * total - attended) / (1 - t));
}

// How many classes can be safely missed while staying >= threshold
function canSkip(attended, total, threshold = THRESHOLD) {
  const t = threshold / 100;
  // (attended) / (total + x) >= t  => total + x <= attended/t
  // x <= attended/t - total
  const result = Math.floor(attended / t - total);
  return Math.max(0, result);
}

// Forecast: given current + N weeks of schedule, what is attendance?
function forecast(attended, total, weeklyClasses, weeks) {
  const futureTotal = total + weeklyClasses * weeks;
  const futureAttended = attended + weeklyClasses * weeks; // assume all attended
  return {
    allAttend: getPct(futureAttended, futureTotal),
    missOne: getPct(futureAttended - weeks, futureTotal), // miss 1/week
    missAll: getPct(attended, futureTotal),               // stop attending
  };
}

function Attendance() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', attended: '', total: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // ── New state for added features ──────────────────────────
  const [sortBy, setSortBy] = useState('none'); // none | asc | desc | name
  const [filterMode, setFilterMode] = useState('all');  // all | danger | warning | safe
  const [forecastWeeks, setForecastWeeks] = useState(4);
  const [activeTab, setActiveTab] = useState('subjects'); // subjects | calculator | forecast

  const [schedule, setSchedule] = useState({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 });
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  // ── AI Advice State ──
  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(false);

  useEffect(() => { fetchAttendance(); fetchSchedule(); }, []);
  
  const fetchSchedule = async () => {
    try {
      const res = await axiosClient.get('/api/attendance/schedule');
      setSchedule(res.data);
    } catch { console.error('Failed to load schedule from DB'); }
    finally { setScheduleLoaded(true); }
  };

  useEffect(() => {
    if (scheduleLoaded) {
      // Debounce saving schedule to backend and localStorage for offline caching
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
      
      const timeoutId = setTimeout(() => {
        axiosClient.put('/api/attendance/schedule', schedule)
          .catch(err => console.error("Failed to save schedule update:", err));
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [schedule, scheduleLoaded]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/attendance');
      setSubjects(res.data.map(r => ({
        id: r.id, name: r.subjectName,
        attended: r.attendedClasses, total: r.totalClasses,
      })));
    } catch { setError('Failed to load attendance data.'); }
    finally { setLoading(false); }
  };

  // ── Backend ops ──────────────────────────────────────────
  const handleEdit = async (id, field, value) => {
    const num = Math.max(0, Number(value) || 0);
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: num } : s));
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;
    const updated = { ...subject, [field]: num };
    try {
      await axiosClient.put(`/api/attendance/${id}`, {
        attendedClasses: Number(updated.attended),
        totalClasses: Number(updated.total),
      });
    } catch { setError('Failed to update.'); }
  };

  // Quick +1 — increments attended by 1 AND total by 1
  const quickIncrement = async (id) => {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;
    const newAtt = Number(subject.attended) + 1;
    const newTot = Number(subject.total) + 1;
    setSubjects(prev => prev.map(s => s.id === id
      ? { ...s, attended: newAtt, total: newTot } : s));
    try {
      await axiosClient.put(`/api/attendance/${id}`, { attendedClasses: newAtt, totalClasses: newTot });
    } catch { setError('Failed to update.'); }
  };

  // Quick +1 total only (missed class)
  const quickMiss = async (id) => {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;
    const newTot = Number(subject.total) + 1;
    setSubjects(prev => prev.map(s => s.id === id
      ? { ...s, total: newTot } : s));
    try {
      await axiosClient.put(`/api/attendance/${id}`, {
        attendedClasses: Number(subject.attended),
        totalClasses: newTot,
      });
    } catch { setError('Failed to update.'); }
  };

  const handleRemove = async (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    try {
      await axiosClient.delete(`/api/attendance/${id}`);
    } catch { setError('Failed to delete.'); fetchAttendance(); }
  };

  const handleAdd = async () => {
    if (!newSubject.name.trim()) { setError('Subject name required.'); return; }
    if (Number(newSubject.attended) > Number(newSubject.total)) {
      setError('Attended > Total.'); return;
    }
    setError(''); setSaving(true);
    try {
      const res = await axiosClient.post('/api/attendance', {
        subjectName: newSubject.name.trim(),
        attendedClasses: Number(newSubject.attended) || 0,
        totalClasses: Number(newSubject.total) || 0,
      });
      const data = res.data;
      setSubjects(prev => [...prev, {
        id: data.id, name: data.subjectName,
        attended: data.attendedClasses, total: data.totalClasses,
      }]);
      setNewSubject({ name: '', attended: '', total: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subject.');
    } finally {
      setSaving(false);
    }
  };

  const getAiAdvice = async () => {
    setAdviceLoading(true);
    try {
      const summary = subjects.map(s => `${s.name}: ${getPct(s.attended, s.total)}% (${s.attended}/${s.total})`).join('\n');
      const res = await axiosClient.post('/api/ai/chat', {
        feature: "attendance_suggestions",
        system: "You are an attendance advisor. Analyze the student's current attendance per subject and overall. Give specific, motivating advice on how to reach the 75% threshold. Be concise.",
        message: `Overall: ${overallPct.toFixed(2)}%\nTotal Attended: ${totalAttended}\nTotal Classes: ${totalClasses}\nClasses per week: ${weeklyClasses}\n\nSubject Breakdown:\n${summary}`
      });
      setAdvice(res.data.response || res.data.analysis || "");
    } catch {
      setError('Failed to get AI advice.');
    } finally {
      setAdviceLoading(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────
  const totalAttended = subjects.reduce((s, r) => s + Number(r.attended), 0);
  const totalClasses = subjects.reduce((s, r) => s + Number(r.total), 0);
  const overallPct = getPct(totalAttended, totalClasses);
  const weeklyClasses = Object.values(schedule).reduce((s, v) => s + Number(v || 0), 0);
  const overallNeeded = classesNeeded(totalAttended, totalClasses);
  const overallSkip = canSkip(totalAttended, totalClasses);

  // ── Sort + Filter pipeline ────────────────────────────────
  const processed = subjects
    .filter(s => {
      const p = getPct(s.attended, s.total);
      if (filterMode === 'danger') return p < 65;
      if (filterMode === 'warning') return p >= 65 && p < 75;
      if (filterMode === 'safe') return p >= 75;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'asc') return getPct(a.attended, a.total) - getPct(b.attended, b.total);
      if (sortBy === 'desc') return getPct(b.attended, b.total) - getPct(a.attended, a.total);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  // ── Colour helpers ────────────────────────────────────────
  const zoneColor = (p) => p >= 75 ? 'text-[var(--color-success)]' : p >= 65 ? 'text-[var(--color-warning)]' : 'text-red-400';
  const zonePill = (p) => p >= 75 ? 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]' : p >= 65 ? 'bg-[rgba(251,191,36,0.1)] text-[var(--color-warning)]' : 'bg-[rgba(248,113,113,0.1)] text-red-400';
  const zoneBar = (p) => p >= 75 ? 'bg-[var(--color-success)]' : p >= 65 ? 'bg-[var(--color-warning)]' : 'bg-red-400';
  const zoneBorder = (p) => p >= 75 ? 'border-l-4 border-l-[var(--color-success)] border-[var(--border-glass)]' : p >= 65 ? 'border-l-4 border-l-[var(--color-warning)] border-[var(--border-glass)]' : 'border-l-4 border-l-red-400 border-[var(--border-glass)]';
  const zoneBg = (p) => p >= 75 ? 'bg-[rgba(52,211,153,0.03)]' : p >= 65 ? 'bg-[rgba(251,191,36,0.03)]' : 'bg-[rgba(248,113,113,0.03)]';

  const inputCls = "w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition";
  const tabBtn = (t) => `px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeTab === t ? 'bg-[var(--accent-primary)] text-white shadow-[var(--card-shadow)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`;

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin text-3xl text-[var(--accent-highlight)]">✦</div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Attendance Tracker</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Track, forecast and manage your attendance</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-glass)] text-[var(--accent-highlight)] font-bold text-sm shadow-[0_0_10px_rgba(56,189,248,0.1)] hover:bg-[rgba(56,189,248,0.15)] transition-all">
          <span className="text-lg leading-none">{showForm ? '✕' : '+'}</span>
          {showForm ? 'Cancel' : 'Add Subject'}
        </button>
      </div>

      {/* ── Add Subject Form ── */}
      {showForm && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">New Subject</h3>
          {error && <p className="text-red-400 text-sm bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.2)] rounded-xl px-4 py-2 mb-4">{error}</p>}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-1 block">Subject Name</label>
              <input type="text" placeholder="e.g. Mathematics" value={newSubject.name}
                onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-1 block">Classes Attended</label>
                <input type="number" placeholder="38" value={newSubject.attended}
                  onChange={e => setNewSubject({ ...newSubject, attended: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-1 block">Total Classes</label>
                <input type="number" placeholder="45" value={newSubject.total}
                  onChange={e => setNewSubject({ ...newSubject, total: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="mt-5 px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow-[var(--card-shadow)] hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Saving...' : 'Add Subject'}
          </button>
        </div>
      )}

      {/* ── Overall Banner ── */}
      <div className="relative rounded-2xl overflow-hidden p-6 bg-[var(--bg-surface)] border border-[var(--border-glass)] shadow-sm">
        <div className="absolute -top-6 -left-6 w-40 h-40 bg-[var(--accent-highlight)] opacity-5 rounded-full blur-2xl" />
        <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-[rgba(52,211,153,0.2)] opacity-10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest font-semibold">Overall Attendance</p>
              <p className="text-4xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">{overallPct.toFixed(2)}%</p>
              <p className={`text-xs font-semibold mt-1 px-2.5 py-0.5 rounded-full w-max ${overallPct >= 75 ? 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]' : overallPct >= 65 ? 'bg-[rgba(251,191,36,0.1)] text-[var(--color-warning)]' : 'bg-[rgba(248,113,113,0.1)] text-red-400'}`}>
                {overallPct >= 75 ? '✓ You are safe' : overallPct >= 65 ? '⚠ Attend more classes' : '⛔ Critical — below 75%'}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {/* Classes Attended */}
              <div className="bg-[var(--bg-surface)] rounded-2xl px-5 py-3 text-center border border-[rgba(56,189,248,0.08)]">
                <p className="text-2xl font-black text-[var(--text-primary)]">{totalAttended}</p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mt-1 font-semibold">Attended</p>
              </div>
              {/* Total Classes */}
              <div className="bg-[var(--bg-surface)] rounded-2xl px-5 py-3 text-center border border-[rgba(56,189,248,0.08)]">
                <p className="text-2xl font-black text-[var(--text-primary)]">{totalClasses}</p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mt-1 font-semibold">Total Held</p>
              </div>
              {/* Need / Can Skip */}
              <div className={`rounded-2xl px-5 py-3 text-center border ${overallPct >= 75 ? 'bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.15)]' : 'bg-[rgba(248,113,113,0.05)] border-[rgba(248,113,113,0.15)]'}`}>
                {overallPct >= 75 ? (
                  <>
                    <p className="text-2xl font-black text-[var(--color-success)]">{overallSkip}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-success)] mt-1 font-semibold">Can Skip</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-red-400">{overallNeeded}</p>
                    <p className="text-[10px] uppercase tracking-widest text-red-400 mt-1 font-semibold">Need to Attend</p>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden relative">
            <div className={`h-full rounded-full transition-all duration-500 ${zoneBar(overallPct)}`}
              style={{ width: `${overallPct}%`, boxShadow: `0 0 10px ${overallPct >= 75 ? 'var(--color-success)' : overallPct >= 65 ? 'var(--color-warning)' : 'var(--color-error)'}` }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--bg-primary)]/50" style={{ left: '65%' }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--bg-primary)]/50" style={{ left: '75%' }} />
          </div>
          <div className="relative mt-1 h-3">
            <span className="absolute text-[9px] text-[var(--color-warning)] font-semibold" style={{ left: '65%', transform: 'translateX(-50%)' }}>65%</span>
            <span className="absolute text-[9px] text-[var(--color-success)] font-semibold" style={{ left: '75%', transform: 'translateX(-50%)' }}>75%</span>
          </div>
        </div>

      </div>

      {/* ── Two-column: Current Attendance stats + Weekly Schedule ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Current Attendance */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">Current Attendance</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold text-center mb-2">Classes Attended</p>
              <div className="bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.08)] rounded-xl py-5 text-center">
                <span className="text-4xl font-black text-[var(--text-primary)]">{totalAttended}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold text-center mb-2">Total Classes Held</p>
              <div className="bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.08)] rounded-xl py-5 text-center">
                <span className="text-4xl font-black text-[var(--text-primary)]">{totalClasses}</span>
              </div>
            </div>
          </div>
          {/* Need / Skip info */}
          <div className={`mt-4 rounded-xl px-4 py-3 ${overallPct >= 75 ? 'bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.15)]' : 'bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.15)]'}`}>
            {overallPct >= 75 ? (
              <p className="text-xs text-[var(--color-success)] font-medium">
                ✓ You can safely skip <span className="font-black text-[var(--text-primary)] tracking-wide">{overallSkip}</span> more {overallSkip === 1 ? 'class' : 'classes'} overall.
              </p>
            ) : (
              <p className="text-xs text-red-400 font-medium">
                ⚠ Attend <span className="font-black text-[var(--text-primary)] tracking-wide">{overallNeeded}</span> more {overallNeeded === 1 ? 'class' : 'classes'} to reach 75%.
              </p>
            )}
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">Weekly Schedule</h2>
            </div>
            <span className="text-[10px] uppercase text-[var(--accent-highlight)] font-semibold bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded-full">{weeklyClasses} classes/week</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {DAYS.map(day => (
              <div key={day} className="flex flex-col items-center gap-2">
                <div className="w-full py-1.5 rounded-md text-center text-[10px] font-bold bg-[var(--bg-surface-hover)] text-[var(--accent-highlight)] uppercase tracking-wider">
                  {day}
                </div>
                <input type="number" min="0" max="20" value={schedule[day]}
                  onChange={e => {
                    const num = clamp(parseInt(e.target.value) || 0, 0, 20);
                    setSchedule(prev => ({ ...prev, [day]: num }));
                  }}
                  className="w-full text-center bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl py-2 text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {DAYS.filter(d => schedule[d] > 0).map(day => (
              <span key={day} className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-[var(--accent-highlight)] font-bold uppercase tracking-widest">
                {day}: {schedule[day]}
              </span>
            ))}
            {weeklyClasses === 0 && <p className="text-xs text-[var(--text-muted)]">Enter classes per day above</p>}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-3xl p-1.5 flex gap-1">
        {[
          { id: 'subjects', label: '📚 Subjects' },
          { id: 'calculator', label: '🧮 Bunk Calculator' },
          { id: 'forecast', label: '📈 Attendance Forecast' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={tabBtn(t.id)} style={{ flex: 1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB 1: SUBJECTS
      ══════════════════════════════════════════════ */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">

          {/* Sort + Filter bar */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">Sort:</span>
                {[
                  { v: 'none', l: 'Default' },
                  { v: 'asc', l: '% Low→High' },
                  { v: 'desc', l: '% High→Low' },
                  { v: 'name', l: 'A–Z' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setSortBy(opt.v)}
                    className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full font-bold transition-all ${sortBy === opt.v ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-surface)] text-[var(--accent-highlight)] hover:bg-[var(--bg-surface-hover)]'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">Filter:</span>
                {[
                  { v: 'all', l: 'All', cls: 'bg-[var(--accent-primary)] text-white' },
                  { v: 'danger', l: '⛔ Danger', cls: 'bg-[rgba(248,113,113,0.15)] text-red-400 border border-[rgba(248,113,113,0.3)]' },
                  { v: 'warning', l: '⚠ Warning', cls: 'bg-[rgba(251,191,36,0.15)] text-[var(--color-warning)] border border-[rgba(251,191,36,0.3)]' },
                  { v: 'safe', l: '✓ Safe', cls: 'bg-[rgba(52,211,153,0.15)] text-[var(--color-success)] border border-[rgba(52,211,153,0.3)]' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setFilterMode(opt.v)}
                    className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full font-bold transition-all border border-transparent ${filterMode === opt.v ? opt.cls : 'bg-[var(--bg-surface)] text-[var(--accent-highlight)] hover:bg-[var(--bg-surface-hover)]'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {processed.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">{subjects.length === 0 ? '📭' : '🔍'}</p>
              <p className="text-[var(--text-primary)] font-semibold">
                {subjects.length === 0 ? 'No subjects added yet.' : 'No subjects match this filter.'}
              </p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                {subjects.length === 0 ? 'Click "Add Subject" to get started.' : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                  Subject Breakdown
                  {filterMode !== 'all' && <span className="text-[var(--accent-highlight)] font-normal ml-2">({processed.length} of {subjects.length})</span>}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {processed.map((subject) => {
                  const pct = getPct(subject.attended, subject.total);
                  const needed = classesNeeded(subject.attended, subject.total);
                  const skip = canSkip(subject.attended, subject.total);
                  return (
                    <div key={subject.id}
                      className={`bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm ${zoneBorder(pct)} ${zoneBg(pct)}`}>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex-1 min-w-[120px]">
                          <p className="font-semibold text-[var(--text-primary)]">{subject.name}</p>
                          <p className={`text-[10px] uppercase tracking-widest font-bold mt-0.5 ${zoneColor(pct)}`}>
                            {pct.toFixed(2)}% attendance
                          </p>
                          {/* Need/skip hint */}
                          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
                            {pct >= 75
                              ? `Can skip ${skip} more class${skip !== 1 ? 'es' : ''}`
                              : `Need ${needed} more class${needed !== 1 ? 'es' : ''} to reach 75%`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Quick +1 attended */}
                          <button onClick={() => quickIncrement(subject.id)}
                            title="Mark class attended (+1 attended, +1 total)"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[rgba(52,211,153,0.1)] text-[var(--color-success)] border border-[rgba(52,211,153,0.2)] text-[10px] uppercase tracking-widest font-bold hover:bg-[rgba(52,211,153,0.2)] transition-colors">
                            ✓ +1
                          </button>
                          {/* Quick miss */}
                          <button onClick={() => quickMiss(subject.id)}
                            title="Mark class missed (+1 total only)"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[rgba(248,113,113,0.1)] text-red-400 border border-[rgba(248,113,113,0.2)] text-[10px] uppercase tracking-widest font-bold hover:bg-[rgba(248,113,113,0.2)] transition-colors">
                            ✗ Miss
                          </button>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="text-center">
                            <p className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] mb-1 font-semibold">Attended</p>
                            <input type="number" value={subject.attended}
                              onChange={e => handleEdit(subject.id, 'attended', e.target.value)}
                              className="w-16 text-center bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                          </div>
                          <span className="text-[var(--text-muted)] font-bold">/</span>
                          <div className="text-center">
                            <p className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] mb-1 font-semibold">Total</p>
                            <input type="number" value={subject.total}
                              onChange={e => handleEdit(subject.id, 'total', e.target.value)}
                              className="w-16 text-center bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                          </div>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${zonePill(pct)}`}>{pct.toFixed(2)}%</span>
                          <button onClick={() => handleRemove(subject.id)}
                            className="text-[var(--text-muted)] hover:text-red-400 transition-colors text-lg font-bold leading-none">✕</button>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${zoneBar(pct)}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 2: BUNK CALCULATOR
      ══════════════════════════════════════════════ */}
      {activeTab === 'calculator' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">See exactly how many classes you can skip — or how many you must attend — per subject to stay at 75%.</p>

          {subjects.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">🧮</p>
              <p className="text-[var(--text-secondary)] font-medium">Add subjects first to use the calculator.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Overall row */}
              <div className="bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.08)] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-sm">Overall (All Subjects)</p>
                  <p className="text-xs text-[var(--accent-highlight)] mt-0.5">{totalAttended}/{totalClasses} · {overallPct.toFixed(2)}%</p>
                </div>
                {overallPct >= 75 ? (
                  <div className="bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] rounded-xl px-4 py-2 text-center">
                    <p className="text-xl font-black text-[var(--color-success)] tracking-wide">{overallSkip}</p>
                    <p className="text-[9px] uppercase tracking-widest text-[var(--color-success)] font-bold">can skip</p>
                  </div>
                ) : (
                  <div className="bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] rounded-xl px-4 py-2 text-center">
                    <p className="text-xl font-black text-red-400 tracking-wide">{overallNeeded}</p>
                    <p className="text-[9px] uppercase tracking-widest text-red-400 font-bold">must attend</p>
                  </div>
                )}
              </div>

              {/* Per-subject rows */}
              {subjects.map(subject => {
                const pct = getPct(subject.attended, subject.total);
                const needed = classesNeeded(subject.attended, subject.total);
                const skip = canSkip(subject.attended, subject.total);
                const isSafe = pct >= 75;
                return (
                  <div key={subject.id}
                    className={`bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 ${zoneBorder(pct)}`}>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--text-primary)] text-sm">{subject.name}</p>
                      <p className={`text-[10px] tracking-wide uppercase font-bold mt-1 ${zoneColor(pct)}`}>{pct.toFixed(2)}%  · {subject.attended}/{subject.total}</p>
                    </div>
                    {/* Bunk / Need */}
                    <div className={`rounded-xl px-4 py-2 text-center border ${isSafe ? 'bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.15)]' : 'bg-[rgba(248,113,113,0.05)] border-[rgba(248,113,113,0.15)]'}`}>
                      <p className={`text-xl font-black tracking-wide ${isSafe ? 'text-[var(--color-success)]' : 'text-red-400'}`}>
                        {isSafe ? skip : needed}
                      </p>
                      <p className={`text-[9px] uppercase tracking-widest font-bold mt-0.5 ${isSafe ? 'text-[var(--color-success)]' : 'text-red-400'}`}>
                        {isSafe ? 'can skip' : 'must attend'}
                      </p>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full mt-2">
                      <div className="h-1.5 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${zoneBar(pct)} transition-all duration-500`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="relative h-3">
                        <span className="absolute text-[8px] text-[var(--text-secondary)] font-bold" style={{ left: '75%', transform: 'translateX(-50%)' }}>75%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 3: FORECAST
      ══════════════════════════════════════════════ */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Based on your weekly schedule ({weeklyClasses} classes/week), see how your attendance changes over upcoming weeks.
            </p>

            {/* Week selector */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">Forecast for</span>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map(w => (
                  <button key={w} onClick={() => setForecastWeeks(w)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${forecastWeeks === w ? 'bg-[var(--accent-primary)] text-white shadow-[var(--card-shadow)]' : 'bg-[var(--bg-surface)] text-[var(--accent-highlight)] border border-[var(--border-glass)] hover:bg-[var(--bg-surface-hover)]'}`}>
                    {w} weeks
                  </button>
                ))}
              </div>
              {weeklyClasses === 0 && (
                <span className="text-[10px] uppercase font-bold text-[var(--color-warning)] bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.3)] rounded-full px-3 py-1.5">
                  ⚠ Set weekly schedule first
                </span>
              )}
            </div>

            {/* Overall forecast card */}
            {weeklyClasses > 0 && (() => {
              const fc = forecast(totalAttended, totalClasses, weeklyClasses, forecastWeeks);
              return (
                <div className="bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.08)] rounded-2xl p-4 mb-4">
                  <p className="text-[10px] font-bold text-[var(--accent-highlight)] mb-3 uppercase tracking-widest">
                    Overall — after {forecastWeeks} weeks
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'If you attend all', val: fc.allAttend, icon: '🏆' },
                      { label: 'If you miss 1/week', val: fc.missOne, icon: '⚠️' },
                      { label: 'If you stop attending', val: fc.missAll, icon: '⛔' },
                    ].map(s => (
                      <div key={s.label} className={`rounded-xl p-3 text-center ${s.val >= 75 ? 'bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.15)]' : 'bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.15)]'}`}>
                        <div className="text-lg mb-1">{s.icon}</div>
                        <p className={`text-xl font-black ${s.val >= 75 ? 'text-[var(--color-success)]' : 'text-red-400'}`}>
                          {s.val.toFixed(2)}%
                        </p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mt-1 leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Per-subject forecast */}
            {weeklyClasses > 0 && subjects.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)]">Per Subject Forecast</h3>
                {subjects.map(subject => {
                  // Split weekly classes roughly equally per subject
                  const perSubj = Math.round(weeklyClasses / subjects.length);
                  const fc = forecast(subject.attended, subject.total, perSubj, forecastWeeks);
                  const currPct = getPct(subject.attended, subject.total);
                  return (
                    <div key={subject.id}
                      className={`bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-4 ${zoneBorder(currPct)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-[var(--text-primary)] text-sm">{subject.name}</p>
                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${zonePill(currPct)}`}>
                          Now: {currPct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'All attended', val: fc.allAttend, icon: '✓' },
                          { label: 'Miss 1/week', val: fc.missOne, icon: '~' },
                          { label: 'Stop going', val: fc.missAll, icon: '✗' },
                        ].map(s => (
                          <div key={s.label} className={`rounded-xl p-2.5 text-center ${s.val >= 75 ? 'bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.15)]' : 'bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.15)]'}`}>
                            <p className={`text-sm font-black ${s.val >= 75 ? 'text-[var(--color-success)]' : 'text-red-400'}`}>
                              {s.val.toFixed(2)}%
                            </p>
                            <p className="text-[8px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mt-1">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {weeklyClasses === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📅</p>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Set your weekly schedule above to see the forecast.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Advice Card */}
      <div className="mt-8 bg-[rgba(56,189,248,0.03)] border border-[rgba(56,189,248,0.15)] rounded-2xl shadow-sm overflow-hidden">
        {/* Header - Always Visible */}
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-[rgba(56,189,248,0.04)] transition-colors"
          onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[rgba(14,165,233,0.1)] flex items-center justify-center border border-[rgba(14,165,233,0.2)]">
                <span className="text-xl">✦</span>
             </div>
             <div>
                <h3 className="font-bold text-[var(--text-primary)]">AI Attendance Strategy</h3>
                <p className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold mt-0.5">Custom Guidance</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); getAiAdvice(); }} 
              disabled={adviceLoading}
              className="px-4 py-2 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-black tracking-widest uppercase shadow hover:opacity-90 transition-all disabled:opacity-50"
            >
              {adviceLoading ? '✦ Analyzing...' : (advice ? '✦ Refresh' : '✦ Ask AI Strategy')}
            </button>
            <span className={`text-[#1e3a8a] text-xs transition-transform duration-300 ${isAdviceExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>

        {/* Collapsible Content */}
        {isAdviceExpanded && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {advice ? (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-xl p-5 text-sm text-[var(--text-secondary)] leading-relaxed italic whitespace-pre-wrap">
                "{advice}"
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
                <p className="text-sm text-[var(--text-muted)] italic">Get personalized advice on how to manage your attendance and reach your goals.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default Attendance;