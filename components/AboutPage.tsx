'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

type Member = { name: string; role: string; image: string; email?: string };

// Leaders first, then managers, within each department.
const DEPARTMENTS: { name: string; short: string; code: string; members: Member[] }[] = [
  {
    name: 'Executive Committee',
    short: 'Executive',
    code: 'EX',
    members: [
      { name: 'Rayhane Sahli', role: 'Congress Chair', email: 'rayhanesahli@ieee.org', image: '/team/rayhane-sahli.webp' },
      { name: 'Yassine Kolsi', role: 'Vice-Chair', email: 'yassine.kolsi@ieee.org', image: '/team/yassine-kolsi.webp' },
      { name: 'Yassine Boudagga', role: 'Vice-Chair', email: 'boudegga91@gmail.com', image: '/team/yassine-boudagga.webp' },
      { name: 'Mariem Jomaa', role: 'Secretary', email: 'mariem.education.jomaa@gmail.com', image: '/team/mariem-jomaa.webp' },
      { name: 'Yasmin Loukil', role: 'Secretary', email: 'itsyasminlouki@gmail.com', image: '/team/yasmin-loukil.webp' },
      { name: 'Ayette Betbout', role: 'Treasurer', email: 'ayetbetbout@gmail.com', image: '/team/ayette-betbout.webp' },
    ],
  },
  {
    name: 'Technical Department',
    short: 'Technical',
    code: 'TK',
    members: [
      { name: 'Skander Loghmari', role: 'Technical Team Leader', email: 'loghmariskander@gmail.com', image: '/team/skander-loghmari.webp' },
      { name: 'Ghoafrane Faidi', role: 'Technical Manager', image: '/team/ghoafrane-faidi.webp' },
      { name: 'Ilyes Arfa', role: 'Technical Manager', image: '/team/ilyes-arfa.webp' },
      { name: 'Meriem Besbes', role: 'Technical Manager', image: '/team/meriem-besbes.webp' },
      { name: 'Mohamed Nour Ben Ali', role: 'Technical Manager', image: '/team/mohamed-nour-ben-ali.webp' },
    ],
  },
  {
    name: 'Organization Department',
    short: 'Organization',
    code: 'OR',
    members: [
      { name: 'Nermine Moumen', role: 'Organization Team Leader', email: 'nermine.moumen@gmail.com', image: '/team/nermine-moumen.webp' },
      { name: 'Ayoub Boulifa', role: 'Organization Manager', image: '/team/ayoub-boulifa.webp' },
      { name: 'Eya Touati', role: 'Organization Manager', image: '/team/eya-touati.webp' },
      { name: 'Ismail Koubaa', role: 'Organization Manager', image: '/team/ismail-koubaa.webp' },
      { name: 'Kenza Hadj Sassi', role: 'Organization Manager', image: '/team/kenza-hadj-sassi.webp' },
      { name: 'Mariem Maatoug', role: 'Organization Manager', image: '/team/mariem-maatoug.webp' },
    ],
  },
  {
    name: 'Sponsorship Department',
    short: 'Sponsorship',
    code: 'SP',
    members: [
      { name: 'Khalil Khadhraoui', role: 'Sponsorship Team Leader', email: 'Khalil.kkhadraoui@gmail.com', image: '/team/khalil-khadhraoui.webp' },
      { name: 'Dalila Zaiter', role: 'Sponsorship Manager', image: '/team/dalila-zaiter.webp' },
      { name: 'Ghayth Abidli', role: 'Sponsorship Manager', image: '/team/ghayth-abidli.webp' },
      { name: 'Moemen Bejaoui', role: 'Sponsorship Manager', image: '/team/moemen-bejaoui.webp' },
      { name: 'Ranim Dhiflaoui', role: 'Sponsorship Manager', image: '/team/ranim-dhiflaoui.webp' },
    ],
  },
  {
    name: 'Media Department',
    short: 'Media',
    code: 'MD',
    members: [
      { name: 'Wyssem Neila', role: 'Media Team Leader', email: 'wyssemneila@ieee.org', image: '/team/wyssem-neila.webp' },
      { name: 'Sarah Sdiri', role: 'Media Manager', image: '/team/sarah-sdiri.webp' },
      { name: 'Youssef Akermi', role: 'Media Manager', image: '/team/youssef-akermi.webp' },
    ],
  },
  {
    name: 'IT Department',
    short: 'IT',
    code: 'IT',
    members: [
      { name: 'Mohamed Amine Achour', role: 'IT Team Leader', email: 'mohamedamineachour5@gmail.com', image: '/team/mohamed-amine-achour.webp' },
    ],
  },
  {
    name: 'External Relations & Administrative Affairs',
    short: 'External Relations',
    code: 'ER',
    members: [
      { name: 'Amine Dammak', role: 'External Relations Manager', image: '/team/amine-dammak.webp' },
      { name: 'Hene Nayet Yahia', role: 'External Relations & Administrative Affairs Manager', image: '/team/hene-nayet-yahia.webp' },
      { name: 'Jihen Somai', role: 'External Relations & Administrative Affairs Manager', image: '/team/jihen-somai.webp' },
      { name: 'Nour Asfour', role: 'External Relations & Administrative Affairs Manager', image: '/team/nour-asfour.webp' },
      { name: 'Ranim Dhaouadi', role: 'YP & VIP Manager', image: '/team/ranim-dhaouadi.webp' },
      { name: 'Youssef Rekik', role: 'Ambassador Coordinator', image: '/team/youssef-rekik.webp' },
    ],
  },
];

