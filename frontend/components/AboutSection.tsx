const PILLARS = [
  {
    icon: 'perception',
    title: 'Perception & Autonomy',
    desc: 'Advancing robotic perception, real-time decision-making, and autonomous systems that extend human capabilities.',
  },
  {
    icon: 'symbiosis',
    title: 'Human-Robot Co-Design',
    desc: 'Building collaborative systems where human intuition and machine precision work as one unified intelligence.',
  },
  {
    icon: 'ethics',
    title: 'Ethics & Impact',
    desc: 'Ensuring inclusive design, societal accountability, and ethical compliance shape every innovation we deploy.',
  },
];

const STATS = [
  { number: '3rd', label: 'Edition' },
  { number: '2', label: 'Days of Innovation' },
  { number: '350+', label: 'Participants' },
  { number: '20+', label: 'Speakers & Experts' },
];

function PillarIcon({ type }: { type: string }) {
  if (type === 'perception') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    );
  }
  if (type === 'symbiosis') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export default function AboutSection() {
  return (
    <section className="about" id="about">
      {/* Atmospheric background */}
      <div className="ab-grid-overlay" aria-hidden="true" />
      <div className="ab-glow-green" aria-hidden="true" />
      <div className="ab-glow-pink" aria-hidden="true" />

      {/* Corner frame accents */}
      <div className="ab-corner ab-corner--tl" aria-hidden="true" />
      <div className="ab-corner ab-corner--br" aria-hidden="true" />

      <div className="ab-inner">
        {/* Section eyebrow */}
        <div className="ab-eyebrow">
          <span className="ab-eyebrow-line" />
          <span className="ab-eyebrow-text">About the Congress</span>
          <span className="ab-eyebrow-line" />
        </div>

        {/* Two-column hero */}
        <div className="ab-hero-grid">
          {/* Left — Title */}
          <div className="ab-title-col">
            <div className="ab-vline-accent" aria-hidden="true" />
            <h2 className="ab-main-title">
              TRSYP
              <span className="ab-title-accent">3.0</span>
            </h2>
            <p className="ab-edition">Third Edition &mdash; 2025</p>
            <p className="ab-tagline">
              Where <span className="ab-tagline-hl">human intuition</span> meets{' '}
              <span className="ab-tagline-hl">machine precision</span> &mdash;
              shaping the future of robotics, together.
            </p>
          </div>

          {/* Right — Description + Pillars */}
          <div className="ab-desc-col">
            <p className="ab-desc-text">
              The <strong>Tunisian RAS Student and Young Professional Congress</strong>,
              organized by the IEEE INSAT Student Branch in collaboration with the
              IEEE RAS Tunisia Section, is the annual flagship gathering of robotics
              enthusiasts from across Tunisia and beyond.
              <br /><br />
              This edition explores <strong>Human&ndash;Robot Symbiosis</strong> as a
              foundational paradigm &mdash; the co-design of next-generation solutions
              that fuse robotic capabilities with human strengths like decision-making,
              ethics, and adaptability.
            </p>

            <div className="ab-pillars">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="ab-pillar">
                  <div className="ab-pillar-icon">
                    <PillarIcon type={pillar.icon} />
                  </div>
                  <div>
                    <h3 className="ab-pillar-title">{pillar.title}</h3>
                    <p className="ab-pillar-desc">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="ab-divider" aria-hidden="true" />

        {/* Stats ribbon */}
        <div className="ab-stats">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="ab-stat-card">
              <div className="ab-stat-num">{stat.number}</div>
              <div className="ab-stat-label">{stat.label}</div>
              {i < STATS.length - 1 && <div className="ab-stat-sep" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
