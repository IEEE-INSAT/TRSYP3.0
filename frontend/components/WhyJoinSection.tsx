'use client';

import { motion } from 'motion/react';

const REASONS = [
  {
    num: '01',
    tag: 'COMPETE',
    title: 'Battle-Test Your Robots',
    desc: 'Enter real-world robotics challenges — autonomous navigation, line-following, sumo bots, and more. Prove your engineering under pressure.',
    accent: 'green',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4l4 8 9 1.3-6.5 6.3 1.5 9L24 24l-8 4.6 1.5-9L11 13.3l9-1.3z" />
        <circle cx="24" cy="36" r="8" strokeDasharray="4 3" />
        <path d="M20 44h8" />
      </svg>
    ),
  },
  {
    num: '02',
    tag: 'CONNECT',
    title: '350+ Minds. One Mission.',
    desc: 'Engineers, researchers, students, and young professionals from across Tunisia converge for two days of ideas, demos, and breakthroughs.',
    accent: 'pink',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="14" r="5" />
        <circle cx="32" cy="14" r="5" />
        <circle cx="24" cy="34" r="5" />
        <path d="M19 18l5 12M29 18l-5 12" />
        <path d="M11 14h-4M37 14h4M24 42v4" strokeDasharray="3 2" />
      </svg>
    ),
  },
  {
    num: '03',
    tag: 'LEARN',
    title: 'From Lab to Keynote',
    desc: '20+ speakers and workshop leaders on ROS2, computer vision, reinforcement learning, and human-robot interfaces. Hands-on, not hand-wavy.',
    accent: 'green',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="8" width="36" height="24" rx="3" />
        <path d="M24 32v8M14 40h20" />
        <path d="M16 16h6M16 22h16" strokeDasharray="0" />
        <circle cx="36" cy="16" r="2" fill="currentColor" />
        <path d="M28 16l4 3-4 3" />
      </svg>
    ),
  },
  {
    num: '04',
    tag: 'LAUNCH',
    title: 'Your Project. Their Eyes.',
    desc: 'Showcase your prototypes, pitch to industry mentors, and get real feedback. The best ideas get noticed — and funded.',
    accent: 'pink',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4v10M24 14l-8 12h16L24 14z" />
        <path d="M16 26c-4 4-6 10-6 14h28c0-4-2-10-6-14" />
        <path d="M20 34h8" strokeDasharray="3 2" />
        <circle cx="24" cy="42" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function WhyJoinSection() {
  return (
    <section className="why" id="why-join">
      <div className="why-scanline" aria-hidden="true" />

      <div className="why-inner">
        {/* Header */}
        <div className="why-header">
          <div className="why-eyebrow">
            <span className="why-eyebrow-line" />
            <span className="why-eyebrow-text">Why TRSYP 3.0</span>
            <span className="why-eyebrow-line" />
          </div>
          <h2 className="why-title">
            FOUR REASONS TO<br />
            <span className="why-title-hl">SHOW UP</span>
          </h2>
        </div>

        {/* Bento grid */}
        <motion.div
          className="why-bento"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {REASONS.map((r) => (
            <motion.div
              key={r.num}
              className={`why-bento-card why-bento-card--${r.accent}`}
              variants={cardVariant}
            >
              <div className="why-bento-top">
                <span className="why-bento-num">{r.num}</span>
                <span className="why-bento-tag">{r.tag}</span>
              </div>
              <div className="why-bento-icon">{r.icon}</div>
              <h3 className="why-bento-title">{r.title}</h3>
              <p className="why-bento-desc">{r.desc}</p>
              <div className="why-bento-edge" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
