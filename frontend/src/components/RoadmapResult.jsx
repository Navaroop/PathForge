import React from 'react';

function toText(item) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') return item.title || item.topic || item.name || item.description || JSON.stringify(item);
  return String(item ?? '');
}

export default function RoadmapResult({ data, checkedState, expandedState, onCheck, onToggle, onRetake, isJd, onSave, isSaved }) {
  if (!data) return null;
  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 bg-[var(--bg-surface)] border border-[var(--border-glass)] shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)]">
              {isJd ? '🎯 JD-Based Career Roadmap' : '✦ Your AI Career Roadmap'}
            </p>
            <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">{data.title}</p>
            {data.targetJob && (
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-success)] font-bold mt-2 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] inline-block px-2.5 py-1 rounded-full">
                Tailored for: {data.targetJob}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {onSave && (
              <button onClick={() => onSave(isJd)} disabled={isSaved}
                className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-colors ${
                  isSaved 
                    ? 'bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.3)] text-[var(--color-success)] opacity-80 cursor-default'
                    : 'bg-[var(--accent-glow)] border-[var(--accent-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white'
                }`}>
                {isSaved ? "✅ Saved" : "💾 Save"}
              </button>
            )}
            {onRetake && (
              <button onClick={onRetake}
                className="px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors">
                ↺ Retake
              </button>
            )}
          </div>
        </div>
        {data.summary && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">{data.summary}</p>
        )}
      </div>

      {/* Learning Timeline - Hidden for JD-Resume Analysis roadmaps */}
      {data.months?.length > 0 && !(isJd && data.skillsAnalysis) && (
        <div className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Learning Timeline</h2>
          {data.months.map((block, bIdx) => {
            const blockId = `m${block.month || bIdx}`;
            const isExpanded = !!expandedState[blockId];
            return (
              <div key={blockId} className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-sm overflow-hidden hover:border-[var(--border-hover)] transition-colors">
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => onToggle(blockId, isJd)}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)] flex-shrink-0 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                    <div>
                      <p className="font-bold text-[var(--text-primary)] tracking-wide">Month {block.month || bIdx + 1} — {block.theme || ''}</p>
                      {block.domain && block.domain !== 'Primary' && (
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mt-0.5">{block.domain}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[var(--accent-highlight)] text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--border-glass)] px-5 pb-4 pt-3 space-y-5 bg-[var(--bg-surface)]">
                    {Array.isArray(block.weeks) && block.weeks.map((week, wIdx) => (
                      <div key={wIdx} className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-highlight)] border-b border-[var(--border-glass)] pb-1.5">
                          Week {week.week || wIdx + 1}
                        </h4>
                        {Array.isArray(week.topics) && week.topics.map((topic, tIdx) => {
                          const key = `m${block.month ?? bIdx}_w${wIdx}_t${tIdx}`;
                          const isDone = !!checkedState[key];
                          const topicTitle = toText(topic);
                          return (
                            <div key={key} className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${isDone ? "bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.2)]" : "bg-[var(--bg-surface)] border-[var(--border-glass)] hover:border-[var(--border-hover)]"}`}>
                              <div onClick={() => onCheck(key, isJd)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${isDone ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-[var(--border-hover)] bg-[var(--bg-surface)]"}`}>
                                {isDone && <span className="text-white text-[10px] font-black">✓</span>}
                              </div>
                              <span className={`text-sm font-bold tracking-wide ${isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>{topicTitle}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Milestone */}
                    {block.milestone && (
                      <div className="bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.2)] rounded-xl p-3 mt-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-success)] mb-1">🏆 Milestone</p>
                        <p className="text-sm text-[var(--color-success)] leading-relaxed">{toText(block.milestone)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Projects */}
      {data.projects?.length > 0 && (
        <div className="space-y-3 mt-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">🛠 Project Ideas</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm space-y-2">
            {data.projects.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[var(--accent-highlight)] mt-0.5 font-black">{i + 1}.</span>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{toText(p)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Topics - Hidden for JD-Resume Analysis roadmaps */}
      {data.additionalTopics?.length > 0 && !(isJd && data.skillsAnalysis) && (
        <div className="space-y-3 mt-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Additional Topics</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-5 shadow-sm space-y-2">
            {data.additionalTopics.map((item, i) => {
              const key = `add_${i}`;
              const isDone = !!checkedState[key];
              return (
                <div key={key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${isDone ? "bg-[rgba(52,211,153,0.05)] border-[rgba(52,211,153,0.2)]" : "bg-[var(--bg-surface)] border-[var(--border-glass)] hover:border-[var(--border-hover)]"}`}>
                  <div onClick={() => onCheck(key, isJd)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${isDone ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-[var(--border-hover)] bg-[var(--bg-surface)]"}`}>
                    {isDone && <span className="text-white text-[10px] font-black">✓</span>}
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>{toText(item)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills Analysis (JD + Resume) */}
      {data.skillsAnalysis && (
        <div className="space-y-4 mt-6 pt-4 border-t border-[var(--border-glass)]">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span className="text-[var(--accent-highlight)]">📊</span> Skill Gap Analysis
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Have */}
            {data.skillsAnalysis.have?.length > 0 && (
              <div className="bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.2)] rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-success)] mb-3 flex items-center gap-2">
                  <span className="text-base">✅</span> Skills You Already Have
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.skillsAnalysis.have.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] rounded-full text-xs font-bold text-[var(--color-success)]">
                      {toText(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improve */}
            {data.skillsAnalysis.improve?.length > 0 && (
              <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#f59e0b] mb-3 flex items-center gap-2">
                  <span className="text-base">⚠️</span> Skills to Improve
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.skillsAnalysis.improve.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-full text-xs font-bold text-[#f59e0b]">
                      {toText(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Learn */}
            {data.skillsAnalysis.learn?.length > 0 && (
              <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-error)] mb-3 flex items-center gap-2">
                  <span className="text-base">❌</span> Missing Skills to Learn
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.skillsAnalysis.learn.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-full text-xs font-bold text-[var(--color-error)]">
                      {toText(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
