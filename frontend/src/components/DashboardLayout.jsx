import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import Navbar from './Navbar';

export const studentData = {
  fullName: 'Navaroop Amjuri',
  email: 'naani@example.com',
  department: 'Computer Science Engineering (CSE)',
  currentSemester: 5,
  cgpa: 8.4,
  attendanceOverall: 78,
};

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/dashboard/attendance',
    label: 'Attendance',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    path: '/dashboard/cgpa',
    label: 'CGPA Tracker',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: '/dashboard/subjects',
    label: 'Subject Suggester',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    path: '/dashboard/roadmap',
    label: 'Career Roadmap',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();

  // Pull data from localStorage or fallback
  const fullName = localStorage.getItem('fullName') || studentData.fullName;
  const department = localStorage.getItem('department') || studentData.department;

  return (
    <div className="flex flex-col h-screen overflow-hidden text-[var(--text-primary)]">
      
      {/* Integrated Navbar Component */}
      <Navbar
        theme={theme}
        onThemeToggle={toggleTheme}
        onMenuToggle={() => setIsSidebarOpen(p => !p)}
        user={{ name: fullName, branch: department }}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Deep Space Background Glows (Only visible in dark mode effectively unless opacity increased) */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[var(--accent-primary)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-[var(--accent-highlight)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
          </>
        )}

        {/* Left Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-[200px]' : 'w-[72px]'} bg-[var(--bg-secondary)] border-r border-[var(--border-glass)] flex flex-col z-10 hidden sm:flex shrink-0 transition-all duration-300`}>
          <nav className="flex-1 py-6 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                title={!isSidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-[11.5px] font-medium transition-all ${
                    isActive
                      ? 'text-[var(--accent-highlight)] bg-[var(--accent-glow)] border-r-2 border-[var(--accent-highlight)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--accent-highlight)] hover:bg-[var(--bg-surface)] border-r-2 border-transparent'
                  }`
                }
              >
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center w-full'}`}>
                  <span className="pb-0.5 w-5 h-5 flex-shrink-0">{item.icon}</span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </div>
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t border-[var(--border-glass)]">
            <button
              onClick={() => navigate('/signin')}
              title={!isSidebarOpen ? 'Sign Out' : undefined}
              className={`flex items-center px-4 py-2 text-[11.5px] font-medium text-[var(--text-secondary)] hover:text-[var(--color-warning)] hover:bg-[rgba(251,191,36,0.1)] rounded-lg transition-colors border border-transparent ${isSidebarOpen ? 'gap-3 w-full' : 'justify-center w-full'}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10 w-full">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

export default DashboardLayout;