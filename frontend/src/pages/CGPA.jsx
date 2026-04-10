import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import {
  GRADE_POINTS, ALL_GRADES, NORMAL_GRADES, pctToGrade, calcWGP, calcLabTheory, getEffectiveGP, getEffectiveGrade, calcGPA, calcCGPA
} from '../utils/cgpaUtils';

const defaultSub = () => ({
  name: '', credits: '', grade: 'O',
  inputMode: 'simple',      // 'simple' = direct grade+credits | 'detailed' = S1/S2/LE
  gradingMode: 'relative',
  labEnabled: false,
  s1Grade: 'O', s2Grade: 'O', leGrade: 'O',
  marksObtained: '', maxMarks: '100',
  labMarks: '',
});

const gradePill = (g) => ({
  O: 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]', 'A+': 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa]',
  A: 'bg-[rgba(59,130,246,0.1)] text-[#60a5fa]', 'B+': 'bg-[rgba(251,191,36,0.1)] text-[var(--color-warning)]',
  B: 'bg-[rgba(249,115,22,0.1)] text-[#fb923c]', C: 'bg-[rgba(248,113,113,0.1)] text-[var(--color-error)]',
  P: 'bg-[rgba(148,163,184,0.1)] text-[#94a3b8]', F: 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]',
  I: 'bg-[rgba(148,163,184,0.1)] text-[#94a3b8]', 'Ab/R': 'bg-[rgba(239,68,68,0.1)] text-red-500',
  'L/AB': 'bg-[rgba(239,68,68,0.1)] text-red-600',
}[g] || 'bg-[rgba(148,163,184,0.1)] text-gray-500');

// ── Step-by-step calculation preview ─────────────────────────
function StepCalc({ sub }) {
  const isSpecial = ['I', 'Ab/R', 'L/AB'].includes(sub.grade);
  if (isSpecial) return null;

  if (sub.gradingMode === 'absolute') {
    const maxM = Number(sub.maxMarks) || 100;
    const obt = Number(sub.marksObtained) || 0;
    const pct = maxM > 0 ? (obt / maxM) * 100 : 0;
    const absResult = pctToGrade(pct);
    return (
      <div className="space-y-2 mt-3">
        <div className="bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.08)] rounded-xl p-4 font-mono text-xs space-y-1">
          <p className="text-[var(--accent-highlight)] font-semibold mb-2 uppercase tracking-widest text-[10px]">📋 Absolute Grading</p>
          <p className="text-[var(--text-secondary)]">Percentage = ({obt} ÷ {maxM}) × 100 = <span className="text-[var(--text-primary)]">{pct.toFixed(2)}%</span></p>
          <p className="text-[var(--text-primary)] font-bold">Grade = <span className="text-white px-2 py-0.5 bg-[var(--accent-highlight)] rounded-md font-black">{absResult.grade}</span> (GP {absResult.gp})</p>
        </div>
        {sub.labEnabled && sub.labMarks !== '' && (() => {
          const lt = calcLabTheory(absResult.gp, Number(sub.labMarks) || 0);
          return <LabCalcBox wgp={absResult.gp} labMarks={Number(sub.labMarks) || 0} lt={lt} />;
        })()}
      </div>
    );
  }

  // Relative
  const w = calcWGP(sub.s1Grade || 'O', sub.s2Grade || 'O', sub.leGrade || 'O');
  const hasLab = sub.labEnabled && sub.labMarks !== '';
  const lt = hasLab ? calcLabTheory(w.raw, Number(sub.labMarks) || 0) : null;

  return (
    <div className="space-y-2 mt-3">
      {/* WGP step */}
      <div className="bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.08)] rounded-xl p-4 font-mono text-xs space-y-1">
        <p className="text-[var(--accent-highlight)] font-semibold mb-2 uppercase tracking-widest text-[10px]">🧮 Step-by-Step Calculation</p>
        <p className="text-[var(--text-muted)]">WGP = (S1 × 0.30) + (S2 × 0.45) + (LE × 0.25)</p>
        <p className="text-[var(--text-secondary)]">WGP = ({w.s1} × 0.30) + ({w.s2} × 0.45) + ({w.le} × 0.25)</p>
        <p className="text-[var(--text-secondary)]">WGP = {(w.s1 * 0.30).toFixed(2)} + {(w.s2 * 0.45).toFixed(2)} + {(w.le * 0.25).toFixed(2)}</p>
        <p className="text-[var(--text-secondary)]">WGP = {w.raw}</p>
        <p className="text-[var(--text-secondary)]">WGP = ceil({w.raw})</p>
        <p className="text-[var(--text-primary)] font-bold mt-1">WGP = <span className="text-white px-2 py-0.5 bg-[var(--accent-highlight)] rounded-md font-black">{w.wgp}.00</span></p>
      </div>
      {/* Lab+Theory step */}
      {lt && <LabCalcBox wgp={w.raw} labMarks={Number(sub.labMarks) || 0} lt={lt} />}
    </div>
  );
}

