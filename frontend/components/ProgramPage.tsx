'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { REGISTRATION_OPEN } from '@/lib/config';

const PROGRAM = [
  {
    id: 'pre',
    label: 'Pre-Conference',
    date: 'September 2026',
    venue: 'Online + ALECSO HQ',
    items: [
      { time: 'Early Sep', icon: 'form', title: 'Participant Forms', desc: 'Complete registration & participant forms to secure your spot.', where: 'Online', who: 'All registrants' },
      // { time: 'Mid Sep', icon: 'mail', title: 'Invitations', desc: 'Official invitations distributed to selected participants, speakers, and VIPs.', where: 'Email', who: 'Selected list' },
      { time: 'Late Sep', icon: 'star', title: 'ALECSO × INSAT Preview', desc: 'Exclusive robotics exposition preview : a special collaboration with ALECSO and INSAT.', where: 'ALECSO HQ', who: 'Speakers · Partners · Press' },
    ],
  },
   {
    id: "d1",
    label: "Day 01 : Innovation & Networking",
    date: "17 October 2026",
    venue: "Le Royal, Yasmine Hammamet",
    items: [
      {
        time: "08:00 – 12:00",
        icon: "pin",
        title: "Check-in & Booth Setup",
        desc: "Participant registration alongside company booths and forum setup.",
        where: "Lobby & Expo Hall",
        who: "All attendees · Exhibitors",
      },
      {
        time: "14:00 – 16:00",
        icon: "mic",
        title: "Opening Ceremony",
        desc: "Official opening with keynote speeches and welcome addresses.",
        where: "Main Hall",
        who: "All attendees",
      },
      {
        time: "16:00 – 16:30",
        icon: "people",
        title: "Networking Break",
        desc: "Coffee break to connect with participants, speakers, and partners.",
        where: "Atrium",
        who: "All attendees",
      },
      {
        time: "16:30 – 19:00",
        icon: "poster",
        title: "Job Fair · Exposition · Poster Session",
        desc: "Explore company booths, discover innovative robotics projects, and engage with researchers.",
        where: "Expo Hall",
        who: "Open · Drop-in",
      },
      {
        time: "19:00 – 20:00",
        icon: "food",
        title: "Dinner",
        desc: "Enjoy dinner while continuing conversations with fellow attendees.",
        where: "Dining Hall",
        who: "All attendees",
      },
      {
        time: "20:00 – 23:00",
        icon: "trophy",
        title: "Competition",
        desc: "Competition sessions featuring participating teams.",
        where: "Main Hall",
        who: "Participants",
      },
      {
        time: "23:00 – 01:00",
        icon: "people",
        title: "Networking Night & Social Activities",
        desc: "Relax, network, and enjoy curated social activities with the community.",
        where: "Outdoor Area",
        who: "All attendees",
      },
    ],
  },

  {
    id: "d2",
    label: "Day 02 : Learning & Celebration",
    date: "18 October 2026",
    venue: "Le Royal, Yasmine Hammamet",
    items: [
      {
        time: "07:00 – 08:30",
        icon: "food",
        title: "Breakfast",
        desc: "Start the day with breakfast and informal networking.",
        where: "Dining Hall",
        who: "All attendees",
      },
      {
        time: "09:00 – 10:30",
        icon: "mic",
        title: "Distinguished Lecturers Session",
        desc: "Inspiring talks delivered by internationally recognized IEEE Distinguished Lecturers, sharing expertise and insights on the latest trends in robotics and automation.",
        where: "Main Hall",
        who: "All attendees",
      },
      {
        time: "10:30 – 11:00",
        icon: "pin",
        title: "Check-out",
        desc: "Hotel check-out before the afternoon program.",
        where: "Reception",
        who: "Accommodation guests",
      },
      {
        time: "11:00 – 12:30",
        icon: "tools",
        title: "Workshops & Challenge Pitching",
        desc: "Hands-on workshops followed by technical and non-technical challenge pitching sessions.",
        where: "Workshop Rooms",
        who: "Registered participants",
      },
      {
        time: "12:30 – 14:00",
        icon: "food",
        title: "Lunch & Networking",
        desc: "Lunch break with opportunities to connect with attendees and industry representatives.",
        where: "Dining Hall",
        who: "All attendees",
      },
      {
        time: "14:30 – 17:00",
        icon: "trophy",
        title: "Closing Ceremony",
        desc: "Celebration of the event with awards, acknowledgements, and closing remarks.",
        where: "Main Hall",
        who: "All attendees",
      },
    ],
  },
];

const ICONS: Record<string, React.ReactNode> = {
  form: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  mic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  poster: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>,
  rocket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3" /></svg>,
  food: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></svg>,
  people: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
  tools: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
};

export default function ProgramPage() {
  const [activeTab, setActiveTab] = useState('d1');
  const { isRegistered } = useAuth();

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-register-modal'));
  };

  const activeDay = PROGRAM.find((d) => d.id === activeTab)!;

  return (
    <div className="prog-page">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">17–18 October 2026 · Le Royal, Yasmine Hammamet</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">PROGRAM</h1>
          </motion.div>
        </div>
      </section>

      {/* Tabs + Timeline */}
      <section className="prog-body">
        <div className="prog-container">
          {/* Tab bar */}
          <div className="prog-tabs">
            {PROGRAM.map((d) => (
              <button
                key={d.id}
                className={`prog-tab ${activeTab === d.id ? 'prog-tab-active' : ''}`}
                onClick={() => setActiveTab(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Day info */}
          <motion.div
            className="prog-day-info"
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="prog-day-date">{activeDay.date}</span>
            <span className="prog-day-venue">{activeDay.venue}</span>
          </motion.div>

          {/* Timeline */}
          <motion.div
            className="prog-timeline"
            key={`tl-${activeTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {activeDay.items.map((item, i) => (
              <motion.div
                key={i}
                className="prog-tl-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                {/* Dot + line */}
                <div className="prog-tl-rail">
                  <span className="prog-tl-dot" />
                  {i < activeDay.items.length - 1 && <span className="prog-tl-line" />}
                </div>

                {/* Card */}
                <div className="prog-tl-card">
                  <span className="prog-tl-time">{item.time}</span>
                  <div className="prog-tl-content">
                    <span className="prog-tl-icon">{ICONS[item.icon]}</span>
                    <div>
                      <h3 className="prog-tl-title">{item.title}</h3>
                      <p className="prog-tl-desc">{item.desc}</p>
                      <div className="prog-tl-meta">
                        <span className="prog-tl-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {item.where}
                        </span>
                        <span className="prog-tl-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                          {item.who}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="prog-cta">
        <div className="prog-container">
          <div className="prog-cta-inner">
            <h2 className="prog-cta-h">
              Secure your seat. <span className="prog-hl">Limited capacity.</span>
            </h2>
            <p className="prog-cta-p">Two days. One symbiosis. Zero excuses.</p>
            {isRegistered ? (
              <Link href="/dashboard" className="prog-cta-btn">GO TO DASHBOARD</Link>
            ) : (
              <button
                onClick={handleRegisterClick}
                className="prog-cta-btn"
                disabled={!REGISTRATION_OPEN}
                title={REGISTRATION_OPEN ? undefined : 'Registration opens soon'}
                style={REGISTRATION_OPEN ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
              >
                {REGISTRATION_OPEN ? 'REGISTER NOW' : 'REGISTRATION SOON'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
