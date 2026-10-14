'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

type Speaker = {
  name: string;
  photo: string;
  title: string;
  affiliation?: string;
  topic: string;
  email?: string;
  linkedin?: string;
  website?: string;
};

const SPEAKERS: Speaker[] = [
  {
    name: 'Adel Alimi',
    photo: '/speakers/AdelAlimi.webp',
    title: 'Keynote · Panelist',
    affiliation: 'Professor at the National Engineering School of Sfax (ENIS), University of Sfax, Tunisia · Founder and Past-Director of REGIM Lab (LR11ES48), REsearch Groups in Intelligent Machines · Past Chair of the IEEE Africa Council · Chair of the Sfax Smart City Living Lab',
    topic: 'Human–Machine Interaction and Cognitive Robotics: Toward Intelligent and Collaborative Systems',
    email: 'adel.alimi@enis.tn',
  },
  {
    name: 'Friederike Eyssel',
    photo: '/speakers/FriederikeEyssel.webp',
    title: 'Distinguished Lecturer · Panelist',
    affiliation: 'Professor of Applied Social Psychology and Gender Research, Bielefeld University · Research bridging social psychology and social robotics: dehumanization and the attribution of humanlike traits to robots and technology · Pioneer in psychological approaches to anthropomorphism · IEEE-RAS Distinguished Lecturer Award (2022) · Karl-Peter Grotemeyer Prize for Excellence in Teaching (2021)',
    topic: 'Social Psychology and Social Robotics',
    email: 'feyssel@uni-bielefeld.de',
  },
  {
    name: 'Sahar Ammar',
    photo: '/speakers/SaharAmmar.jpg',
    title: 'Panelist',
    affiliation: 'Research engineer , Head of the Advanced Radiofrequency and Electronic Equipment Platform at the Microelectronics and Nanotechnology Research Center_ Business Coach & Training Facilitator.',
    topic: 'Panel · 17 October',
  },
  {
    name: 'Hichem Jarreya',
    photo: '/speakers/Hichem_Jarreya.jpg',
    title: 'Panelist',
    affiliation: 'Professor at the Faculty of Medicine of Tunis · Member of the European Association for Endoscopic Surgery (EAES)',
    topic: 'Panel · 17 October',
  },
  {
    name: 'Anis Koubaa',
    photo: '/speakers/AnisKoubaa.jpg',
    title: 'Speaker',
    affiliation: 'Executive Leader in AI, Digital Transformation & Innovation | Professor & Research Director | Building Intelligent Organizations, Technology Ventures & Talent for Saudi Vision 2030',
    topic: 'Agentic Robotics: From LLM Tool-Calling to Vision-Language-Action Models',
    email: 'akoubaa@alfaisal.edu',
    linkedin: 'https://www.linkedin.com/in/aniskoubaa/',
  },
  {
    name: 'John McDonald',
    photo: '/speakers/JohnMcDonald.jpg',
    title: 'Trainer · Online Workshop',
    affiliation: 'Deputy Head of Data Science Services · AI Speaker & Guest Lecturer · Mentor & Entrepreneur · USA',
    topic: 'Online Workshop',
    email: 'johndougmcd@gmail.com',
    linkedin: 'https://www.linkedin.com/in/johndougmcdonald/',
  },
  {
    name: 'Med Ali Farhat',
    photo: '/speakers/MedAliFarhat.webp',
    title: 'Trainer',
    affiliation: 'AI Engineer | 19× Awards & Hackathons Winner | Building Agentic & Multimodal Systems',
    topic: 'NVIDIA Jetson Nano: Edge AI (Workshop)',
    email: 'mohamedali.farhat@hotmail.com',
    website: 'https://mohamedalifarhat.com/',
  },
  {
    name: 'Yosr Bayar',
    photo: '/speakers/YosrBayar.jpg',
    title: 'Trainer',
    topic: 'Pitching Workshop',
    linkedin: 'https://www.linkedin.com/in/yosrbayar/',
    affiliation: 'CEO of VALORIZ Coaching & Training · Organizational Development Consultant · Certified Professional Coach',


  },
];

function SpeakerCard({ speaker, index }: { speaker: Speaker; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const affRef = useRef<HTMLParagraphElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bioId = `spk-bio-${index}`;

  const unflip = useCallback(() => setFlipped(false), []);

  // Only offer the full bio when the clamped text is actually cut off at the current width.
  useEffect(() => {
    const el = affRef.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [speaker.affiliation]);

  useEffect(() => {
    if (!bioOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBio();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bioOpen]);

  function openBio(e: React.MouseEvent) {
    e.stopPropagation();
    setBioOpen(true);
  }

  function closeBio(e?: React.MouseEvent) {
    e?.stopPropagation();
    setBioOpen(false);
    moreRef.current?.focus();
  }

  useEffect(() => {
    if (!flipped) return;
    window.addEventListener('scroll', unflip, { passive: true });
    return () => window.removeEventListener('scroll', unflip);
  }, [flipped, unflip]);
  return (
    <motion.div
      className={`spk-card-wrap${flipped ? ' flipped' : ''}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => {
        setBioOpen(false);
        setFlipped((f) => !f);
      }}
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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="spk-card-photo-overlay" />
            <span className="spk-card-badge">{speaker.title}</span>
          </div>

          {/* Info */}
          <div className="spk-card-body">
            <h3 className="spk-card-name">{speaker.name}</h3>
            {/* Always rendered: it reserves a fixed height so the separator lines up on every card. */}
            <p ref={affRef} className="spk-card-affiliation">{speaker.affiliation}</p>
            {/* Zero-height row: the arrow sits in the gap above the divider, so dividers still line up. */}
            <div className="spk-card-more-row">
              {truncated && (
                <button
                  ref={moreRef}
                  type="button"
                  className="spk-card-more"
                  aria-expanded={bioOpen}
                  aria-controls={bioId}
                  aria-label={`Read full bio of ${speaker.name}`}
                  title="Read full bio"
                  onClick={openBio}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>
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

          {/* Full bio, slides up over the front when the clamped text is cut off */}
          {truncated && (
            <div
              id={bioId}
              className={`spk-card-bio${bioOpen ? ' open' : ''}`}
              role="region"
              aria-label={`${speaker.name} bio`}
              aria-hidden={!bioOpen}
              inert={!bioOpen}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="spk-card-bio-head">
                <span className="spk-card-bio-name">{speaker.name}</span>
                <button
                  ref={closeRef}
                  type="button"
                  className="spk-card-more spk-card-more--close"
                  aria-label="Close bio"
                  title="Close bio"
                  onClick={closeBio}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
              <ul className="spk-card-bio-list">
                {speaker.affiliation?.split(' · ').map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

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
            {speaker.linkedin && (
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
            {speaker.website && (
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