function LabCalcBox({ wgp, labMarks, lt }) {
  return (
    <div className="bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.15)] rounded-xl p-4 font-mono text-xs space-y-1">
      <p className="text-[var(--color-success)] font-semibold mb-2 uppercase tracking-widest text-[10px]">🔬 Lab + Theory Calculation</p>
      <p className="text-[var(--text-muted)]">Final GP = [(WGP ÷ 10 × 100 × 0.70) + (Lab × 0.30)] ÷ 10</p>
      <p className="text-[var(--text-secondary)]">Theory = ({wgp} ÷ 10) × 100 × 0.70 = {lt.theoryPart}</p>
      <p className="text-[var(--text-secondary)]">Lab = {labMarks} × 0.30 = {lt.labPart}</p>
      <p className="text-[var(--text-secondary)]">Final % = {lt.theoryPart} + {lt.labPart} = {lt.finalPct}</p>
      <p className="text-[var(--text-primary)] font-bold mt-1">Final Grade Point = <span className="text-white px-2 py-0.5 bg-[var(--color-success)] rounded-md font-black">{lt.gp}.00</span></p>
    </div>
  );
}

// ── Final Result Badge ────────────────────────────────────────
function FinalBadge({ sub }) {
  const g = getEffectiveGrade(sub);
  const gp = getEffectiveGP(sub);
  const colors = { O: 'var(--color-success)', 'A+': '#a78bfa', A: '#60a5fa', 'B+': 'var(--color-warning)', B: '#fb923c', C: 'var(--color-error)', P: '#94a3b8', F: '#ef4444' };
  const c = colors[g] || '#94a3b8';
  return (
    <div className="flex items-center gap-4 mt-3 p-4 bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.08)] rounded-xl">
      <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-white/10" style={{ background: c }}>
        <span className="text-white font-black text-lg leading-none">{g}</span>
        <span className="text-white/80 text-[10px] font-bold">({gp})</span>
      </div>
      <div>
        <p className="text-[var(--text-primary)] font-bold text-base">{gp}</p>
        <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest font-semibold">Final Grade Point</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export default function CGPA() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSemName, setNewSemName] = useState('');
  const [showSemForm, setShowSemForm] = useState(false);
  const [newSubjects, setNewSubjects] = useState({});
  const [showChart, setShowChart] = useState(false);
  const [activeTab, setActiveTab] = useState('semesters'); // semesters | whatif | target
  const printRef = useRef();

  // ── AI Analysis State ──
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

  useEffect(() => { fetchCgpa(); }, []);

  const fetchCgpa = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/cgpa');
      setSemesters(res.data.map(r => ({
        dbId: r.id, id: r.id, name: r.semesterName, gpa: r.gpa, expanded: false,
        subjects: (() => { try { return JSON.parse(r.subjectsJson || '[]'); } catch { return []; } })(),
      })));
    } catch { console.error('Failed to load CGPA'); }
    finally { setLoading(false); }
  };

  const cgpa = calcCGPA(semesters);
  const allGPAs = semesters.map(s => calcGPA(s.subjects));
  const bestGPA = allGPAs.length > 0 ? Math.max(...allGPAs) : 0;
  const lowGPA = allGPAs.length > 0 ? Math.min(...allGPAs) : 0;
  const trend = allGPAs.length >= 2 ? (allGPAs[allGPAs.length - 1] >= allGPAs[allGPAs.length - 2] ? 'up' : 'down') : 'neutral';

  const toggleExpand = (id) =>
    setSemesters(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));

  const syncSemester = async (sem, updatedSubjects) => {
    if (!sem.dbId) return;
    try {
      await axiosClient.put(`/api/cgpa/${sem.dbId}`, {
        gpa: calcGPA(updatedSubjects),
        subjectsJson: JSON.stringify(updatedSubjects)
      });
    } catch { console.error('Failed to sync'); }
  };

  const handleAddSemester = async () => {
    if (!newSemName.trim()) return;
    const ns = { id: Date.now(), name: newSemName.trim(), expanded: true, subjects: [], dbId: null };
    setSemesters(prev => [...prev, ns]);
    setNewSemName(''); setShowSemForm(false);
    try {
      const res = await axiosClient.post('/api/cgpa', {
        semesterName: ns.name,
        gpa: 0,
        subjectsJson: '[]'
      });
      setSemesters(prev => prev.map(s => s.id === ns.id ? { ...s, dbId: res.data.id, id: res.data.id } : s));
    } catch { console.error('Failed to save'); }
  };

  const handleRemoveSemester = async (id) => {
    const sem = semesters.find(s => s.id === id);
    setSemesters(prev => prev.filter(s => s.id !== id));
    if (sem?.dbId) {
      try { await axiosClient.delete(`/api/cgpa/${sem.dbId}`); }
      catch { console.error('Failed to delete'); }
    }
  };

  const handleEditSubject = (semId, subId, field, value) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id !== semId) return sem;
      const subs = sem.subjects.map(s => s.id === subId ? { ...s, [field]: value } : s);
      syncSemester({ ...sem, subjects: subs }, subs);
      return { ...sem, subjects: subs };
    }));
  };

  const handleRemoveSubject = (semId, subId) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id !== semId) return sem;
      const subs = sem.subjects.filter(s => s.id !== subId);
      syncSemester({ ...sem, subjects: subs }, subs);
      return { ...sem, subjects: subs };
    }));
  };

  const handleAddSubject = (semId) => {
    const ns = newSubjects[semId] || defaultSub();
    if (!ns.name.trim()) return;
    const newSub = {
      id: Date.now(), name: ns.name.trim(), credits: Number(ns.credits) || 3,
      grade: ns.grade, inputMode: ns.inputMode || 'simple', gradingMode: ns.gradingMode,
      labEnabled: ns.labEnabled,
      s1Grade: ns.s1Grade || 'O', s2Grade: ns.s2Grade || 'O', leGrade: ns.leGrade || 'O',
      marksObtained: ns.marksObtained, maxMarks: ns.maxMarks || '100', labMarks: ns.labMarks
    };
    setSemesters(prev => prev.map(sem => {
      if (sem.id !== semId) return sem;
      const subs = [...sem.subjects, newSub];
      syncSemester({ ...sem, subjects: subs }, subs);
      return { ...sem, subjects: subs };
    }));
    setNewSubjects(prev => ({ ...prev, [semId]: defaultSub() }));
  };

  const upd = (semId, field, value) =>
    setNewSubjects(prev => ({ ...prev, [semId]: { ...(prev[semId] || defaultSub()), [field]: value } }));

  const analyzeGrades = async () => {
    setAnalysisLoading(true);
    try {
      const summary = semesters.map(s => `${s.name}: GPA ${calcGPA(s.subjects)}`).join('\n');
      const res = await axiosClient.post('/api/ai/chat', {
        feature: "cgpa_analysis",
        system: "You are an academic advisor focusing on GPA performance. Analyze the student's semester-wise GPA trends and overall CGPA. Provide encouraging, tactical advice on how they can maintain or improve their scores. Be concise.",
        message: `Overall CGPA: ${cgpa}\nSemesters Completed: ${semesters.length}\nBest GPA: ${bestGPA}\nLowest GPA: ${lowGPA}\nTrend: ${trend}\n\nBreakdown:\n${summary}`
      });
      setAiAnalysis(res.data.response || res.data.analysis || "");
    } catch {
      console.error("Failed to analyze grades");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ── PDF Export ───────────────────────────────────────────────
  const handlePDFExport = () => {
    const dept = localStorage.getItem('department') || '';
    const name = localStorage.getItem('fullName') || 'Student';
    const sem = localStorage.getItem('currentSemester') || '';
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = semesters.map(s => {
      const gpa = calcGPA(s.subjects);
      const subRows = s.subjects.map(sub => {
        const g = getEffectiveGrade(sub);
        const gp = getEffectiveGP(sub);
        return `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${sub.name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${sub.credits}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${g}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${gp}</td>
        </tr>`;
      }).join('');
      return `<div style="margin-bottom:28px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f5f3ff;padding:10px 16px;border-radius:8px 8px 0 0;border:1px solid #ddd8fe;">
          <strong style="color:#4c1d95;font-size:14px;">${s.name}</strong>
          <span style="background:#7c3aed;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">GPA: ${gpa}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;">
          <thead><tr style="background:#faf5ff;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#7c3aed;font-weight:600;">Subject</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#7c3aed;font-weight:600;">Credits</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#7c3aed;font-weight:600;">Grade</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#7c3aed;font-weight:600;">Grade Points</th>
          </tr></thead>
          <tbody>${subRows}</tbody>
        </table>
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>Academic Transcript</title>
    <style>body{font-family:Arial,sans-serif;color:#1e293b;padding:40px;max-width:800px;margin:0 auto;}
    @media print{body{padding:20px;} .no-print{display:none;}}</style></head><body>
    <div style="text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #7c3aed;">
      <h1 style="color:#4c1d95;font-size:24px;margin:0 0 4px;">Academic Transcript</h1>
      <p style="color:#7c3aed;font-size:13px;margin:0;">PathForge — Official Record</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;padding:16px;background:#f5f3ff;border-radius:10px;">
      <div><p style="margin:0 0 4px;font-size:11px;color:#7c3aed;font-weight:600;">STUDENT NAME</p><p style="margin:0;font-size:15px;font-weight:700;">${name}</p></div>
      <div><p style="margin:0 0 4px;font-size:11px;color:#7c3aed;font-weight:600;">DEPARTMENT</p><p style="margin:0;font-size:15px;font-weight:700;">${dept}</p></div>
      <div><p style="margin:0 0 4px;font-size:11px;color:#7c3aed;font-weight:600;">CURRENT SEMESTER</p><p style="margin:0;font-size:15px;font-weight:700;">${sem}</p></div>
      <div><p style="margin:0 0 4px;font-size:11px;color:#7c3aed;font-weight:600;">DATE GENERATED</p><p style="margin:0;font-size:15px;font-weight:700;">${date}</p></div>
    </div>
    ${rows}
    <div style="margin-top:32px;padding:20px;background:#4c1d95;border-radius:12px;text-align:center;">
      <p style="color:rgba(255,255,255,.7);margin:0 0 6px;font-size:12px;">CUMULATIVE GRADE POINT AVERAGE</p>
      <p style="color:#fff;font-size:36px;font-weight:900;margin:0;">${cgpa}</p>
      <p style="color:rgba(255,255,255,.6);font-size:11px;margin:4px 0 0;">${semesters.length} semesters completed</p>
    </div>
    <p style="text-align:center;font-size:10px;color:#94a3b8;margin-top:20px;">Generated by PathForge · ${date}</p>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.print(); };
  };

  // ── What-if simulator state ───────────────────────────────
  const [whatIfSems, setWhatIfSems] = useState(1);
  const [whatIfGPA, setWhatIfGPA] = useState(8.0);
  const projected = (() => {
    if (semesters.length === 0) return null;
    const totalGPA = allGPAs.reduce((s, g) => s + g, 0) + whatIfGPA * whatIfSems;
    return parseFloat((totalGPA / (allGPAs.length + whatIfSems)).toFixed(2));
  })();

  // ── Target CGPA planner state ─────────────────────────────
  const [targetCGPA, setTargetCGPA] = useState(8.5);
  const [remSems, setRemSems] = useState(2);
  const neededGPA = (() => {
    if (semesters.length === 0 || remSems === 0) return null;
    const needed = (targetCGPA * (allGPAs.length + remSems) - allGPAs.reduce((s, g) => s + g, 0)) / remSems;
    return Math.min(10, Math.max(0, parseFloat(needed.toFixed(2))));
  })();
  const targetFeasible = neededGPA !== null && neededGPA <= 10;

  const iCls = "bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-full px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all";

  const tabBtn = (t) => `flex-1 py-2 rounded-full text-xs font-bold transition-all ${activeTab === t ? 'bg-[var(--accent-primary)] text-white shadow-[var(--card-shadow)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-highlight)]'}`;

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin text-3xl text-[var(--accent-highlight)]">✦</div></div>;

  return (
    <div className="space-y-6" ref={printRef}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">CGPA Tracker</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Track your semester-wise academic performance</p>
        </div>
        <div className="flex gap-2">
          {semesters.length > 0 && (
            <button onClick={handlePDFExport}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--accent-highlight)] font-bold text-sm hover:bg-[var(--bg-surface-hover)] transition-colors">
              📄 Export PDF
            </button>
          )}
          <button onClick={() => setShowSemForm(!showSemForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow hover:opacity-90 transition-opacity">
            <span className="text-lg leading-none font-black">{showSemForm ? '✕' : '+'}</span>
            {showSemForm ? 'Cancel' : 'Add Semester'}
          </button>
        </div>
      </div>

      {/* ── Grade Chart (collapsible) ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl overflow-hidden shadow-sm">
        <button onClick={() => setShowChart(!showChart)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[rgba(56,189,248,0.08)] transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-semibold text-[var(--text-primary)] text-sm tracking-wide">Grade Conversion Chart</span>
          </div>
          <span className="text-[var(--text-secondary)] text-sm">{showChart ? '▲' : '▼'}</span>
        </button>
        {showChart && (
          <div className="px-5 pb-5 border-t border-[var(--border-glass)]">
            <div className="flex flex-wrap gap-2 mt-4">
              {[{ g: 'O', r: '> 9.50', d: 'var(--color-success)' }, { g: 'A+', r: '> 8.50', d: '#a78bfa' }, { g: 'A', r: '> 7.50', d: '#60a5fa' },
              { g: 'B+', r: '> 6.50', d: 'var(--color-warning)' }, { g: 'B', r: '> 5.50', d: '#fb923c' }, { g: 'C', r: '> 4.50', d: 'var(--color-error)' },
              { g: 'P', r: '= 4.00', d: '#94a3b8' }, { g: 'F', r: '< 4.00', d: '#ef4444' }].map(x => (
                <div key={x.g} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-md text-sm">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: x.d, display: 'inline-block' }} />
                  <span className="font-bold text-[var(--text-primary)] pointer-events-none">{x.g}</span>
                  <span className="text-[var(--text-secondary)]">{x.r}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {[{ g: 'I', d: 'Incomplete (GP: 4 if both sessionals ≥ 25)', dot: '#94a3b8' },
              { g: 'Ab/R', d: 'Absent/Repeat (GP: 0)', dot: '#ef4444' },
              { g: 'L/AB', d: 'LE Absent (GP: 0, Final: F)', dot: '#ef4444' }].map(x => (
                <div key={x.g} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-md text-xs">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: x.dot, display: 'inline-block' }} />
                  <span className="font-bold text-[var(--text-primary)]">{x.g}</span>
                  <span className="text-[var(--text-secondary)]">{x.d}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Semester Form ── */}
      {showSemForm && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-[var(--text-primary)] tracking-wide mb-3">New Semester</h3>
          <div className="flex gap-3">
            <input type="text" placeholder="e.g. Semester 5" value={newSemName}
              onChange={e => setNewSemName(e.target.value)} className={`flex-1 ${iCls}`}
              onKeyDown={e => e.key === 'Enter' && handleAddSemester()} />
            <button onClick={handleAddSemester}
              className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow hover:opacity-90 transition-opacity">Add</button>
          </div>
        </div>
      )}

      {/* ── CGPA Banner ── */}
      {semesters.length > 0 && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden p-6 bg-[var(--bg-surface)] border border-[var(--border-glass)] shadow-sm">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-[var(--accent-highlight)] opacity-[0.05] rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[var(--accent-highlight)] text-[10px] uppercase tracking-widest font-bold">Overall CGPA</p>
                <p className="text-4xl font-black text-[var(--text-primary)] mt-1 tracking-tight">{cgpa}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mt-2">
                  {trend === 'up' ? '↑ Improving — keep it up!' : trend === 'down' ? '↓ Declining — focus more' : 'Add more semesters to see trend'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{ l: 'Semesters', v: semesters.length }, { l: 'Best GPA', v: bestGPA }, { l: 'Low GPA', v: lowGPA }].map(s => (
                  <div key={s.l} className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-center">
                    <p className="text-xl font-black text-[var(--text-primary)]">{s.v}</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── GPA Bar Chart ── */}
      {semesters.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm">
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] mb-4">Semester-wise GPA Trend</h2>
          <div className="flex items-end gap-3" style={{ height: '140px' }}>
            {semesters.map((sem, idx) => {
              const g = calcGPA(sem.subjects);
              const h = Math.round((g / 10) * 100);
              return (
                <div key={sem.id} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-xs font-bold text-[var(--accent-highlight)]">{g}</span>
                  <div className={`w-full rounded-t-md transition-all duration-500 ${idx === semesters.length - 1 ? 'bg-gradient-to-t from-[rgba(52,211,153,0.1)] to-[var(--color-success)]' : 'bg-gradient-to-t from-[rgba(14,165,233,0.1)] to-[var(--accent-highlight)]'}`}
                    style={{ height: `${h}px` }} />
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-secondary)] text-center leading-tight truncate w-full px-1">{sem.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-1.5 flex gap-1">
        {[{ id: 'semesters', l: '📚 Semesters' }, { id: 'whatif', l: '🔮 What-if Simulator' }, { id: 'target', l: '🎯 Target CGPA' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={tabBtn(t.id)}>{t.l}</button>
        ))}
      </div>

      {/* ════════════════════ TAB: SEMESTERS ════════════════════ */}
      {activeTab === 'semesters' && (
        <>
          {semesters.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-[var(--text-primary)] font-bold">No semesters added yet.</p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Click "Add Semester" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">Semester Breakdown</h2>
              {semesters.map(sem => {
                const semGpa = calcGPA(sem.subjects);
                const ns = newSubjects[sem.id] || defaultSub();
                const isAbs = ns.inputMode === 'detailed' && ns.gradingMode === 'absolute';
                const hasCalc = ns.name.trim().length > 0;

                return (
                  <div key={sem.id} className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors" onClick={() => toggleExpand(sem.id)}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-[var(--text-primary)] tracking-wide">{sem.name}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-[var(--bg-surface-hover)] text-[var(--accent-highlight)]">GPA: {semGpa}</span>
                        <span className="text-xs text-[var(--text-secondary)] font-medium">{sem.subjects.length} subject{sem.subjects.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={e => { e.stopPropagation(); handleRemoveSemester(sem.id); }}
                          className="text-[var(--text-muted)] hover:text-red-400 transition-colors text-sm font-bold border border-transparent hover:border-red-400/30 rounded-full w-6 h-6 flex items-center justify-center">✕</button>
                        <span className="text-[var(--text-secondary)] text-sm">{sem.expanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {sem.expanded && (
                      <div className="border-t border-[var(--border-glass)]">

                        {/* Subject table */}
                        {sem.subjects.length > 0 && (
                          <div className="px-5 pt-4 overflow-x-auto">
                            <table className="w-full text-sm min-w-[500px]">
                              <thead>
                                <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest text-left">
                                  <th className="pb-2 font-bold">Subject</th>
                                  <th className="text-center pb-2 font-bold">Credits</th>
                                  <th className="text-center pb-2 font-bold">Mode</th>
                                  <th className="text-center pb-2 font-bold">Grade</th>
                                  <th className="text-center pb-2 font-bold">GP</th>
                                  <th className="text-center pb-2 font-bold">Lab</th>
                                  <th className="pb-2" />
                                </tr>
                              </thead>
                              <tbody>
                                {sem.subjects.map(sub => {
                                  const eg = getEffectiveGrade(sub);
                                  const ep = getEffectiveGP(sub);
                                  return (
                                    <tr key={sub.id} className="border-t border-[rgba(56,189,248,0.08)]">
                                      <td className="py-3 text-[var(--text-primary)] font-medium pr-2">
                                        <div>{sub.name}</div>
                                        {sub.labEnabled && !['I', 'Ab/R', 'L/AB'].includes(sub.grade) && (
                                          <div className="text-[9px] uppercase tracking-widest text-[var(--color-success)] font-bold mt-1">🔬 Lab included</div>
                                        )}
                                      </td>
                                      <td className="py-3 text-center">
                                        <input type="number" value={sub.credits}
                                          onChange={e => handleEditSubject(sem.id, sub.id, 'credits', e.target.value)}
                                          className="w-14 text-center bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${['I', 'Ab/R', 'L/AB'].includes(sub.s1Grade || sub.grade) ? 'bg-[rgba(148,163,184,0.1)] text-[#94a3b8]' : sub.gradingMode === 'absolute' ? 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa]' : 'bg-[var(--bg-surface-hover)] text-[var(--accent-highlight)]'}`}>
                                          {['I', 'Ab/R', 'L/AB'].includes(sub.grade) ? 'Special' : sub.gradingMode === 'absolute' ? 'Absolute' : 'Relative'}
                                        </span>
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${gradePill(eg)}`}>{eg}</span>
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${gradePill(eg)}`}>{ep}</span>
                                      </td>
                                      <td className="py-3 text-center">
                                        {sub.labEnabled
                                          ? <span className="text-[10px] bg-[rgba(52,211,153,0.1)] text-[var(--color-success)] px-2 py-0.5 rounded-full border border-[rgba(52,211,153,0.2)]">🔬</span>
                                          : <span className="text-[var(--text-muted)] text-xs font-bold">—</span>}
                                      </td>
                                      <td className="py-3 text-center">
                                        <button onClick={() => handleRemoveSubject(sem.id, sub.id)}
                                          className="text-[var(--text-muted)] hover:text-red-400 transition-colors font-bold text-lg leading-none">✕</button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* ── Add Subject Form ── */}
                        <div className="mx-5 mb-5 mt-4 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl overflow-hidden shadow-sm">

                          {/* Course header */}
                          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-glass)] bg-[var(--bg-surface)]">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[rgba(14,165,233,0.2)] to-[var(--accent-highlight)]">
                              <span className="text-white text-sm">📖</span>
                            </div>
                            <span className="text-[var(--text-primary)] font-bold tracking-wide">
                              {ns.name.trim() || `Course ${sem.subjects.length + 1}`}
                            </span>
                          </div>

                          <div className="p-5 space-y-4">

                            {/* ── Input Mode Toggle ── */}
                            <div className="flex items-center gap-2 p-1 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl">
                              {[
                                { id: 'simple', icon: '⚡', label: 'Simple', sub: 'Grade + Credits directly' },
                                { id: 'detailed', icon: '📋', label: 'Detailed', sub: 'S1 + S2 + LE breakdown' },
                              ].map(mode => (
                                <button key={mode.id} onClick={() => upd(sem.id, 'inputMode', mode.id)}
                                  className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all ${ns.inputMode === mode.id ? 'bg-[var(--accent-primary)] shadow-[var(--card-shadow)]' : 'hover:bg-[var(--bg-surface)]'}`}>
                                  <span className="text-base">{mode.icon}</span>
                                  <div>
                                    <p className={`text-[10px] uppercase tracking-widest font-bold leading-tight ${ns.inputMode === mode.id ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{mode.label}</p>
                                    <p className={`text-[9px] font-semibold leading-tight mt-1 ${ns.inputMode === mode.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{mode.sub}</p>
                                  </div>
                                </button>
                              ))}
                            </div>

                            {/* Course Name + Credits */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] mb-1.5 block font-bold">Course Name</label>
                                <input type="text" placeholder="e.g. Mathematics" value={ns.name}
                                  onChange={e => upd(sem.id, 'name', e.target.value)}
                                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] mb-1.5 block font-bold">Credits</label>
                                <input type="number" placeholder="e.g. 4" value={ns.credits}
                                  onChange={e => upd(sem.id, 'credits', e.target.value)}
                                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                              </div>
                            </div>

                            {/* ════ SIMPLE MODE: direct grade select ════ */}
                            {ns.inputMode === 'simple' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] mb-1.5 block font-bold">Final Grade</label>
                                  <select value={ns.grade} onChange={e => upd(sem.id, 'grade', e.target.value)}
                                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all">
                                    {ALL_GRADES.map(g => (
                                      <option key={g} value={g} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{g}{GRADE_POINTS[g] !== undefined ? ' — GP ' + GRADE_POINTS[g] : ''}</option>
                                    ))}
                                  </select>
                                </div>
                                {/* Lab toggle for simple mode */}
                                <div className="flex items-center gap-3">
                                  <button onClick={() => upd(sem.id, 'labEnabled', !ns.labEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ns.labEnabled ? 'bg-[var(--color-success)]' : 'bg-[rgba(56,189,248,0.2)]'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${ns.labEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-success)] font-bold">🔬 Lab Enabled</span>
                                </div>
                                {ns.labEnabled && (
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] mb-1.5 block font-bold">🔬 Lab Marks (out of 100)</label>
                                    <input type="number" placeholder="e.g. 71" value={ns.labMarks} min="0" max="100"
                                      onChange={e => upd(sem.id, 'labMarks', e.target.value)}
                                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ════ DETAILED MODE: S1 + S2 + LE ════ */}
                            {ns.inputMode === 'detailed' && (
                              <div className="space-y-3">

                                {/* Lab toggle */}
                                <div className="flex items-center gap-3">
                                  <button onClick={() => upd(sem.id, 'labEnabled', !ns.labEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ns.labEnabled ? 'bg-[var(--color-success)]' : 'bg-[rgba(56,189,248,0.2)]'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${ns.labEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-success)] font-bold">🔬 Lab Enabled</span>
                                </div>

                                {/* Grading mode toggle */}
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold">Grading:</span>
                                  <div className="flex gap-1 bg-[var(--bg-surface)] rounded-full p-1 border border-[var(--border-glass)]">
                                    {['relative', 'absolute'].map(m => (
                                      <button key={m} onClick={() => upd(sem.id, 'gradingMode', m)}
                                        className={`px-4 py-1 rounded-full text-xs font-bold transition-all capitalize ${ns.gradingMode === m ? 'bg-[var(--accent-primary)] text-white shadow-[var(--card-shadow)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-highlight)]'}`}>
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Relative: Assessment grades table */}
                                {!isAbs && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold mb-2">📋 Assessment Grades</p>
                                    <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl overflow-hidden">
                                      <div className="grid grid-cols-3 px-4 py-2 border-b border-[var(--border-glass)] text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">
                                        <span>Assessment</span>
                                        <span className="text-center">Weight</span>
                                        <span className="text-center">Grade</span>
                                      </div>
                                      {[{ key: 's1Grade', label: 'Sessional 1', w: '30%' }, { key: 's2Grade', label: 'Sessional 2', w: '45%' }, { key: 'leGrade', label: 'Learning Engagement', w: '25%' }].map(row => (
                                        <div key={row.key} className="grid grid-cols-3 px-4 py-3 items-center border-b border-[rgba(56,189,248,0.08)] last:border-0">
                                          <span className="text-sm text-[var(--text-primary)] font-medium">{row.label}</span>
                                          <div className="flex justify-center">
                                            <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-secondary)] text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full font-bold">
                                              🔒 {row.w}
                                            </span>
                                          </div>
                                          <div className="flex justify-center">
                                            <select value={ns[row.key] || 'O'}
                                              onChange={e => upd(sem.id, row.key, e.target.value)}
                                              className="bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-primary)] text-sm px-3 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all w-24">
                                              {NORMAL_GRADES.map(g => <option key={g} value={g} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{g}</option>)}
                                            </select>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {/* Special grade */}
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Special grade?</span>
                                      <select value={['I', 'Ab/R', 'L/AB'].includes(ns.grade) ? ns.grade : ''}
                                        onChange={e => upd(sem.id, 'grade', e.target.value || 'O')}
                                        className="bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-primary)] text-xs px-3 py-1 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all">
                                        <option value="" className="bg-[var(--bg-primary)]">None</option>
                                        {['I', 'Ab/R', 'L/AB'].map(g => <option key={g} value={g} className="bg-[var(--bg-primary)]">{g} — GP {GRADE_POINTS[g]}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {/* Absolute: marks input */}
                                {isAbs && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] mb-1.5 block font-bold">Marks Obtained</label>
                                      <input type="number" placeholder="e.g. 75" value={ns.marksObtained}
                                        onChange={e => upd(sem.id, 'marksObtained', e.target.value)}
                                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                                    </div>
                                    <div>
                                      <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] mb-1.5 block font-bold">Maximum Marks</label>
                                      <input type="number" placeholder="100" value={ns.maxMarks}
                                        onChange={e => upd(sem.id, 'maxMarks', e.target.value)}
                                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                                    </div>
                                  </div>
                                )}

                                {/* Lab marks */}
                                {ns.labEnabled && (
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] mb-1.5 block font-bold">🔬 Lab Marks (out of 100)</label>
                                    <input type="number" placeholder="e.g. 71" value={ns.labMarks} min="0" max="100"
                                      onChange={e => upd(sem.id, 'labMarks', e.target.value)}
                                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Final result badge */}
                            {hasCalc && ns.credits && <FinalBadge sub={ns} />}

                            <button onClick={() => handleAddSubject(sem.id)}
                              className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow hover:opacity-90 transition-opacity">
                              + Add Course
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════ TAB: WHAT-IF ════════════════════ */}
      {activeTab === 'whatif' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Simulate your future CGPA by projecting hypothetical semester GPAs.</p>

          {semesters.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">🔮</p>
              <p className="text-[var(--text-primary)] font-bold">Add at least one semester to use the simulator.</p>
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-sm space-y-6">
              {/* Current state */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-[var(--text-primary)]">{cgpa}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mt-1">Current CGPA</p>
                  <p className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">{semesters.length} semesters done</p>
                </div>
                <div className={`border rounded-xl p-4 text-center ${projected !== null && projected > cgpa ? 'bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.2)]' : 'bg-[rgba(14,165,233,0.05)] border-[rgba(14,165,233,0.2)]'}`}>
                  <p className={`text-2xl font-black ${projected !== null && projected > cgpa ? 'text-[var(--color-success)]' : 'text-[var(--accent-highlight)]'}`}>{projected ?? '—'}</p>
                  <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${projected !== null && projected > cgpa ? 'text-[var(--color-success)]' : 'text-[var(--accent-highlight)]'}`}>Projected CGPA</p>
                  {projected !== null && (
                    <p className={`text-xs font-bold mt-0.5 ${projected > cgpa ? 'text-[var(--color-success)]' : projected < cgpa ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                      {projected > cgpa ? `↑ +${(projected - cgpa).toFixed(2)}` : projected < cgpa ? `↓ ${(projected - cgpa).toFixed(2)}` : 'No change'}
                    </p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold">Future semesters to simulate</label>
                    <span className="text-sm font-black text-[var(--text-primary)]">{whatIfSems}</span>
                  </div>
                  <input type="range" min="1" max="8" value={whatIfSems}
                    onChange={e => setWhatIfSems(Number(e.target.value))}
                    className="w-full accent-[var(--accent-primary)]" />
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] mt-1">
                    <span>1 sem</span><span>8 sems</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold">GPA per future semester</label>
                    <span className="text-sm font-black text-[var(--text-primary)]">{whatIfGPA.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0" max="10" step="0.1" value={whatIfGPA}
                    onChange={e => setWhatIfGPA(Number(e.target.value))}
                    className="w-full accent-[var(--accent-primary)]" />
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] mt-1">
                    <span>0.0</span><span>10.0</span>
                  </div>
                </div>
              </div>

              {/* Scenario grid */}
              <div>
                <p className="text-[10px] font-bold text-[var(--accent-highlight)] mb-3 uppercase tracking-widest">Quick Scenarios</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{ label: 'All O (10.0)', gpa: 10 }, { label: 'All A+ (9.0)', gpa: 9 }, { label: 'All A (8.0)', gpa: 8 }, { label: 'All B+ (7.0)', gpa: 7 }].map(sc => {
                    const proj = parseFloat(((allGPAs.reduce((s, g) => s + g, 0) + sc.gpa * whatIfSems) / (allGPAs.length + whatIfSems)).toFixed(2));
                    return (
                      <div key={sc.label} className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-3 text-center cursor-pointer hover:border-[var(--border-hover)] transition-colors"
                        onClick={() => setWhatIfGPA(sc.gpa)}>
                        <p className="text-lg font-black text-[var(--text-primary)]">{proj}</p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mt-1">{sc.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB: TARGET ════════════════════ */}
      {activeTab === 'target' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Find out exactly what GPA you need in upcoming semesters to reach your goal.</p>

          {semesters.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-[var(--text-primary)] font-bold">Add at least one semester to use the target planner.</p>
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-sm space-y-6">
              {/* Current */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold">Current CGPA</p>
                  <p className="text-3xl font-black text-[var(--text-primary)]">{cgpa}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{semesters.length} completed</p>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">{8 - semesters.length} remaining (max)</p>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold">Target CGPA</label>
                    <span className="text-sm font-black text-[var(--text-primary)]">{targetCGPA.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0" max="10" step="0.1" value={targetCGPA}
                    onChange={e => setTargetCGPA(Number(e.target.value))}
                    className="w-full accent-[var(--accent-primary)]" />
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mt-1">
                    <span>0.0</span><span>10.0</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold">Remaining semesters</label>
                    <span className="text-sm font-black text-[var(--text-primary)]">{remSems}</span>
                  </div>
                  <input type="range" min="1" max={8 - semesters.length || 1} value={remSems}
                    onChange={e => setRemSems(Number(e.target.value))}
                    className="w-full accent-[var(--accent-primary)]" />
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mt-1">
                    <span>1</span><span>{Math.max(1, 8 - semesters.length)}</span>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className={`rounded-2xl p-5 text-center border-2 ${targetFeasible ? 'bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.3)]' : 'bg-[rgba(248,113,113,0.05)] border-[rgba(248,113,113,0.3)]'}`}>
                <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${targetFeasible ? 'text-[var(--color-success)]' : 'text-red-400'}`}>
                  {targetFeasible ? '✓ Achievable' : '⛔ Not achievable — target too high'}
                </p>
                <p className={`text-4xl font-black mb-1 ${targetFeasible ? 'text-[var(--color-success)]' : 'text-red-400'}`}>
                  {neededGPA ?? '—'}
                </p>
                <p className={`text-xs font-bold ${targetFeasible ? 'text-[var(--color-success)]' : 'text-red-400'}`}>
                  GPA needed per semester for {remSems} semester{remSems !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Grade mapping */}
              {neededGPA !== null && targetFeasible && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold mb-3">What grade does that mean?</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(GRADE_POINTS).filter(([g]) => NORMAL_GRADES.includes(g)).map(([g, gp]) => (
                      <div key={g} className={`px-3 py-2 rounded-xl text-[10px] tracking-widest uppercase font-bold border transition-all ${gp >= neededGPA ? 'bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.3)] text-[var(--color-success)]' : 'bg-[var(--bg-surface)] border-[var(--border-glass)] text-[var(--text-secondary)]'}`}>
                        {g} ({gp}) {gp >= neededGPA ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-3">
                    You need grades highlighted in green (GP ≥ {neededGPA}) to reach CGPA {targetCGPA}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Academic Analysis Section */}
      {semesters.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-sm relative overflow-hidden mt-6 mb-8">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <span className="text-6xl">🎓</span>
          </div>
          
          {/* Header - Always Visible */}
          <div 
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-[rgba(56,189,248,0.04)] transition-colors"
            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(14,165,233,0.1)] flex items-center justify-center border border-[rgba(14,165,233,0.2)]">
                <span className="text-xl">✦</span>
              </div>
              <div>
                <h2 className="font-bold text-[var(--text-primary)]">Personalized Academic Analysis</h2>
                <p className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold mt-0.5">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); analyzeGrades(); }} 
                disabled={analysisLoading}
                className="px-4 py-2 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-black tracking-widest uppercase shadow hover:opacity-90 transition-all disabled:opacity-50"
              >
                {analysisLoading ? '✦ Analyzing...' : (aiAnalysis ? '✦ Refresh' : '✦ Analyze Academic Path')}
              </button>
              <span className={`text-[#1e3a8a] text-xs transition-transform duration-300 ${isAnalysisExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </div>

          {/* Collapsible Content */}
          {isAnalysisExpanded && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              {aiAnalysis ? (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-xl p-5 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
                  <p className="text-sm text-[var(--text-muted)] italic">Get a professional AI breakdown of your GPA trends and advice for your next semester.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}