const TEAM = DEPARTMENTS.map((dept) => ({
  ...dept,
  members: dept.members.map((m, i) => ({
    ...m,
    department: dept.short,
    unit: `${dept.code}-${String(i + 1).padStart(3, '0')}`,
  })),
}));

const BARCODE_WIDTHS = Array.from(
  { length: 24 },
  (_, index) => (index * 7) % 11 < 5 ? '3px' : '1.5px',
);

function IdCard({ member, index }: { member: Member & { unit: string; department: string }; index: number }) {
  return (
    <motion.div
      className="id-card-wrap"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <div className="id-card">
        {/* Front */}
        <div className="id-card-front">
          <div className="id-card-header">
            <div className="id-card-header-left">
              <span className="id-card-org">IEEE RAS</span>
              <span className="id-card-badge">TRSYP 3.0</span>
            </div>
            <div className="id-card-unit">{member.unit}</div>
          </div>

          <div className="id-card-avatar">
            <div className="id-card-avatar-ring">
              <div className="id-card-avatar-inner">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={600}
                  height={600}
                  unoptimized
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
            </div>
            <div className="id-card-scanline" />
          </div>

          <div className="id-card-info">
            <h3 className="id-card-name">{member.name}</h3>
            <span className="id-card-role">{member.role}</span>
            <span className="id-card-dept">{member.department} Dept.</span>
          </div>

          <div className="id-card-footer">
            <div className="id-card-barcode">
              {BARCODE_WIDTHS.map((width, i) => (
                <span key={i} style={{ width }} />
              ))}
            </div>
            <span className="id-card-flip-hint">TAP TO FLIP</span>
          </div>

          <div className="id-card-circuit" aria-hidden="true">
            <svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 50h30l10 10v40l-10 10H0" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
              <path d="M200 80h-20l-8 8v30" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
              <circle cx="30" cy="100" r="2" fill="currentColor" opacity="0.1" />
              <circle cx="172" cy="118" r="2" fill="currentColor" opacity="0.1" />
              <path d="M0 200h15l5-5h20l5 5v30" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
              <path d="M200 250h-40l-10-10v-20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
            </svg>
          </div>
        </div>

        {/* Back */}
        <div className="id-card-back">
          <div className="id-card-header">
            <span className="id-card-org">CLEARANCE</span>
            <span className="id-card-badge">LEVEL 3</span>
          </div>

          <div className="id-card-back-content">
            <div className="id-card-back-row">
              <span className="id-card-back-label">UNIT ID</span>
              <span className="id-card-back-value">{member.unit}</span>
            </div>
            <div className="id-card-back-row">
              <span className="id-card-back-label">DESIGNATION</span>
              <span className="id-card-back-value">{member.role}</span>
            </div>
            <div className="id-card-back-row">
              <span className="id-card-back-label">DEPARTMENT</span>
              <span className="id-card-back-value">{member.department}</span>
            </div>
            {member.email && (
              <div className="id-card-back-row">
                <span className="id-card-back-label">COMMS</span>
                <span className="id-card-back-value id-card-back-email">{member.email}</span>
              </div>
            )}
            <div className="id-card-back-row">
              <span className="id-card-back-label">STATUS</span>
              <span className="id-card-back-value">
                <span className="id-card-status-dot" />
                ACTIVE
              </span>
            </div>
            <div className="id-card-back-row">
              <span className="id-card-back-label">EVENT</span>
              <span className="id-card-back-value">TRSYP 3.0 - OCT 2026</span>
            </div>
          </div>

          <div className="id-card-footer">
            <div className="id-card-barcode">
              {BARCODE_WIDTHS.map((width, i) => (
                <span key={i} style={{ width }} />
              ))}
            </div>
            <span className="id-card-flip-hint">TAP TO FLIP BACK</span>
          </div>

          <div className="id-card-circuit" aria-hidden="true">
            <svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 50h30l10 10v40l-10 10H0" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
              <path d="M200 80h-20l-8 8v30" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div className="about-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <div className="prog-eyebrow">
            <span className="prog-eyebrow-line" />
            <span className="prog-eyebrow-text">The People Behind the Machines</span>
            <span className="prog-eyebrow-line" />
          </div>
          <h1 className="prog-hero-h">ABOUT US</h1>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="team-section">
        <div className="prog-container">
          <div className="team-header">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Crew Manifest</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h2 className="team-title">Meet the Team</h2>
            <p className="team-sub">
              The operators, architects, and engineers making TRSYP 3.0 happen.
              Each card is a unit ID. Tap to reveal clearance details.
            </p>
          </div>

          {TEAM.map((dept) => (
            <div key={dept.code} className="team-dept">
              <h3 className="team-dept-title">{dept.name}</h3>
              <div className="team-grid">
                {dept.members.map((m, i) => (
                  <IdCard key={m.unit} member={m} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
