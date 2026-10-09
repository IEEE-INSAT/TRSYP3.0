'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

const PROGRAM = [
  {
    id: 'd1',
    label: 'Day 1',
    date: '16 October 2026 · Hackathon',
    venue: 'Le Royal, Yasmine Hammamet',
    items: [
      { time: '11:00 – 12:00', icon: 'pin', title: 'Hackathon Check-in', desc: 'Registration and welcome for hackathon teams.', where: 'Le Royal', who: 'Hackathon participants' },
      { time: '13:00 – 13:30', icon: 'rocket', title: 'Hackathon Launch', desc: 'Introduction and official launch of the hackathon with our partners.', where: 'Le Royal', who: 'Hackathon participants' },
      { time: '13:30 – 14:30', icon: 'tools', title: 'Workshop', desc: 'A hands-on workshop to kick off the hackathon.', where: 'Le Royal', who: 'Hackathon participants' },
      { time: '14:30 – 15:00', icon: 'food', title: 'Coffee Break', desc: 'A short break before the first build session.', where: 'Le Royal', who: 'Hackathon participants' },
      { time: '15:00 – 19:00', icon: 'tools', title: 'Hackathon · Session 1', desc: 'First build session of the hackathon.', where: 'Le Royal', who: 'Hackathon participants' },
      { time: '19:00 – 20:30', icon: 'food', title: 'Dinner', desc: 'Dinner break for hackathon teams.', where: 'Dining Hall', who: 'Hackathon participants' },
      { time: '20:30 – 23:00', icon: 'tools', title: 'Hackathon · Session 2', desc: 'Second build session of the hackathon.', where: 'Le Royal', who: 'Hackathon participants' },
      { time: '23:00 – 01:00', icon: 'people', title: 'Networking Activities', desc: 'Wind down and connect with fellow participants.', where: 'Le Royal', who: 'Hackathon participants' },
    ],
  },
  {
    id: 'd2',
    label: 'Day 2',
    date: '17 October 2026 · Opening & Competition',
    venue: 'Le Royal, Yasmine Hammamet',
    items: [
      { time: 'From 09:00', icon: 'pin', title: 'Check-in', desc: 'Participant registration and welcome.', where: 'Le Royal', who: 'All attendees' },
      { time: '10:00', icon: 'building', title: 'Exhibition & Booth Setup', desc: 'Exhibitors and partners set up their booths.', where: 'Expo Area', who: 'Exhibitors · Partners' },
      { time: '10:30 – 11:30', icon: 'trophy', title: 'Hackathon Pitching', desc: 'Hackathon teams pitch their projects to the jury.', where: 'Le Royal', who: 'Hackathon participants' },
      { time: '13:30 – 14:00', icon: 'pin', title: 'Ceremony Check-in', desc: 'Doors open for the opening ceremony.', where: 'Salle de Cérémonies', who: 'All attendees' },
      { time: '14:00 – 17:00', icon: 'mic', title: 'Opening Ceremony', desc: 'The official opening of TRSYP 3.0.', where: 'Salle de Cérémonies', who: 'All attendees' },
      { time: '17:00 – 17:30', icon: 'food', title: 'Coffee Break', desc: 'Coffee break to network between sessions.', where: 'Le Royal', who: 'All attendees' },
      { time: '17:30 – 18:30', icon: 'poster', title: 'Exhibition · Booths · Poster Session', desc: 'Explore partner booths, robotics projects and research posters.', where: 'Expo Area', who: 'Open · Drop-in' },
      { time: '19:00 – 21:00', icon: 'food', title: 'Dinner', desc: 'Dinner with fellow attendees.', where: 'Dining Hall', who: 'All attendees' },
      { time: '20:30 – 00:00', icon: 'trophy', title: 'Technical Competition', desc: 'Teams compete live, animated by a DJ.', where: 'Le Royal', who: 'Competition participants' },
      { time: '23:00 – 01:00', icon: 'people', title: 'Party', desc: 'Celebrate the night with a DJ set.', where: 'Le Royal', who: 'All attendees' },
    ],
  },
  {
    id: 'd3',
    label: 'Day 3',
    date: '18 October 2026 · Learning & Celebration',
    venue: 'Le Royal, Yasmine Hammamet',
    items: [
      { time: '07:00 – 08:30', icon: 'food', title: 'Breakfast', desc: 'Start the day with breakfast and informal networking.', where: 'Dining Hall', who: 'All attendees' },
      {
        time: '07:00 – 08:30',
        icon: 'trophy',
        title: 'Challenge Pitching · Session 1',
        desc: 'First round of challenge pitches.',
        where: 'Salle Luxor · Salle Ramsès',
        who: 'Challenge participants',
        details: ['Non-technical challenge pitching · Salle Luxor', 'Technical challenge pitching · Salle Ramsès'],
      },
      {
        time: '09:00 – 10:00',
        icon: 'tools',
        title: 'Workshops · Session 1',
        desc: 'Parallel workshops - pick the one that fits you.',
        where: 'Workshop Rooms',
        who: 'Registered participants',
        details: [
          'Pitching Workshop · Yosr Bayar · Salle Césarion (mandatory for technical challenge participants)',
          'IES Workshop · Salle Sphinx',
          'YP Tech Session · Salle César',
        ],
      },
      { time: '10:15 – 11:15', icon: 'mic', title: 'Distinguished Lecturer Session', desc: 'Social psychology and social robotics, by IEEE Distinguished Lecturer Prof. Friederike Eyssel.', where: 'Salle de Cérémonies', who: 'All attendees' },
      { time: '11:15 – 12:00', icon: 'pin', title: 'Check-out & Lunch', desc: 'Hotel check-out followed by lunch.', where: 'Reception · Dining Hall', who: 'All attendees' },
      { time: '12:00 – 13:00', icon: 'trophy', title: 'Technical Challenge Pitching · Session 2', desc: 'Technical teams pitch, followed by a 5-minute live demo.', where: 'Salle Ramsès', who: 'Technical challenge participants' },
      {
        time: '12:00 – 13:00',
        icon: 'tools',
        title: 'Workshops · Session 2',
        desc: 'Parallel workshops and round tables.',
        where: 'Workshop Rooms',
        who: 'Registered participants',
        details: [
          'NVIDIA Jetson Nano: Edge AI Workshop · Mohamed Ali Farhat · Salle Sphinx',
          'YP Round Tables · Salle César',
          'RAS Leaders · Salle Césarion',
        ],
      },
      {
        time: '15:00 – 17:00',
        icon: 'trophy',
        title: 'Closing Ceremony',
        desc: 'Awards, acknowledgements and the final winner announcement.',
        where: 'Salle de Cérémonies',
        who: 'All attendees',
        details: [
          'Sponsor thanks',
          'Best Ambassador',
          'Hackathon winners',
          'IEEE RAS Tunisia Student Branch Chapter of the Year Award',
          'Outstanding IEEE RAS Day Tunisia Award 2026',
          'Technical Challenge winners & jury thanks',
          'Finalists announcement',
          'Vote and winner announcement',
        ],
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
  const [activeTab, setActiveTab] = useState('d2');

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
              <span className="prog-eyebrow-text">16–18 October 2026 · Le Royal, Yasmine Hammamet</span>
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
                      {item.details && (
                        <ul className="prog-tl-details">
                          {item.details.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      )}
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
    </div>
  );
}
