'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

const TEAM = [
  { name: 'Member Name', role: 'General Chair', email: 'chair@trsyp.ieee.tn', unit: 'GC-001' },
  { name: 'Member Name', role: 'Vice Chair', email: 'vicechair@trsyp.ieee.tn', unit: 'VC-002' },
  { name: 'Member Name', role: 'Technical Lead', email: 'tech@trsyp.ieee.tn', unit: 'TL-003' },
  { name: 'Member Name', role: 'Logistics Lead', email: 'logistics@trsyp.ieee.tn', unit: 'LG-004' },
  { name: 'Member Name', role: 'Media Lead', email: 'media@trsyp.ieee.tn', unit: 'ML-005' },
  { name: 'Member Name', role: 'Sponsorship Lead', email: 'sponsors@trsyp.ieee.tn', unit: 'SP-006' },
  { name: 'Member Name', role: 'Workshop Coordinator', email: 'workshops@trsyp.ieee.tn', unit: 'WC-007' },
  { name: 'Member Name', role: 'Challenge Coordinator', email: 'challenge@trsyp.ieee.tn', unit: 'CC-008' },
];

function IdCard({ member, index }: { member: typeof TEAM[0]; index: number }) {
  return (
    <motion.div
      className="id-card-wrap"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <div className="id-card">
        {/* Front */}
        <div className="id-card-front">
          <div className="id-card-header">
            <div className="id-card-header-left">
              <span className="id-card-org">IEEE RAS</span>
              <span className="id-card-badge">TRSYP 3.0</span>
            </div>
            <div className="id-card-unit">{member.unit}</div>
          </div>

          <div className="id-card-avatar">
            <div className="id-card-avatar-ring">
              <div className="id-card-avatar-inner">
                <Image
                  src="/rayhane.png"
                  alt={member.name}
                  width={80}
                  height={80}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
            </div>
            <div className="id-card-scanline" />
          </div>

          <div className="id-card-info">
            <h3 className="id-card-name">{member.name}</h3>
            <span className="id-card-role">{member.role}</span>
          </div>

          <div className="id-card-footer">
            <div className="id-card-barcode">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ width: Math.random() > 0.5 ? '3px' : '1.5px' }} />
              ))}
            </div>
            <span className="id-card-flip-hint">TAP TO FLIP</span>
          </div>

          <div className="id-card-circuit" aria-hidden="true">
            <svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 50h30l10 10v40l-10 10H0" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
              <path d="M200 80h-20l-8 8v30" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
              <circle cx="30" cy="100" r="2" fill="currentColor" opacity="0.1" />
              <circle cx="172" cy="118" r="2" fill="currentColor" opacity="0.1" />
              <path d="M0 200h15l5-5h20l5 5v30" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
              <path d="M200 250h-40l-10-10v-20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
            </svg>
          </div>
        </div>

        {/* Back */}
        <div className="id-card-back">
          <div className="id-card-header">
            <span className="id-card-org">CLEARANCE</span>
            <span className="id-card-badge">LEVEL 3</span>
          </div>

          <div className="id-card-back-content">
            <div className="id-card-back-row">
              <span className="id-card-back-label">UNIT ID</span>
              <span className="id-card-back-value">{member.unit}</span>
            </div>
            <div className="id-card-back-row">
              <span className="id-card-back-label">DESIGNATION</span>
              <span className="id-card-back-value">{member.role}</span>
            </div>
            <div className="id-card-back-row">
              <span className="id-card-back-label">COMMS</span>
              <span className="id-card-back-value id-card-back-email">{member.email}</span>
            </div>
            <div className="id-card-back-row">
              <span className="id-card-back-label">STATUS</span>
              <span className="id-card-back-value">
                <span className="id-card-status-dot" />
                ACTIVE
              </span>
            </div>
            <div className="id-card-back-row">
              <span className="id-card-back-label">EVENT</span>
              <span className="id-card-back-value">TRSYP 3.0 — OCT 2026</span>
            </div>
          </div>

          <div className="id-card-footer">
            <div className="id-card-barcode">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ width: Math.random() > 0.5 ? '3px' : '1.5px' }} />
              ))}
            </div>
            <span className="id-card-flip-hint">TAP TO FLIP BACK</span>
          </div>

          <div className="id-card-circuit" aria-hidden="true">
            <svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 50h30l10 10v40l-10 10H0" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
              <path d="M200 80h-20l-8 8v30" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div className="about-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <div className="prog-eyebrow">
            <span className="prog-eyebrow-line" />
            <span className="prog-eyebrow-text">The People Behind the Machines</span>
            <span className="prog-eyebrow-line" />
          </div>
          <h1 className="prog-hero-h">ABOUT US</h1>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="team-section">
        <div className="prog-container">
          <div className="team-header">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Crew Manifest</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="team-title">Meet the Team</h2>
            <p className="team-sub">
              The operators, architects, and engineers making TRSYP 3.0 happen.
              Each card is a unit ID — tap to reveal clearance details.
            </p>
          </div>

          <div className="team-grid">
            {TEAM.map((m, i) => (
              <IdCard key={m.unit} member={m} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
