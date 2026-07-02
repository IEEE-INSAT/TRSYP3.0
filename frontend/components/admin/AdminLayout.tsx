'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAdminStore } from '@/lib/store';
import { useAuthStore } from '@/lib/store/auth-store';
import { ToastProvider } from './AdminToast';

const SIDEBAR_LINKS = [
  { label: 'Overview', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Participants', href: '/admin/participants', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { label: 'Challengers', href: '/admin/challengers', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const load = useAdminStore((s) => s.load);
  const lock = useAdminStore((s) => s.lock);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogout = () => {
    lock();
    signOut(); // signOut() already redirects to '/'
  };

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <ToastProvider>
      <div className="adm-layout">
        <aside className={`adm-sidebar ${sidebarOpen ? 'adm-sidebar-open' : ''}`}>
          <div className="adm-sidebar-header">
            <a href="/" className="adm-sidebar-logo">TRSYP 3.0</a>
            <span className="adm-sidebar-badge">Admin</span>
          </div>
          <nav className="adm-sidebar-nav">
            {SIDEBAR_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`adm-sidebar-link ${currentPath === l.href ? 'adm-sidebar-link-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={l.icon} />
                </svg>
                {l.label}
              </a>
            ))}
          </nav>
          <button className="adm-sidebar-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout Admin
          </button>
        </aside>

        <div className="adm-main">
          <header className="adm-topbar">
            <button className="adm-topbar-toggle" onClick={() => setSidebarOpen((p) => !p)} aria-label="Toggle sidebar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <span className="adm-topbar-title">Admin Dashboard</span>
            <a href="/" className="adm-topbar-home">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              View Site
            </a>
          </header>
          <div className="adm-content">
            {children}
          </div>
        </div>

        {sidebarOpen && <div className="adm-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      </div>
    </ToastProvider>
  );
}
