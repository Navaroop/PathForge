import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Command, Bell, Sun, Moon, Check, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function Navbar({ theme, onThemeToggle, onMenuToggle, user }) {
  const navigate = useNavigate();

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notificationsRef = useRef(null);

  const notificationsList = [
    { id: 1, type: 'warning', title: 'Low Attendance Alert', desc: 'Your DSP attendance dropped to 72%', time: '2 hours ago', unread: true },
    { id: 2, type: 'success', title: 'Roadmap Generated', desc: 'Your Software Engineer roadmap is ready', time: '5 hours ago', unread: true },
    { id: 3, type: 'info', title: 'Semester Registration', desc: 'Registrations open next week', time: '1 day ago', unread: true }
  ];

  const searchablePages = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Attendance Tracker', path: '/dashboard/attendance' },
    { label: 'CGPA Tracker', path: '/dashboard/cgpa' },
    { label: 'Subject Suggester', path: '/dashboard/subjects' },
    { label: 'Career Roadmap Generator', path: '/dashboard/roadmap' }
  ];

  const quickActions = [
    { label: 'Sign Out', path: '/signin' }
  ];

  const filteredPages = searchablePages.filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredActions = quickActions.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()));

  // Handle global cmd/ctrl + k shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    setUnreadCount(0);
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AA';

  return (
    <header className={`h-[60px] flex items-center justify-between px-6 shrink-0 z-50 transition-colors backdrop-blur-xl border-b ${
      theme === 'light'
        ? 'bg-[rgba(240,247,255,0.80)] border-[rgba(14,165,233,0.15)] shadow-[0_2px_16px_rgba(14,165,233,0.08)]'
        : 'bg-[var(--bg-secondary)] border-[var(--border-glass)]'
    }`}>
      
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="text-[var(--accent-highlight)] hover:bg-[var(--bg-surface-hover)] p-1.5 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-glow)] flex items-center justify-center shadow-[0_0_10px_var(--accent-glow)] group-hover:scale-105 transition-transform duration-300">
            <span className="text-white text-base font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>PF</span>
          </div>
          <div className="hidden md:flex flex-col justify-center">
            <span 
              className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-primary)] group-hover:from-[var(--accent-primary)] group-hover:to-[var(--accent-highlight)] transition-all duration-300 leading-none drop-shadow-sm" 
              style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}
            >
              PATHFORGE
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-lg mx-6 hidden sm:block relative" ref={searchContainerRef}>
        <div className={`relative flex items-center w-full transition-all duration-200 rounded-xl border ${
          isSearchOpen 
            ? 'bg-[var(--bg-primary)] border-[var(--accent-highlight)] shadow-[0_0_0_2px_rgba(14,165,233,0.2)]'
            : 'bg-[var(--bg-surface)] border-[var(--border-glass)] hover:border-[var(--border-hover)]'
        }`}>
          <Search size={16} className="absolute left-3 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pages, actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full bg-transparent border-none py-2 pl-9 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder-[var(--text-muted)]"
          />
          <div className="absolute right-3 flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--border-glass)] bg-[var(--bg-primary)] opacity-70">
            <Command size={10} className="text-[var(--text-muted)]" />
            <span className="text-[10px] font-bold text-[var(--text-muted)]">K</span>
          </div>
        </div>

        {/* Search Dropdown */}
        {isSearchOpen && (filteredPages.length > 0 || filteredActions.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-primary)] border border-[var(--border-glass)] rounded-xl shadow-[var(--card-shadow)] overflow-hidden z-50">
            {filteredPages.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1.5">Pages</div>
                <div className="flex flex-col gap-0.5">
                  {filteredPages.map(page => (
                    <button 
                      key={page.path}
                      onClick={() => { navigate(page.path); setIsSearchOpen(false); setSearchQuery(''); }} 
                      className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {filteredActions.length > 0 && (
              <div className="border-t border-[var(--border-glass)] p-2 bg-[var(--bg-secondary)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1.5">Quick Actions</div>
                {filteredActions.map(action => (
                  <button 
                    key={action.path}
                    onClick={() => { navigate(action.path); setIsSearchOpen(false); setSearchQuery(''); }} 
                    className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Notifications, Toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--accent-highlight)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-error)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-error)]"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-glass)] rounded-xl shadow-[var(--card-shadow)] overflow-hidden z-50">
              <div className="flex items-center justify-between p-3 border-b border-[var(--border-glass)] bg-[var(--bg-secondary)]">
                <span className="text-xs font-bold text-[var(--text-primary)]">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] flex items-center gap-1 font-semibold text-[var(--accent-highlight)] hover:text-[var(--text-primary)] transition-colors">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1 flex flex-col">
                {notificationsList.map(notif => (
                  <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${notif.unread && unreadCount > 0 ? 'bg-[var(--bg-surface-hover)]' : 'hover:bg-[var(--bg-surface-hover)]'}`}>
                    <div className={`p-1.5 rounded-full flex-shrink-0 bg-[var(--bg-primary)] border border-[var(--border-glass)] shadow-sm ${
                      notif.type === 'warning' ? 'text-[var(--color-warning)]' :
                      notif.type === 'success' ? 'text-[var(--color-success)]' :
                      'text-[var(--accent-primary)]'
                    }`}>
                      {notif.type === 'warning' && <AlertTriangle size={14} />}
                      {notif.type === 'success' && <CheckCircle2 size={14} />}
                      {notif.type === 'info' && <Info size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{notif.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-snug">{notif.desc}</p>
                      <p className="text-[9px] text-[var(--text-muted)] font-medium mt-1.5">{notif.time}</p>
                    </div>
                    {notif.unread && unreadCount > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0 self-center"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-2 border-l border-[var(--border-glass)] pl-2 sm:pl-4">
          <button
            onClick={onThemeToggle}
            className={`relative w-12 sm:w-14 h-6 sm:h-7 rounded-full flex items-center transition-all duration-300 flex-shrink-0 ${
              theme === 'light' 
                ? 'bg-[rgba(255,255,255,0.60)] border border-[rgba(14,165,233,0.18)]' 
                : 'bg-[rgba(14,165,233,0.10)] border border-[rgba(56,189,248,0.12)] shadow-[0_0_10px_rgba(14,165,233,0.30)]'
            }`}
          >
            <span className={`absolute flex items-center justify-center w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full shadow transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              theme === 'light'
                ? 'translate-x-[3px] bg-white text-[#38bdf8] shadow-[0_2px_4px_rgba(14,165,233,0.2)]'
                : 'translate-x-[26px] sm:translate-x-8 bg-[#38bdf8] text-[#03080f] shadow-[0_0_8px_#38bdf8]'
            }`}>
              {theme === 'light' ? <Sun size={10} className="sm:w-3 sm:h-3" /> : <Moon size={10} className="sm:w-3 sm:h-3" />}
            </span>
          </button>
          <span className={`text-[9px] font-bold uppercase tracking-widest hidden lg:block ${theme === 'light' ? 'text-[var(--text-primary)]' : 'text-transparent'}`}>Light</span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-[var(--border-glass)]">
          <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white text-xs sm:text-sm font-black">{getInitials(user?.name)}</span>
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-[11.5px] font-bold text-[var(--text-primary)] leading-tight">{user?.name || 'User'}</p>
            <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">{user?.branch || 'General'}</p>
          </div>
        </div>

      </div>
    </header>
  );
}
