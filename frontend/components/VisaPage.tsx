'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { REGISTRATION_OPEN } from '@/lib/config';

// Full visa-free list, kept in the same order/grouping as the reference (EU
// block first, then the rest), each paired with its flag.
const VISA_FREE_COUNTRIES: { name: string; code: string }[] = [
  { name: 'All European Union citizens (except Cyprus)', code: 'eu' },
  { name: 'Algeria', code: 'dz' },
  { name: 'Andorra', code: 'ad' },
  { name: 'Angola', code: 'ao' },
  { name: 'Antigua and Barbuda', code: 'ag' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Australia', code: 'au' },
  { name: 'Bahrain', code: 'bh' },
  { name: 'Barbados', code: 'bb' },
  { name: 'Benin', code: 'bj' },
  { name: 'Bosnia and Herzegovina', code: 'ba' },
  { name: 'Brazil', code: 'br' },
  { name: 'Brunei', code: 'bn' },
  { name: 'Burkina Faso', code: 'bf' },
  { name: 'Canada', code: 'ca' },
  { name: 'Cape Verde', code: 'cv' },
  { name: 'Chile', code: 'cl' },
  { name: 'Comoros', code: 'km' },
  { name: 'Costa Rica', code: 'cr' },
  { name: "Cote d'Ivoire", code: 'ci' },
  { name: 'Equatorial Guinea', code: 'gq' },
  { name: 'Fiji', code: 'fj' },
  { name: 'Gabon', code: 'ga' },
  { name: 'Gambia', code: 'gm' },
  { name: 'Guinea', code: 'gn' },
  { name: 'Guinea Bissau', code: 'gw' },
  { name: 'Hong Kong', code: 'hk' },
  { name: 'Honduras', code: 'hn' },
  { name: 'Iceland', code: 'is' },
  { name: 'Japan', code: 'jp' },
  { name: 'Jordan', code: 'jo' },
  { name: 'Kiribati', code: 'ki' },
  { name: 'South Korea', code: 'kr' },
  { name: 'Kuwait', code: 'kw' },
  { name: 'Libya', code: 'ly' },
  { name: 'Liechtenstein', code: 'li' },
  { name: 'Malaysia', code: 'my' },
  { name: 'Maldives', code: 'mv' },
  { name: 'Mali', code: 'ml' },
  { name: 'Mauritania', code: 'mr' },
  { name: 'Mauritius', code: 'mu' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Moldova', code: 'md' },
  { name: 'Monaco', code: 'mc' },
  { name: 'Montenegro', code: 'me' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Namibia', code: 'na' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Niger', code: 'ne' },
  { name: 'North Macedonia', code: 'mk' },
  { name: 'Norway', code: 'no' },
  { name: 'Oman', code: 'om' },
  { name: 'Qatar', code: 'qa' },
  { name: 'Russia', code: 'ru' },
  { name: 'Saint Kitts and Nevis', code: 'kn' },
  { name: 'Saint Lucia', code: 'lc' },
  { name: 'San Marino', code: 'sm' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Seychelles', code: 'sc' },
  { name: 'Singapore', code: 'sg' },
  { name: 'South Africa', code: 'za' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Turkey', code: 'tr' },
  { name: 'United Arab Emirates', code: 'ae' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'United States', code: 'us' },
  { name: 'Vatican City', code: 'va' },
];

const EXTENDED_STAYS = [
  { country: 'Canada', code: 'ca', duration: 'Can stay up to 4 months without a visa' },
  { country: 'Germany', code: 'de', duration: 'Can stay up to 4 months without a visa' },
  { country: 'Bulgaria', code: 'bg', duration: 'Can stay up to 2 months without a visa' },
  { country: 'Greece', code: 'gr', duration: 'Can stay up to 1 month without a visa' },
  { country: 'United States', code: 'us', duration: 'Can stay up to 4 months without a visa' },
];

const ARRIVAL_ELIGIBLE = [
  { name: 'Malaysia', code: 'my' },
  { name: 'Thailand', code: 'th' },
  { name: 'Indonesia', code: 'id' },
  { name: 'Singapore', code: 'sg' },
];

const ARRIVAL_DOCS = [
  {
    title: 'Valid Passport',
    desc: 'Valid for at least 6 months beyond your stay',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="10" r="3" />
        <path d="M8 18h8" />
      </svg>
    ),
  },
  {
    title: 'Hotel Booking',
    desc: 'Proof of accommodation for your entire stay',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    title: 'Return Ticket',
    desc: 'Confirmed flight reservation showing departure',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 16l20-7-7 20-3-8-8-3z" />
      </svg>
    ),
  },
  {
    title: 'Sufficient Funds',
    desc: 'Cash or bank statements showing financial capability',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const EMBASSY_STEPS = [
  { title: 'Find Embassy', desc: 'Locate your nearest Tunisian diplomatic mission' },
  {
    title: 'Prepare Documents',
    desc: 'Application form, recent photos, itinerary & hotel booking, invitation letter, and bank statements',
  },
  { title: 'Submit Application', desc: 'Apply in person or by mail depending on embassy requirements' },
  { title: 'Pay Fee', desc: 'Visa fees vary by nationality and visa type' },
];

const IMPORTANT_NOTES = [
  {
    title: 'Verify Requirements Early',
    desc: 'Every participant is responsible for checking and fulfilling their own visa requirements ahead of the congress.',
  },
  {
    title: 'Regulations Vary by Nationality',
    desc: 'Visa rules differ significantly from one nationality to another, and processing can take longer than expected.',
  },
  {
    title: 'Begin the Process Early',
    desc: "It's strongly recommended to start well in advance to avoid last-minute issues.",
  },
];

function Flag({ code, name, size = 24 }: { code: string; name: string; size?: number }) {
  return (
    <span className="visa-flag-box">
      <Image
        src={`https://flagcdn.com/w${size <= 24 ? 40 : 80}/${code}.webp`}
        alt={`${name} flag`}
        width={size}
        height={size * 0.75}
        className="visa-flag"
        unoptimized
      />
    </span>
  );
}

export default function VisaPage() {
  return (
    <div className="visa-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">For Travelers to Tunisia</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">VISA REQUIREMENTS</h1>
          </motion.div>
        </div>
      </section>

      {/* Visa policy intro */}
      <section className="visa-overview">
         <div className="prog-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Visa Policy for Tunisia</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="challenge-story-h">It depends on <span className="prog-hl">your nationality</span>.</h2>
            <p className="challenge-story-lead">
              Tunisia&apos;s visa policy isn&apos;t the same for everyone. Citizens of many countries can enter
              and stay for up to 90 days without a visa, while others must apply at a Tunisian embassy or
              consulate before arrival.
            </p>
            <p className="visa-note">
              Always check with the Tunisian embassy or consulate in your country for the most current visa
              information before you plan your trip.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Visa-free entry — full flagged list, same order as reference */}
      <section className="visa-free">
        <div className="prog-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Visa-Free Entry</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="challenge-story-h">
              Citizens of these countries don&apos;t need a visa for short stays (typically 90 days or less):
            </h2>
          </motion.div>

          <div className="visa-flag-list">
            {VISA_FREE_COUNTRIES.map((c, i) => (
              <motion.div
                key={c.name}
                className="visa-flag-item"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: (i % 12) * 0.02 }}
              >
                <Flag code={c.code} name={c.name} />
                <span>{c.name}</span>
              </motion.div>
            ))}
          </div>

          {/* Special duration cases */}
          <motion.div
            className="visa-extended"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Special Duration Cases</span>
              <span className="prog-eyebrow-line" />
            </div>
            <div className="visa-extended-grid">
              {EXTENDED_STAYS.map((s) => (
                <div key={s.country} className="visa-extended-card">
                  <Flag code={s.code} name={s.country} size={48} />
                  <h4>{s.country}</h4>
                  <p>{s.duration}</p>
                </div>
              ))}
            </div>
            <p className="visa-note">
              Always check with the Tunisian embassy or consulate in your country for the latest updates.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How to apply */}
      <section className="visa-apply">
        <div className="prog-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">How to Apply for a Tunisian Visa</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="challenge-story-h">Option 1: Visa on arrival</h2>
            <p className="challenge-story-lead">
              Some nationalities can get a visa on the spot at Tunis-Carthage Airport or other entry points.
              Always confirm eligibility before you travel. Eligible countries include:
            </p>
          </motion.div>

          <div className="visa-flag-list visa-flag-list--compact">
            {ARRIVAL_ELIGIBLE.map((c) => (
              <div key={c.name} className="visa-flag-item">
                <Flag code={c.code} name={c.name} />
                <span>{c.name}</span>
              </div>
            ))}
            <div className="visa-flag-item visa-flag-item--muted"><span>And others...</span></div>
          </div>

          <h3 className="visa-subheading">Required Documents</h3>
          <div className="challenge-games-grid visa-docs-grid">
            {ARRIVAL_DOCS.map((doc, i) => (
              <motion.div
                key={doc.title}
                className="why-bento-card why-bento-card--green"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="why-bento-edge" />
                <div className="why-bento-icon">{doc.icon}</div>
                <h3 className="why-bento-title">{doc.title}</h3>
                <p className="challenge-game-desc">{doc.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="challenge-story-h visa-option2">Option 2: Embassy application</h2>
            <p className="challenge-story-lead">
              If your country isn&apos;t visa-exempt or eligible on arrival, you&apos;ll need to apply in
              advance through a Tunisian embassy or consulate.
            </p>
          </motion.div>

          <div className="visa-steps">
            {EMBASSY_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                className="visa-step"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <span className="visa-step-num">{i + 1}</span>
                <div>
                  <h3 className="visa-step-title">{step.title}</h3>
                  <p className="visa-step-desc">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="visa-embassy-cta"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Flag code="tn" name="Tunisia" size={48} />
            <h3>Find Tunisian Diplomatic Missions</h3>
            <p>Locate your nearest Tunisian embassy or consulate to begin your visa application.</p>
            <a
              href="https://www.diplomatie.gov.tn/diplomatic-corps"
              target="_blank"
              rel="noopener noreferrer"
              className="visa-embassy-link"
            >
              Find Tunisian Embassies & Consulates →
            </a>
          </motion.div>
        </div>
      </section>

      {/* Important notes */}
      <section className="prog-cta visa-notes">
        <div className="prog-container-wide">
          <div className="prog-cta-inner">
            <h2 className="prog-cta-h">
              Important <span className="prog-hl">Notes</span>
            </h2>

            <div className="visa-steps visa-steps--notes">
              {IMPORTANT_NOTES.map((note, i) => (
                <div key={note.title} className="visa-step">
                  <span className="visa-step-num">{i + 1}</span>
                  <div>
                    <h3 className="visa-step-title">{note.title}</h3>
                    <p className="visa-step-desc">{note.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="prog-cta-p">
              The organizing team can&apos;t assist with individual visa applications or intervene with
              embassies on a participant&apos;s behalf. Once your registration fee is paid, an invitation
              letter will be made available to support your visa application.
            </p>
            {REGISTRATION_OPEN ? (
              <Link href="/register" className="prog-cta-btn">
                GO TO REGISTRATION
              </Link>
            ) : (
              <button
                className="prog-cta-btn"
                disabled
                title="Registration opens soon"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                REGISTRATION SOON
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}