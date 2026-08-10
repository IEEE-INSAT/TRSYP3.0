'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

const SPEAKERS = [
  {
    name: 'Anis Koubaa',
    photo: '/speakers/Anis Koubaa - Online Session.jpg',
    title: 'Speaker',
    affiliation: 'Executive Leader in AI, Digital Transformation & Innovation | Professor & Research Director | Building Intelligent Organizations, Technology Ventures & Talent for Saudi Vision 2030',
    topic: 'Agentic Robotics: From LLM Tool-Calling to Vision-Language-Action Models',
    email: 'akoubaa@alfaisal.edu',
    linkedin: 'https://www.linkedin.com/in/aniskoubaa/',
  },
  {
    name: 'Firas Ben Hassen',
    photo: '/speakers/Firas Ben Hassen.jpg',
    title: 'Speaker',
    affiliation: 'Deputy Head of Data Science Services · AI Speaker & Guest Lecturer · Mentor & Entrepreneur',
    topic: 'AI and Robots',
    email: 'Firas.ben-hassan@allianz.de',
    linkedin: 'https://www.linkedin.com/in/firas-ben-hassan-22bab3101/',
  },
  {
    name: 'John McDonald',
    photo: '/speakers/John McDonald - online session.jpg',
    title: 'Trainer · Online Workshop',
    affiliation: 'Deputy Head of Data Science Services · AI Speaker & Guest Lecturer · Mentor & Entrepreneur · USA',
    topic: 'Online Workshop',
    email: 'johndougmcd@gmail.com',
    linkedin: 'https://www.linkedin.com/in/johndougmcdonald/',
  },
  {
    name: 'Med Ali Farhat',
    photo: '/speakers/Med Ali Farhat.png',
    title: 'Trainer',
    affiliation: 'AI Engineer | 19× Awards & Hackathons Winner | Building Agentic & Multimodal Systems',
    topic: 'Jetson Nano Cards (Workshop)',
    email: 'mohamedali.farhat@hotmail.com',
    website: 'https://mohamedalifarhat.com/',
  },
  {
    name: 'Tarek Lamouchi',
    photo: '/speakers/Tarek Lamouchi.jpg',
    title: 'Trainer',
    affiliation: 'Deputy Head of Data Science Services · AI Speaker & Guest Lecturer · Mentor & Entrepreneur (Data, Data and Data)',
    topic: 'Pitching Workshop',
    email: 'tareklamouchi@gmail.com',
  },
];

function SpeakerCard({ speaker, index }: { speaker: (typeof SPEAKERS)[0]; index: number }) {
  return (
    <motion.div
      className="spk-card-wrap"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="spk-card">
        {/* ─── FRONT ─── */}
        <div className="spk-card-front">
          <div className="spk-card-glow" />

          {/* Photo */}
          <div className="spk-card-photo">
            <Image
              src={speaker.photo}
              alt={speaker.name}
              width={600}
              height={600}
              quality={100}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="spk-card-photo-overlay" />
            <span className="spk-card-badge">{speaker.title}</span>
          </div>

          {/* Info */}
          <div className="spk-card-body">
            <h3 className="spk-card-name">{speaker.name}</h3>
            <p className="spk-card-affiliation">{speaker.affiliation}</p>
            <div className="spk-card-divider" />
            <div className="spk-card-topic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{speaker.topic}</span>
            </div>
          </div>

          <span className="spk-card-flip-hint">TAP TO FLIP</span>

          {/* Circuit decoration */}
          <div className="spk-card-circuit" aria-hidden="true">
            <svg viewBox="0 0 300 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 60h20l8 8v50l-8 8H0" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
              <path d="M300 120h-30l-10 10v40" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
              <circle cx="20" cy="118" r="2" fill="currentColor" opacity="0.08" />
              <circle cx="270" cy="170" r="2" fill="currentColor" opacity="0.08" />
            </svg>
          </div>
        </div>

        {/* ─── BACK ─── */}
        <div className="spk-card-back">
          <div className="spk-card-glow" />

          <div className="spk-card-back-header">
            <span className="spk-card-back-label">CONTACT INFO</span>
            <span className="spk-card-badge">{speaker.title}</span>
          </div>

          <div className="spk-card-back-name">{speaker.name}</div>

          <div className="spk-card-back-content">
            {/* Email */}
            {speaker.email && (
              <a href={`mailto:${speaker.email}`} className="spk-card-contact-row" target="_blank" rel="noopener noreferrer">
                <div className="spk-card-contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                </div>
                <div className="spk-card-contact-info">
                  <span className="spk-card-contact-label">EMAIL</span>
                  <span className="spk-card-contact-value">{speaker.email}</span>
                </div>
              </a>
            )}

            {/* LinkedIn */}
            {'linkedin' in speaker && speaker.linkedin && (
              <a href={speaker.linkedin} className="spk-card-contact-row" target="_blank" rel="noopener noreferrer">
                <div className="spk-card-contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </div>
                <div className="spk-card-contact-info">
                  <span className="spk-card-contact-label">LINKEDIN</span>
                  <span className="spk-card-contact-value">View Profile</span>
                </div>
              </a>
            )}

            {/* Website */}
            {'website' in speaker && speaker.website && (
              <a href={speaker.website} className="spk-card-contact-row" target="_blank" rel="noopener noreferrer">
                <div className="spk-card-contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                </div>
                <div className="spk-card-contact-info">
                  <span className="spk-card-contact-label">WEBSITE</span>
                  <span className="spk-card-contact-value">Visit Website</span>
                </div>
              </a>
            )}

            {/* Topic */}
            <div className="spk-card-contact-row spk-card-contact-row--topic">
              <div className="spk-card-contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div className="spk-card-contact-info">
                <span className="spk-card-contact-label">TOPIC</span>
                <span className="spk-card-contact-value">{speaker.topic}</span>
              </div>
            </div>
          </div>

          <span className="spk-card-flip-hint">TAP TO FLIP BACK</span>

          {/* Circuit decoration */}
          <div className="spk-card-circuit" aria-hidden="true">
            <svg viewBox="0 0 300 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 60h20l8 8v50l-8 8H0" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
              <path d="M300 120h-30l-10 10v40" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SpeakersPage() {
  return (
    <div className="speakers-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <div className="prog-eyebrow">
            <span className="prog-eyebrow-line" />
            <span className="prog-eyebrow-text">Hear From the Experts</span>
            <span className="prog-eyebrow-line" />
          </div>
          <h1 className="prog-hero-h">SPEAKERS</h1>
        </div>
      </section>

      {/* Speakers Grid */}
      <section className="spk-section">
        <div className="prog-container">
          <div className="spk-header">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Distinguished Voices</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="spk-title">Our Speakers</h2>
            <p className="spk-sub">
              Leading researchers, innovators, and industry pioneers sharing their vision
              for the future of robotics, AI, and young professionals.
            </p>
          </div>

          <div className="spk-grid">
            {SPEAKERS.map((s, i) => (
              <SpeakerCard key={s.name} speaker={s} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
