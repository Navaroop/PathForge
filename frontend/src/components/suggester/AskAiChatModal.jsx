import React, { useEffect, useRef } from 'react';

const AskAiChatModal = ({ isOpen, onClose, chatSubject, chatHistory, isChatLoading, chatInput, setChatInput, handleChatSubmit }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:p-6 bg-[var(--bg-primary)]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-primary)] sm:rounded-[2rem] shadow-2xl w-full sm:w-[420px] h-full sm:max-h-[700px] flex flex-col overflow-hidden border border-[var(--border-glass)] animate-in slide-in-from-right-12 duration-300">
        <div className="px-6 py-4 border-b border-[var(--border-glass)] flex justify-between items-center bg-[var(--bg-surface)] shadow-sm z-10">
          <div className="flex flex-col justify-center">
            <p className="text-[10px] text-[var(--accent-highlight)] font-bold uppercase tracking-widest mb-0.5">Ask AI Advisor</p>
            <h3 className="font-bold text-[var(--text-primary)] text-sm truncate max-w-[280px]">{chatSubject}</h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-full w-8 h-8 flex items-center justify-center font-bold pb-0.5 transition-colors shadow-sm">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[var(--bg-primary)] scroll-smooth">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-200`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-glass)] rounded-tr-sm' 
                  : 'bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.1)] text-[var(--text-secondary)] rounded-tl-sm'
              }`}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 && line.trim() ? "mt-2" : ""}>
                    {line.startsWith('-') ? <span className="ml-2 text-[var(--accent-highlight)]">• <span className="text-[var(--text-secondary)]">{line.substring(1)}</span></span> : line}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {isChatLoading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
            <div className="flex justify-start animate-in fade-in">
              <div className="bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.1)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-[var(--accent-highlight)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[var(--accent-highlight)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[var(--accent-highlight)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleChatSubmit} className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-glass)] z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about prerequisites, topics..." 
              className="w-full pl-5 pr-14 py-3.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl text-sm focus:border-[var(--accent-highlight)] outline-none transition-colors text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim() || isChatLoading}
              className="absolute right-2 w-10 h-10 flex items-center justify-center bg-[var(--accent-primary)] text-white rounded-[12px] hover:bg-[var(--accent-highlight)] hover:shadow-[0_0_10px_rgba(56,189,248,0.4)] disabled:opacity-50 disabled:hover:shadow-none transition-all font-black"
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskAiChatModal;
