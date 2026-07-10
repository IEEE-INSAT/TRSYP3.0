'use client';

import { motion } from 'motion/react';

const GAMES = [
  {
    id: 'garden',
    accent: 'green' as const,
    tag: 'Communication · Observation',
    title: 'The Garden Game',
    desc: 'Deep inside the simulation lies a strange digital garden, filled with hidden signals, scattered clues, and locked paths. To move forward, teams must explore the environment, collect the right information, and decode the message hidden within the garden. Success here depends on communication, observation, and the ability to transform scattered data into one clear decision.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" />
        <path d="M12 12C12 12 5 12 5 5c0 0 7 0 7 7z" />
        <path d="M12 12c0 0 7 0 7-7 0 0-7 0-7 7z" />
        <path d="M8 22h8" />
      </svg>
    ),
  },
  {
    id: 'poly',
    accent: 'pink' as const,
    tag: 'Strategy · Adaptation',
    title: 'The Polygame',
    desc: 'In another zone of the simulation, stability has collapsed. Structures must be rebuilt, patterns must be understood, and every move can shift the balance between the two teams. Robots enter a strategic construction battlefield where speed alone is not enough : teams must adapt, make smart decisions, and rebuild order from chaos before their opponent takes control.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
        <path d="M12 2v20M2 8.5l10 5.5 10-5.5M2 15.5l10-5.5 10 5.5" />
      </svg>
    ),
  },
  {
    id: 'mine',
    accent: 'green' as const,
    tag: 'Trust · Guided Autonomy',
    title: 'The Mine Game',
    desc: 'This mission takes place in a dangerous minefield where direct human intervention is impossible. A critical object lies beyond the danger zone, and only the robot can enter. Guided entirely by its human partner, the robot must identify safe access points, cross hostile terrain, complete the rescue mission, and return safely.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 5V3M9 3h6" />
        <path d="M19 6l1.5-1.5M5 6L3.5 4.5" />
        <path d="M9 13a3 3 0 106 0" />
      </svg>
    ),
  },
];

export default function ChallengePage() {
  return (
    <div className="challenge-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Human-Robot Symbiosis · 17-18 October 2026</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">CHALLENGE</h1>
          </motion.div>
        </div>
      </section>

      {/* ── COMPETITION ── */}
      <section className="challenge-story">
        <div className="prog-container">
          <motion.div
            className="challenge-story-inner"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">TRSYP 3.0 is officially launching</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="challenge-story-h">
              This year, TRSYP is not just a robotics competition.
              <br />
              <span className="prog-hl">It is a story.</span>
            </h2>
            <p className="challenge-story-p">
              Following the success of our previous editions, we are proud to announce the 3rd edition of the
              Tunisian RAS Student and Young Professional Congress : A story set inside a simulation where humans
              and robots must learn to trust each other, complete missions together, and survive challenges that
              neither side could overcome alone.
            </p>
            <p className="challenge-story-p">
              Under the theme of <strong>Human-Robot Symbiosis</strong>, teams will enter an arena where every
              robot becomes more than a machine. It becomes a partner, an explorer, a builder, and sometimes, the
              only hope in a dangerous mission. Inside this simulation, three games await.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── THREE GAMES ── */}
      <section className="challenge-games">
        <div className="prog-container-wide">
          <div className="challenge-games-grid">
            {GAMES.map((g, i) => (
              <motion.div
                key={g.id}
                className={`why-bento-card why-bento-card--${g.accent} challenge-game-card`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="why-bento-edge" />
                <div className="why-bento-top">
                  <span className="why-bento-tag">{g.tag}</span>
                </div>
                <div className="why-bento-icon">{g.icon}</div>
                <h3 className="why-bento-title">{g.title}</h3>
                <p className="challenge-game-desc">{g.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="challenge-games-footer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Each game is designed to test more than technical performance. It will test strategy, trust, teamwork,
            creativity, and the ability to build a real connection between human thinking and robotic action.
            <br />
            This is not just about building the fastest robot. It is about building the strongest partnership
            between human and machine. Welcome to <strong>TRSYP 3.0</strong>. Welcome to the arena of{' '}
            <span className="prog-hl">Human-Robot Symbiosis</span>.
          </motion.p>
        </div>
      </section>

      {/* ── SPECIFICATION BOOK ── */}
      <section className="prog-cta challenge-specbook">
        <div className="prog-container">
          <div className="prog-cta-inner">
            <div className="challenge-specbook-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <h2 className="prog-cta-h">
              The Full <span className="prog-hl">Specification Book</span>
            </h2>
            <p className="prog-cta-p">
              All rules, technical details, scoring systems, and participation guidelines for the Garden Game,
              Polygame, and Mine Game will be published soon.
            </p>
            <a
              href="/docs/TRSYP3.0-Specification-Book.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="prog-cta-btn"
            >
              DOWNLOAD SPECIFICATION BOOK
            </a>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL CHALLENGE ── */}
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
            <h2 className="challenge-coming-title">Technical Challenge</h2>
            <p className="challenge-coming-desc">
              Our dedicated technical challenge (autonomous navigation, embedded systems, and hands-on engineering
              tasks separate from the Human-Robot Symbiosis competition) is being finalized.
            </p>
            <div className="challenge-coming-badge">
              <span className="challenge-coming-dot" />
              Coming Soon
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
