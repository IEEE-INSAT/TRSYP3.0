'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { phaseOf } from './register/ActivityToggle';
import { REGISTRATION_OPEN } from '@/lib/config';

/**
 * The two tracks a team can actually register for. Status is read from the same
 * config the registration flow uses (`activityPhases`), so this section can
 * never drift from what /register will really let you do.
 */
const TRACKS = [
  {
    id: 'competition',
    activity: 'COMPETITION' as const,
    label: 'Track 01',
    name: 'The Competition',
    summary:
      'Three missions inside the simulation. Human–robot pairs explore, build, and rescue. Scored on how well the two work as one.',
    points: ['Three missions', 'Team-based', 'Human–robot pairs'],
    href: 'https://drive.google.com/file/d/10qb9dc_adraO7BAllJWBB1Ue3rLYMq6m/view?usp=sharing',
  },
  {
    id: 'technical',
    activity: 'CHALLENGE' as const,
    label: 'Track 02',
    name: 'Technical Challenge',
    summary:
      'Autonomous navigation, embedded systems, and hands-on engineering tasks.',
    points: ['Autonomous navigation', 'Embedded systems', 'Engineering tasks'],
    href: 'https://drive.google.com/file/d/1qtixTEgNhvlKSnxkAGL2xf_IyEZ_6tbQ/view?usp=sharing',
  },
];

const PHASE_LABEL = {
  open: 'Registration open',
  soon: 'Registration closed',
  closed: 'Registration closed',
} as const;

/**
 * Track 02's three focus areas - labels only.
 *
 * These are already public (they're the track's own summary), so nothing here
 * is invented. Rendered as locked tiles: it gives the section the same
 * three-part rhythm as Track 01 and signals that detail is coming, without
 * claiming rules or scoring that haven't been published.
 */
