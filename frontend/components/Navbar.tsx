'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from './AuthContext';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Challenge', href: '/challenge' },
  { label: 'Program', href: '/program' },
  { label: 'Venue', href: '/venue' },
  { label: 'About Us', href: '/about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { isRegistered } = useAuth();

  return (
    <>
      <nav className="navbar">
        <a className="navbar-logo" href="/">
          <Image
            src="/trsyp-logo.png"
            alt="TRSYP 3.0"
            width={240}
            height={82}
            priority
            style={{ height: '146px', width: 'auto', objectFit: 'contain' }}
          />
        </a>

        <ul className="navbar-links">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>

        <div className="navbar-right-group">
          {isRegistered ? (
            <a className="navbar-dashboard" href="/dashboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Dashboard
            </a>
          ) : (
            <button className="navbar-register" onClick={() => setShowRegister(true)}>
              Register Now
            </button>
          )}
          <a className="navbar-admin-link" href="/admin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </a>
        </div>

        <button
          className="navbar-hamburger"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          <span style={open ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
          <span style={open ? { opacity: 0 } : {}} />
          <span style={open ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
        </button>
      </nav>

      <div className={`navbar-mobile-menu ${open ? 'open' : ''}`}>
        {NAV_LINKS.map((l) => (
          <a key={l.label} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        {isRegistered ? (
          <a className="navbar-mobile-register navbar-mobile-dashboard" href="/dashboard" onClick={() => setOpen(false)}>
            My Dashboard
          </a>
        ) : (
          <button
            className="navbar-mobile-register"
            onClick={() => { setOpen(false); setShowRegister(true); }}
          >
            Register Now
          </button>
        )}
      </div>

      {showRegister && !isRegistered && (
        <div className="reg-overlay" onClick={() => setShowRegister(false)}>
          <div className="reg-popup" onClick={(e) => e.stopPropagation()}>
            <button className="reg-close" onClick={() => setShowRegister(false)} aria-label="Close">
              &times;
            </button>
            <div className="reg-popup-header">
              <span className="reg-popup-badge">TRSYP 3.0</span>
              <h3 className="reg-popup-title">Register As</h3>
              <p className="reg-popup-sub">Choose your registration type</p>
            </div>
            <div className="reg-popup-buttons">
              <a href="/register/participant" className="reg-btn reg-btn-participant">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Participant</span>
              </a>
              <a href="/register/challenger" className="reg-btn reg-btn-challenger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Challenger</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
