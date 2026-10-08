'use client';

import { motion } from 'motion/react';

type Workshop = {
  title: string;
  /** Session days, `YYYY-MM-DD`, in order. A bootcamp has several. */
  dates: string[];
  by: string;
  /** Who must attend, when it is not optional. */
  mandatoryFor?: string;
  /** Extra line under the title, e.g. "Certified workshops". */
  note?: string;
  /** Held during the congress itself (16-18 October). */
  congress?: { time: string; where: string };
};

const WORKSHOPS: Workshop[] = [
  { title: 'AI × Robotics', dates: ['2026-09-12'], by: 'Youssef Sghaier' },
  { title: 'Ethics in Robotics', dates: ['2026-09-12'], by: 'Tarek Lamouchi' },
  { title: 'Introduction to Mechanical Engineering', dates: ['2026-09-28'], by: 'Organized by ATR' },
  {
    title: 'Electronics Training Session',
    dates: ['2026-10-05'],
    by: 'Organized by ATR',
    mandatoryFor: 'Competition participants',
  },
  {
    title: 'Dar Blockchain Bootcamp',
    dates: ['2026-10-07', '2026-10-09', '2026-10-14'],
    by: 'Dar Blockchain',
    note: 'Certified workshops',
    mandatoryFor: 'All participants',
  },
  {
    title: 'Entrepreneurship in IoT and Robotics',
    dates: ['2026-10-10'],
    by: 'Mrs Amira Taghouti',
    mandatoryFor: 'Technical Challenge participants',
  },
  {
    title: 'Pitching Workshop',
    dates: ['2026-10-18'],
    by: 'Yosr Bayar',
    mandatoryFor: 'Technical Challenge participants',
    congress: { time: '09:00 – 10:00', where: 'Salle Césarion' },
  },
  {
    title: 'NVIDIA Jetson Nano: Edge AI',
    dates: ['2026-10-18'],
    by: 'Mohamed Ali Farhat',
    congress: { time: '12:00 – 13:00', where: 'Salle Sphinx' },
  },
];

type Status = 'done' | 'ongoing' | 'upcoming';

/** Compared as `YYYY-MM-DD` strings, so a workshop counts as done the day after its last session. */
function statusOf(w: Workshop, today: string): Status {
  if (w.dates[w.dates.length - 1] < today) return 'done';
  if (w.dates[0] < today) return 'ongoing';
  return 'upcoming';
}

const STATUS_LABELS: Record<Status, string> = {
  done: 'Completed',
  ongoing: 'In progress',
  upcoming: 'Upcoming',
};

/** "7, 9 & 14 October" - the month written once when every session shares it. */
function formatDates(dates: string[]): string {
  const parts = dates.map((d) => new Date(`${d}T12:00:00Z`));
  const month = (d: Date) => d.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const day = (d: Date) => d.getUTCDate();
  if (parts.every((d) => month(d) === month(parts[0]))) {
    const days = parts.map(day);
    const list = days.length > 1 ? `${days.slice(0, -1).join(', ')} & ${days[days.length - 1]}` : `${days[0]}`;
    return `${list} ${month(parts[0])}`;
  }
  return parts.map((d) => `${day(d)} ${month(d)}`).join(', ');
}

function WorkshopCard({ workshop, status, index }: { workshop: Workshop; status: Status; index: number }) {
  return (
    <motion.article
      className={`ws-card ws-card--${status}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <div className="ws-card-top">
        <span className="ws-date">{formatDates(workshop.dates)}</span>
        <span className={`ws-status ws-status--${status}`}>{STATUS_LABELS[status]}</span>
      </div>
      <h3 className="ws-title">{workshop.title}</h3>
      <p className="ws-by">{workshop.by}</p>
      {workshop.note && <p className="ws-note">{workshop.note}</p>}
      {(workshop.congress || workshop.mandatoryFor) && (
        <div className="ws-tags">
          {workshop.congress && (
            <span className="ws-tag ws-tag--congress">
              Congress Day · {workshop.congress.time} · {workshop.congress.where}
            </span>
          )}
          {workshop.mandatoryFor && (
            <span className="ws-tag ws-tag--mandatory">Mandatory for {workshop.mandatoryFor}</span>
          )}
        </div>
      )}
    </motion.article>
  );
}

export default function WorkshopsPage({ today }: { today: string }) {
  const withStatus = WORKSHOPS.map((w) => ({ workshop: w, status: statusOf(w, today) }));
  // Soonest first for what is coming, most recent first for what is behind us.
  const upcoming = withStatus.filter((w) => w.status !== 'done');
  const done = withStatus.filter((w) => w.status === 'done').reverse();

  return (
    <div className="prog-page">
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">The road to TRSYP 3.0</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">WORKSHOPS</h1>
          </motion.div>
        </div>
      </section>

      <section className="prog-body">
        <div className="prog-container">
          <h2 className="ws-section-h">
            Upcoming <span className="ws-count">{upcoming.length}</span>
          </h2>
          <div className="ws-grid">
            {upcoming.map(({ workshop, status }, i) => (
              <WorkshopCard key={workshop.title} workshop={workshop} status={status} index={i} />
            ))}
            <div className="ws-card ws-card--soon">
              <span className="ws-soon-h">More workshops soon</span>
              <p className="ws-soon-p">New sessions are added here as they are confirmed.</p>
            </div>
          </div>

          {done.length > 0 && (
            <>
              <h2 className="ws-section-h">
                Completed <span className="ws-count">{done.length}</span>
              </h2>
              <div className="ws-grid">
                {done.map(({ workshop, status }, i) => (
                  <WorkshopCard key={workshop.title} workshop={workshop} status={status} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
