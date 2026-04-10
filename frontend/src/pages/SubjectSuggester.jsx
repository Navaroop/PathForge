import axiosClient from '../api/axiosClient';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import SubjectCard from '../components/suggester/SubjectCard';
import SuggesterHistory from '../components/suggester/SuggesterHistory';
import SavedSubjects from '../components/suggester/SavedSubjects';
import CompareModal from '../components/suggester/CompareModal';
import AskAiChatModal from '../components/suggester/AskAiChatModal';

// Use CDN worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// ── Extract text from PDF using pdfjs-dist ────────────────────
async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    pages.push(text);
  }
  return pages.join('\n');
}

// ── Clean subject name if AI still outputs codes incorrectly, but usually we handle this in prompt ──
const formatSubjectName = (name = '', code = '') => {
  if (code && !name.includes(code)) return `${name} - ${code}`;
  return name.trim();
};

// ── Returns true if the string is ONLY a code with no readable name ──
const isCodeOnly = (name = '') => /^[A-Z]{2,6}\s?\d{3,4}$/.test(name.trim());

export default function SubjectSuggester() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('suggest');
  const [nlInput, setNlInput] = useState('');
  const [directSubjectInput, setDirectSubjectInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileRef = useRef(null);
  const [results, setResults] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Persisted state ──
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);

  // ── Chat & Compare State ──
  const [chatSubject, setChatSubject] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [compareSelection, setCompareSelection] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);

  useEffect(() => {
    fetchSaved();
    fetchHistory();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await axiosClient.get('/api/suggester/saved');
      setSaved(res.data);
    } catch { console.error('Failed to load saved subjects'); }
  };

  const fetchHistory = async () => {
    try {
      const res = await axiosClient.get('/api/suggester/history');
      setHistory(res.data);
    } catch { console.error('Failed to load history'); }
  };

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setUploadedFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const unique = newFiles.filter(f => !existingNames.has(f.name));
        return [...prev, ...unique];
      });
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggest = async () => {
    if (!nlInput.trim() && uploadedFiles.length === 0 && !directSubjectInput.trim()) {
      setError('Please describe your interests or provide subjects to analyze.');
      return;
    }
    if (uploadedFiles.length === 0 && !directSubjectInput.trim()) {
      setError('⚠️ Please upload your subject documents (PDF/DOC) or paste subjects manually so the AI can extract and match them.');
      return;
    }
    setError(''); setLoading(true); setResults(null); setExtracted(null);

    try {
      let documentContext = '';
      if (directSubjectInput.trim()) {
        documentContext += `[Pasted Subjects]:\n${directSubjectInput}\n\n`;
      }

      if (uploadedFiles.length > 0) {
        const fileTexts = [];
        for (const file of uploadedFiles) {
          try {
            const text = await extractTextFromPdf(file);
            if (text.trim()) {
              fileTexts.push(`[${file.name}]:\n${text}`);
            } else {
              fileTexts.push(`[${file.name}]: (No readable text found in this file)`);
            }
          } catch (_) {
            fileTexts.push(`[${file.name}]: (Could not extract text — unsupported format)`);
          }
        }
        documentContext += fileTexts.join('\n\n');
      }

      const hasDocuments = documentContext.trim().length > 0;

      // ── Unlocked Gemini Max Potential (2 Million Chars) ──
      const MAX_DOC_CHARS = 2000000;
      const trimmedDoc = hasDocuments
        ? (documentContext.length > MAX_DOC_CHARS
          ? documentContext.slice(0, MAX_DOC_CHARS) + '\n...(truncated)'
          : documentContext)
        : '';

      // ── Compact but strict system prompt ──
      const systemPrompt = `1. Identify the user’s domain (e.g., "Music") and related subfields.
        2. Extract all subjects from the document—no omissions. Use the exact subject name provided. If no name is present, skip that entry—do not invent or add partial information.
        3. Suggested subjects:
          Include all subjects that match the user’s domain or subfields.
          Display only the subject name (no codes).
          Ensure all matching subjects are shown—no missing entries. Sort in a consistent order (e.g., alphabetical).
        4. Alternative subjects:
        Select 3–4 subjects from unrelated domains.
        Display only subject names—no codes.
        5. Final check:
          Ensure all matching subjects are included—none missing.
          Display names exactly as in the document. Codes only if explicitly present. No additions, no omissions.
          
        IMPORTANT: Your output MUST strictly adhere to the following JSON format. Do NOT wrap in markdown blocks, just return raw JSON:
        {"keywords":["extracted keywords"],"suggestedSubjects":[{"name":"extracted subject name","specialty":"reason why"}],"alternativeSubjects":[{"name":"extracted subject name","specialty":"reason why"}]}`;


      const userMessage = `"${nlInput}"${trimmedDoc ? `\nDocument:\n${trimmedDoc}` : ''}
Respond JSON: {"keywords":[],"suggestedSubjects":[{"name":"","specialty":""}],"alternativeSubjects":[{"name":"","specialty":""}],"error":null}`;

      // ── Increased max_tokens to 4000 to allow AI to list ALL subjects ──
      const res = await axiosClient.post('/api/ai/chat', {
        message: userMessage,
        system: systemPrompt,
        max_tokens: 4000,
        feature: "subject_recommendation",
      });

      const data = res.data;
      if (data.error) throw new Error(data.error);

      const raw = (data.response || data.analysis || '');
      let parsed;
      let cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            throw new Error('Could not parse AI response');
          }
        } else {
          throw new Error('No JSON found in AI response');
        }
      }

      if (parsed.error) throw new Error(parsed.error);

      setExtracted(null);

      const resultPayload = {
        keywords: parsed.keywords || [],

        // ── Client-side safety net: filter duplicates just in case ──
        suggestions: Array.from(new Set((parsed.suggestedSubjects || [])
          .filter(s => s.name)
          .map(s => JSON.stringify({
            subject: s.name,
            reasons: s.specialty ? [s.specialty] : [],
          }))))
          .map(str => JSON.parse(str)),

        alternatives: (parsed.alternativeSubjects || [])
          .filter(s => s.name)
          .map(s => ({
            subject: s.name,
            reasons: s.specialty ? [s.specialty] : [],
          })),
      };

      setResults(resultPayload);

      try {
        await axiosClient.post('/api/suggester/history', {
          query: nlInput.slice(0, 80),
          fileNamesJson: JSON.stringify(uploadedFiles.map(f => f.name)),
          suggestionsCount: (parsed.suggestedSubjects || []).length,
          alternativesCount: (parsed.alternativeSubjects || []).length,
          resultsJson: JSON.stringify(resultPayload)
        });
        fetchHistory();
      } catch (e) { console.error('Failed to save to history', e); }

    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(`AI Error: ${err.response.data.error}`);
      } else if (err.message === 'JSON') {
        setError('AI returned an unexpected response. Please try again.');
      } else {
        setError(`Failed to get suggestions: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (subject, source) => {
    const existing = saved.find(s => s.subjectName === subject && s.source === source);
    try {
      if (existing) {
        await axiosClient.delete(`/api/suggester/saved/${existing.id}`);
        setSaved(prev => prev.filter(s => s.id !== existing.id));
      } else {
        const res = await axiosClient.post('/api/suggester/saved', { subjectName: subject, source });
        setSaved(prev => [res.data, ...prev]);
      }
    } catch { console.error('Failed to toggle save state'); }
  };

  const isSaved = (subject, source) => saved.some(s => s.subjectName === subject && s.source === source);

  const clearHistory = async () => {
    try {
      await axiosClient.delete('/api/suggester/history');
      setHistory([]);
    } catch { console.error('Failed to clear history'); }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await axiosClient.delete(`/api/suggester/history/${id}`);
      setHistory(prev => prev.filter(entry => entry.id !== id));
    } catch { console.error('Failed to delete history item'); }
  };

  const clearSaved = async () => {
    try {
      await axiosClient.delete('/api/suggester/saved');
      setSaved([]);
    } catch { console.error('Failed to clear saved'); }
  };

  const loadFromHistory = (entry) => {
    setNlInput(entry.query);
    setDirectSubjectInput(''); // Reset manual input on history load
    try {
      setResults(JSON.parse(entry.resultsJson));
    } catch { setResults(null); }

    setExtracted(null);
    setActiveTab('suggest');
  };

  const openChat = async (subject) => {
    setChatSubject(subject);
    setChatHistory([{ role: 'ai', content: 'Generating subject breakdown...' }]);
    setIsChatLoading(true);

    try {
      const res = await axiosClient.post('/api/ai/chat', {
        system: "You are an pathforge. Provide a concise, highly structured 3-part breakdown of the subject: 1) What it is, 2) Key chapters/topics, 3) 2-3 Practical project/application ideas. Use bullet points and keep it under 150 words.",
        message: `Explain the subject: ${subject}`,
        feature: "subject_recommendation",
      });
      setChatHistory([{ role: 'ai', content: res.data.response || res.data.analysis || 'Failed to generate breakdown.' }]);
    } catch (err) {
      setChatHistory([{ role: 'ai', content: 'Connection error. Please try again later.' }]);
    }
    setIsChatLoading(false);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    const context = newHistory.map(msg => `${msg.role === 'user' ? 'Student' : 'Advisor'}: ${msg.content}`).join('\n');

    try {
      const res = await axiosClient.post('/api/ai/chat', {
        system: `You are answering questions about the subject '${chatSubject}'. Keep answers helpful, concise, and academic. Context of ongoing conversation:\n${context.slice(-1500)}`,
        message: userMsg,
        feature: "subject_recommendation",
      });
      setChatHistory([...newHistory, { role: 'ai', content: res.data.response || res.data.analysis }]);
    } catch {
      setChatHistory([...newHistory, { role: 'ai', content: 'Failed to send message.' }]);
    }
    setIsChatLoading(false);
  };

  const toggleCompare = (subjectObj) => {
    const subjectName = subjectObj.subject || subjectObj;
    setCompareSelection(prev => {
      const exists = prev.find(s => (s.subject || s) === subjectName);
      if (exists) return prev.filter(s => (s.subject || s) !== subjectName);

      const fullObj = typeof subjectObj === 'string' ? { subject: subjectObj } : subjectObj;
      if (prev.length >= 2) return [prev[0], fullObj];
      return [...prev, fullObj];
    });
  };

  const generateComparison = async () => {
    if (compareSelection.length !== 2) return;
    setShowCompareModal(true);
    setIsCompareLoading(true);
    setCompareResult(null);

    try {
      const s1 = compareSelection[0].subject || compareSelection[0];
      const s2 = compareSelection[1].subject || compareSelection[1];
      const res = await axiosClient.post('/api/ai/chat', {
        system: "You are an pathforge. Compare the two requested subjects side-by-side. Focus on 1) Difficulty & Prerequisites, 2) Programming/Math required, 3) Career outcomes. Keep it structured and easy to read. Use Markdown.",
        message: `Compare ${s1} vs ${s2}`,
        feature: "subject_recommendation",
      });
      setCompareResult(res.data.response || res.data.analysis);
    } catch {
      setCompareResult('Failed to generate comparison. Please try again.');
    }
    setIsCompareLoading(false);
  };

  const tabBtn = (t) => `px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === t ? 'bg-[var(--accent-primary)] text-white shadow-[var(--card-shadow)]' : 'bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-secondary)] hover:text-[var(--accent-highlight)]'}`;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Subject Suggester</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">AI-powered subject recommendations from your documents</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveTab('suggest')} className={tabBtn('suggest')}>✦ Suggest</button>
        <button onClick={() => setActiveTab('saved')} className={tabBtn('saved')}>🔖 Saved ({saved.length})</button>
        <button onClick={() => setActiveTab('history')} className={tabBtn('history')}>🕐 History ({history.length})</button>
      </div>

      {/* ══════════════ SUGGEST TAB ══════════════ */}
      {activeTab === 'suggest' && (
        <div className="space-y-5">

          {/* Input Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="font-bold text-[var(--text-primary)] tracking-wide">Describe your interests & goals</p>
              <span className="text-[9px] uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[rgba(14,165,233,0.3)] font-bold">✦ AI Powered</span>
            </div>

            {/* Text input */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Your interests, skills and career goals</label>
              <textarea rows={3} value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                placeholder="Eg;- I am interested in machine learning subjects and I like python"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all resize-none" />
            </div>

            {/* Direct Subjects Input Box */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Direct Subjects Input (Optional)</label>
              <textarea rows={4} value={directSubjectInput}
                onChange={e => setDirectSubjectInput(e.target.value)}
                placeholder="Directly paste your subjects list here if you don't have a document..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all resize-none" />
            </div>

            {/* Multi-file Upload */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Upload subject lists or syllabi (multiple files supported)</label>
              <div
                onClick={() => fileRef.current.click()}
                className="border border-dashed border-[var(--border-hover)] rounded-2xl p-5 text-center bg-[var(--bg-surface)] cursor-pointer hover:bg-[var(--bg-surface)] transition-colors">
                <p className="text-2xl mb-1">📄</p>
                <p className="text-sm text-[var(--accent-highlight)] font-bold tracking-wide">Click to upload files</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">PDF or DOC — AI will extract subjects from your documents</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`}
                      className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg flex-shrink-0">📄</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{file.name}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wide">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-[rgba(248,113,113,0.1)] text-[var(--color-error)] font-bold hover:bg-[rgba(248,113,113,0.2)] transition-colors flex-shrink-0">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'I want to work in AI and data science',
                  'I love building websites and apps',
                  'I am interested in cybersecurity',
                  'I want to go into cloud and DevOps',
                ].map(p => (
                  <button key={p} onClick={() => setNlInput(p)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-secondary)] hover:text-[var(--accent-highlight)] hover:border-[var(--border-hover)] transition-colors font-medium tracking-wide">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.2)] rounded-xl px-4 py-2 font-medium">{error}</p>
            )}

            <button onClick={handleSuggest} disabled={loading}
              className="w-full py-3 rounded-full bg-[var(--accent-primary)] text-white font-black tracking-wide text-sm shadow hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? '✦ Analyzing...' : '✦ Analyze & Suggest Subjects'}
            </button>
          </div>

          {/* ── Keywords Card ── */}
          {results?.keywords?.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <p className="font-bold text-[var(--text-primary)] tracking-wide">Keyword & Synonym Expansion</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.keywords.map((kw, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-[var(--accent-glow)] border border-[rgba(14,165,233,0.2)] text-[var(--accent-primary)] font-bold">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Subjects */}
          {results?.suggestions?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[var(--text-primary)] tracking-wide">
                  Suggested Subjects
                  <span className="text-xs text-[var(--text-secondary)] font-normal ml-2">— {results.suggestions.length} matches via keyword + synonym analysis</span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.suggestions.map((s, i) => (
                  <SubjectCard key={`sug-${i}`} data={s} source="document"
                    isSaved={isSaved(s.subject || s.name, 'document')}
                    toggleSave={toggleSave} openChat={openChat} toggleCompare={toggleCompare}
                    isSelected={compareSelection.some(sel => (sel.subject || sel) === (s.subject || s.name))} />
                ))}
              </div>
            </div>
          )}

          {/* Alternative Subjects */}
          {results?.alternatives?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[var(--text-primary)] tracking-wide">
                  Alternative Subjects
                  <span className="text-xs text-[var(--text-secondary)] font-normal ml-2">— also from your documents, worth exploring</span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.alternatives.map((s, i) => (
                  <SubjectCard key={`alt-${i}`} data={s} source="alternative"
                    isSaved={isSaved(s.subject || s.name, 'alternative')}
                    toggleSave={toggleSave} openChat={openChat} toggleCompare={toggleCompare}
                    isSelected={compareSelection.some(sel => (sel.subject || sel) === (s.subject || s.name))} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !results && !extracted && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
              <span className="text-6xl mb-4">🔮</span>
              <p className="text-[var(--text-primary)] font-bold tracking-wide">Your AI suggestions will appear here.</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm">Upload documents and describe your interests above to generate personalized subject recommendations.</p>
            </div>
          )}

          {/* Comparison Tray */}
          {compareSelection.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-glass)] shadow-[0_8px_30px_rgba(3,8,15,0.8)] rounded-2xl p-4 flex items-center justify-between z-40 animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[var(--accent-highlight)] uppercase tracking-widest">Compare</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{compareSelection.length}/2 Selected</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 flex-1">
                  {compareSelection.map(s => (
                    <span key={s.subject || s} className="px-3 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-bold tracking-wide rounded-full border border-[var(--border-glass)] flex items-center gap-2 truncate max-w-[200px]">
                      <span className="truncate">{s.subject || s}</span>
                      <button onClick={() => toggleCompare(s)} className="text-[var(--text-secondary)] hover:text-[var(--color-error)] font-bold ml-1 transition-colors">×</button>
                    </span>
                  ))}
                  {compareSelection.length === 1 && (
                    <span className="px-3 py-1.5 bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs font-bold tracking-wide rounded-full border border-dashed border-[rgba(56,189,248,0.1)]">
                      Select one more...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCompareSelection([])} className="px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-xl font-bold uppercase tracking-wide transition-colors">Clear</button>
                <button disabled={compareSelection.length !== 2} onClick={generateComparison} className="px-6 py-2 text-xs uppercase tracking-widest bg-[var(--accent-primary)] text-white shadow-md rounded-xl font-bold hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] transition-shadow disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed">
                  Compare
                </button>
              </div>
            </div>
          )}

          <CompareModal isOpen={showCompareModal} onClose={() => setShowCompareModal(false)}
            selection={compareSelection} isLoading={isCompareLoading} result={compareResult} />

          <AskAiChatModal isOpen={!!chatSubject} onClose={() => setChatSubject(null)}
            chatSubject={chatSubject} chatHistory={chatHistory} isChatLoading={isChatLoading}
            chatInput={chatInput} setChatInput={setChatInput} handleChatSubmit={handleChatSubmit} />

        </div>
      )}

      {/* ══════════════ SAVED TAB ══════════════ */}
      {activeTab === 'saved' && (
        <SavedSubjects saved={saved} toggleSave={toggleSave} clearSaved={clearSaved} setActiveTab={setActiveTab} />
      )}

      {/* ══════════════ HISTORY TAB ══════════════ */}
      {activeTab === 'history' && (
        <SuggesterHistory history={history} loadFromHistory={loadFromHistory} clearHistory={clearHistory} deleteHistoryItem={deleteHistoryItem} />
      )}

    </div>
  );
}