const TECHNICAL_AREAS = [
  {
    id: 'navigation',
    label: 'Autonomous navigation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </svg>
    ),
  },
  {
    id: 'embedded',
    label: 'Embedded systems',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
        <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
      </svg>
    ),
  },
  {
    id: 'engineering',
    label: 'Hands-on engineering',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

const GAMES = [
  {
    id: 'garden',
    index: '01',
    accent: 'green' as const,
    tag: 'Communication · Observation',
    objective: 'Explore the garden, collect the scattered signals, and decode the message hidden inside it.',
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
    index: '02',
    accent: 'pink' as const,
    tag: 'Strategy · Adaptation',
    objective: 'Rebuild what has collapsed and take control of the board before the opposing team does.',
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
    index: '03',
    accent: 'green' as const,
    tag: 'Trust · Guided Autonomy',
    objective: 'Guide your robot across the minefield by voice alone, recover the object, and bring it back.',
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

      {/* ── TWO TRACKS ── */}
      <section className="challenge-tracks" id="tracks">
        <div className="prog-container-wide">
          <div className="prog-eyebrow challenge-tracks-eyebrow">
            <span className="prog-eyebrow-line" />
            <span className="prog-eyebrow-text">Two ways to take part</span>
            <span className="prog-eyebrow-line" />
          </div>

          <div className="challenge-tracks-grid">
            {TRACKS.map((track, i) => {
              const phase = phaseOf(track.activity);
              const open = phase === 'open' && REGISTRATION_OPEN;
              const specificationBookAvailable = open || track.id === 'technical';

              return (
                <motion.div
                  key={track.id}
                  className={`challenge-track challenge-track--${phase}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <div className="challenge-track-head">
                    <span className="challenge-track-label">{track.label}</span>
                    <span className={`challenge-track-status challenge-track-status--${phase}`}>
                      <span className="challenge-track-dot" />
                      {PHASE_LABEL[phase]}
                    </span>
                  </div>

                  <h3 className="challenge-track-name">{track.name}</h3>
                  <p className="challenge-track-summary">{track.summary}</p>

                  <ul className="challenge-track-points">
                    {track.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>

                  {specificationBookAvailable ? (
                    <Link href={track.href} className="challenge-track-cta">
                      DOWNLOAD SPECIFICATION BOOK
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <span className="challenge-track-cta challenge-track-cta--disabled">
                      {PHASE_LABEL[phase]}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
                    <motion.div
            className="challenge-manifesto"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="challenge-manifesto-tags">
              {['Strategy', 'Trust', 'Teamwork', 'Creativity'].map((word, i) => (
                <span key={word} className="challenge-manifesto-tag">
                  {word}
                  {i < 3 && <span className="challenge-manifesto-dot" aria-hidden="true" />}
                </span>
              ))}
            </div>

            <p className="challenge-manifesto-line">
              This isn&apos;t about building the fastest robot.
            </p>
            <p className="challenge-manifesto-line challenge-manifesto-line--hl">
              It&apos;s about building the strongest <span className="prog-hl">partnership</span> between human and machine.
            </p>

            <div className="challenge-manifesto-tagline">
              Welcome to <strong>TRSYP 3.0</strong>. Welcome to the arena of{' '}
              <span className="prog-hl">Human-Robot Symbiosis</span>.
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── THREE MISSIONS ── */}
      <section className="challenge-games" id="missions">
        <div className="prog-container-wide">
          <div className="challenge-games-head">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Track 01 · The three missions</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="challenge-story-h">Inside the simulation.</h2>
          </div>

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
                <div className="challenge-game-head">
                  <span className="challenge-game-index">{g.index}</span>
                  <div className="why-bento-icon">{g.icon}</div>
                </div>
                <span className="why-bento-tag">{g.tag}</span>
                <h3 className="why-bento-title">{g.title}</h3>
                {/* One scannable line before the narrative - readers who don't
                    want the full story still learn what the mission asks. */}
                <p className="challenge-game-objective">{g.objective}</p>
                <p className="challenge-game-desc">{g.desc}</p>
              </motion.div>
            ))}
          </div>


        </div>
      </section>
      {/* ── SPECIFICATION BOOK ── */}
      <section className="prog-cta challenge-specbook">
        <div className="prog-container-wide">
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
              Everything you need for the Garden Game, Polygame, and Mine Game.
            </p>
            <div className="challenge-manifesto-tags challenge-specbook-tags">
              {['Rules', 'Technical Details', 'Scoring Systems', 'Participation Guidelines'].map((word, i, arr) => (
                <span key={word} className="challenge-manifesto-tag">
                  {word}
                  {i < arr.length - 1 && <span className="challenge-manifesto-dot" aria-hidden="true" />}
                </span>
              ))}
            </div>
            <a
              href="https://drive.google.com/file/d/10qb9dc_adraO7BAllJWBB1Ue3rLYMq6m/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="prog-cta-btn"
            >
              VIEW SPECIFICATION BOOK
            </a>
          </div>
        </div>
      </section>
      {/* ── TRACK 02 ──
          Deliberately not a mirror of Track 01: nothing about this track is
          published yet, so it stays a short status note rather than a grid of
          detail that doesn't exist. */}
      <section className="challenge-technical" id="technical">
        <div className="challenge-games-head">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Track 02</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="challenge-story-h">Technical Challenge</h2>
          </div>
        <div className="prog-container">
          <div className="challenge-technical-inner">
            <p className="challenge-technical-desc">
              A dedicated track, separate from the Human-Robot Symbiosis competition, built on three
              areas of engineering.
            </p>

            <div className="challenge-areas">
              {TECHNICAL_AREAS.map((area, i) => (
                <motion.div
                  key={area.id}
                  className="challenge-area"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <span className="challenge-area-icon">{area.icon}</span>
                  <span className="challenge-area-label">{area.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL CHALLENGE SPECIFICATION BOOK ── */}
      <section className="prog-cta challenge-specbook">
        <div className="prog-container-wide">
          <div className="prog-cta-inner">
            <div className="challenge-specbook-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <h2 className="prog-cta-h">
              The Technical Challenge <span className="prog-hl">Specification Book</span>
            </h2>
            <p className="prog-cta-p">
              The full terms of reference for the SymbioMed Challenge, the medical technical challenge of TRSYP 3.0.
            </p>
            <div className="challenge-manifesto-tags challenge-specbook-tags">
              {['Mandatory Requirements', 'Technical Architecture', 'Phases & Validation', 'Ethics & Budget'].map((word, i, arr) => (
                <span key={word} className="challenge-manifesto-tag">
                  {word}
                  {i < arr.length - 1 && <span className="challenge-manifesto-dot" aria-hidden="true" />}
                </span>
              ))}
            </div>
            <a
              href={TRACKS[1].href}
              target="_blank"
              rel="noopener noreferrer"
              className="prog-cta-btn"
            >
              VIEW SPECIFICATION BOOK
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
