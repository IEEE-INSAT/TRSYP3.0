'use client';

import { motion } from 'motion/react';

export default function ChallengePage() {
  return (
    <div className="challenge-pg">
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <div className="prog-eyebrow">
            <span className="prog-eyebrow-line" />
            <span className="prog-eyebrow-text">Prove Your Engineering</span>
            <span className="prog-eyebrow-line" />
          </div>
          <h1 className="prog-hero-h">CHALLENGE</h1>
        </div>
      </section>

      <section className="challenge-coming">
        <div className="prog-container">
          <motion.div
            className="challenge-coming-inner"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="challenge-robot-icon">
              <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="30" y="20" width="60" height="44" rx="10" />
                <circle cx="48" cy="38" r="6" />
                <circle cx="72" cy="38" r="6" />
                <path d="M44 50h32" strokeDasharray="4 3" />
                <rect x="36" y="70" width="48" height="32" rx="6" />
                <path d="M20 80h16M84 80h16" />
                <circle cx="50" cy="82" r="4" fill="currentColor" stroke="none" />
                <circle cx="70" cy="82" r="4" fill="currentColor" stroke="none" />
                <path d="M60 10v10" />
                <circle cx="60" cy="8" r="3" />
              </svg>
            </div>
            <h2 className="challenge-coming-title">Challenges Coming Soon</h2>
            <p className="challenge-coming-desc">
              Technical and non-technical robotics challenges are being finalized.
              Autonomous navigation, line-following, sumo bots, and more — stay tuned.
            </p>
            <div className="challenge-coming-badge">
              <span className="challenge-coming-dot" />
              Details Launching September 2026
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
