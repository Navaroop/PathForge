import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { calcGPA, calcCGPA } from '../utils/cgpaUtils';
import FireAttendanceWidget from '../components/dashboard/FireAttendanceWidget';
import CareerRoadmapWidget from '../components/dashboard/CareerRoadmapWidget';
import CgpaTreeWidget from '../components/dashboard/CgpaTreeWidget';

const SEM_ORDER = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8',
];
const SEM_SHORT = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

function Dashboard() {
  const navigate = useNavigate();

  const fullName = localStorage.getItem('fullName') || 'Student';
  const department = localStorage.getItem('department') || 'CSE';
  const currentSemester = Number(localStorage.getItem('currentSemester')) || 1;

  const [attendancePercent, setAttendancePercent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [cgpa, setCgpa] = useState(null);
  const [cgpaRecords, setCgpaRecords] = useState([]);
  const [savedSubjects, setSavedSubjects] = useState([]);
  const [roadmapData, setRoadmapData] = useState(null);
  const [roadmapProgress, setRoadmapProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // ── AI Insights State ──
  const [insights, setInsights] = useState(localStorage.getItem('dashboard_ai_insights') || "");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);

  useEffect(() => {
    try {
      setSavedSubjects(JSON.parse(localStorage.getItem('subject_suggester_saved') || '[]'));
    } catch {
      setSavedSubjects([]);
    }

    const fetchStats = async () => {
      try {
        // Attendance
        const attRes = await axiosClient.get('/api/attendance');
        const attData = attRes.data;
        if (attData.length > 0) {
          const totalAttended = attData.reduce((s, r) => s + (r.attendedClasses || 0), 0);
          const totalClasses = attData.reduce((s, r) => s + (r.totalClasses || 0), 0);
          const overallPct = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
          setAttendancePercent(parseFloat(overallPct.toFixed(2)));
          setAttendanceRecords(attData);
        }

        // CGPA records
        const cgpaRes = await axiosClient.get('/api/cgpa');
        const cgpaData = cgpaRes.data;

        if (cgpaData.length > 0) {
          const parsedSems = cgpaData.map(r => ({
            ...r,
            subjects: (() => { try { return JSON.parse(r.subjectsJson || '[]'); } catch { return []; } })()
          }));

          const calculatedOverallCgpa = calcCGPA(parsedSems);
          setCgpa(calculatedOverallCgpa);

          const recordMap = {};
          parsedSems.slice(0, 8).forEach((r, idx) => {
            recordMap[idx] = r;
          });

          const chartData = SEM_ORDER.map((defaultName, idx) => {
            const rec = recordMap[idx];
            return {
              name: rec ? (rec.semesterName || SEM_SHORT[idx]) : SEM_SHORT[idx],
              fullName: rec ? (rec.semesterName || defaultName) : defaultName,
              gpa: rec ? calcGPA(rec.subjects) : null,
              cgpa: rec ? calcCGPA(parsedSems.slice(0, idx + 1)) : null,
            };
          });
          setCgpaRecords(chartData);
        }

        // Roadmap
        try {
          const rmRes = await axiosClient.get('/api/roadmap/latest');
          const rmData = rmRes.data;
          if (rmData.exists && rmData.roadmapJson) {
            setRoadmapData(JSON.parse(rmData.roadmapJson));
            setRoadmapProgress(rmData.progressJson ? JSON.parse(rmData.progressJson) : {});
          }
        } catch (e) { console.log('No roadmap active'); }
      } catch {
        console.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isAttendanceGood = attendancePercent !== null && attendancePercent >= 75;
  const cgpaStatus =
    cgpa === null ? { label: 'No data yet', color: 'text-purple-400' }
      : cgpa >= 9 ? { label: 'Excellent — Focus on Career', color: 'text-emerald-600' }
        : cgpa >= 8 ? { label: 'Good — Balance Both', color: 'text-blue-600' }
          : { label: 'Needs Improvement', color: 'text-red-500' };

  const generateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const res = await axiosClient.post('/api/ai/analyze-progress', {
        attendance: attendancePercent || 0,
        cgpa: cgpa || 0,
        department: department,
        semester: currentSemester,
        feature: "dashboard_insights"
      });
      const text = res.data.analysis || res.data.response || "";
      setInsights(text);
      localStorage.setItem('dashboard_ai_insights', text);
    } catch (err) {
      setInsightsError("Failed to generate insights. Please try again.");
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Hero Row ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-2">Current CGPA</p>
          <div className="flex items-center gap-4">
            <h1 className="text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-none">
              {loading ? '...' : (cgpa ?? '—')}
            </h1>
            <span className="text-[11px] font-bold rounded-full px-3 py-1 bg-[var(--accent-primary)] text-white tracking-wide shadow-[var(--card-shadow)]">
              {department} · Semester {currentSemester}
            </span>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[var(--text-secondary)] font-medium text-sm mb-0.5">Welcome back,</p>
          <p className="text-[var(--accent-highlight)] font-bold text-lg">{fullName}</p>
        </div>
      </div>

      {/* ── 3-Column Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Stat 1: Attendance */}
        <div onClick={() => navigate('/dashboard/attendance')} className="cursor-pointer bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-5 hover:bg-[rgba(56,189,248,0.06)] transition-colors">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-3">Attendance</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mb-3">{loading ? '...' : attendancePercent !== null ? `${attendancePercent}%` : '—'}</p>
          <span className={`text-[9px] font-semibold rounded-full px-2.5 py-1 uppercase tracking-wide
            ${attendancePercent === null ? 'bg-[rgba(56,189,248,0.12)] text-[var(--accent-highlight)]' 
            : isAttendanceGood ? 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]' : 'bg-[rgba(251,191,36,0.1)] text-[var(--color-warning)]'}`}>
            {attendancePercent === null ? 'No data' : isAttendanceGood ? 'Optimal' : 'Needs attention'}
          </span>
        </div>

        {/* Stat 2: Semesters Done */}
        <div onClick={() => navigate('/dashboard/cgpa')} className="cursor-pointer bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-5 hover:bg-[rgba(56,189,248,0.06)] transition-colors">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-3">Semesters Done</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mb-3">{currentSemester > 1 ? currentSemester - 1 : 0} <span className="text-[var(--text-muted)] text-xl">/ 8</span></p>
          <span className="text-[9px] font-semibold rounded-full px-2.5 py-1 uppercase tracking-wide bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]">
            On track
          </span>
        </div>

        {/* Stat 3: Career Roadmap */}
        <div onClick={() => navigate('/dashboard/roadmap')} className="cursor-pointer bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-5 hover:bg-[rgba(56,189,248,0.06)] transition-colors">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-3">Career Progress</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mb-3">{roadmapData ? 'Active' : 'None'}</p>
          <span className="text-[9px] font-semibold rounded-full px-2.5 py-1 uppercase tracking-wide bg-[rgba(56,189,248,0.12)] text-[var(--accent-highlight)]">
            {roadmapData ? 'View Roadmap' : 'Create Roadmap'}
          </span>
        </div>
      </div>


      {/* ── 2-Column Row (Attendance Breakdown & Semester Journey) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <FireAttendanceWidget records={attendanceRecords} onClick={() => navigate('/dashboard/attendance')} />
        <CgpaTreeWidget records={cgpaRecords} onClick={() => navigate('/dashboard/cgpa')} />
      </div>

      {/* ── Saved Subjects ── */}
      <div>
        <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-4 mt-4">Current Subjects</h2>
        {savedSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedSubjects.map(s => (
              <div key={s.key} onClick={() => navigate('/dashboard/subjects')} 
                className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:border-[rgba(56,189,248,0.25)] transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${s.source === 'document' ? 'bg-[rgba(56,189,248,0.12)] text-[var(--accent-highlight)]' : 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]'}`}>
                    {s.source === 'document' ? 'Core' : 'Elective'}
                  </span>
                  <span className="text-[var(--accent-highlight)] text-sm opacity-50">✦</span>
                </div>
                <p className="font-semibold text-[var(--text-primary)] text-sm mt-1">{s.subject}</p>
              </div>
            ))}
          </div>
        ) : (
          <div onClick={() => navigate('/dashboard/subjects')} className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-6 text-center shadow-sm cursor-pointer hover:bg-[rgba(56,189,248,0.07)] transition-colors">
            <p className="text-[var(--accent-highlight)] font-medium text-sm">No saved subjects yet. Click to setup your curriculum.</p>
          </div>
        )}
      </div>

      {/* ── Career Roadmap Widget ── */}
      {roadmapData && (
        <div className="mt-6 text-left">
           <CareerRoadmapWidget roadmap={roadmapData} progress={roadmapProgress} onClick={() => navigate('/dashboard/roadmap')} />
        </div>
      )}

      {/* ── Attendance Alert ── */}
      {attendancePercent !== null && attendancePercent < 75 && (
        <div className="bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.3)] rounded-xl p-4 flex items-start gap-3 mt-4">
          <span className="text-[var(--color-warning)] text-xl">⚠️</span>
          <div>
            <p className="text-[var(--color-warning)] font-semibold text-sm">Attendance Alert</p>
            <p className="text-amber-200/70 text-xs mt-1">
              Your overall attendance is below 75%. Attend upcoming classes to avoid being detained.
            </p>
          </div>
        </div>
      )}

      {/* ── AI Insights Section ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-sm relative overflow-hidden mt-6">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <span className="text-6xl">🧠</span>
        </div>
        
        {/* Header - Always Visible */}
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-[rgba(56,189,248,0.04)] transition-colors"
          onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(14,165,233,0.1)] flex items-center justify-center border border-[rgba(14,165,233,0.2)]">
              <span className="text-xl">✦</span>
            </div>
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">Personalized Performance Insights</h2>
              <p className="text-[10px] uppercase tracking-widest text-[var(--accent-highlight)] font-bold mt-0.5">Powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); generateInsights(); }} 
              disabled={insightsLoading}
              className="px-4 py-2 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-black tracking-widest uppercase shadow hover:opacity-90 transition-all disabled:opacity-50"
            >
              {insightsLoading ? '✦ Generating...' : (insights ? '✦ Refresh' : '✦ Generate')}
            </button>
            <span className={`text-[#1e3a8a] text-xs transition-transform duration-300 ${isInsightsExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>

        {/* Collapsible Content */}
        {isInsightsExpanded && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {insightsError && (
              <p className="text-red-400 text-xs mb-4 font-medium px-2">{insightsError}</p>
            )}

            {insights ? (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-xl p-5 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {insights}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
                <p className="text-sm text-[var(--text-muted)] italic">Click the button for a deep-dive analysis of your attendance and CGPA trends.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;