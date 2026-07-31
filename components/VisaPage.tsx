'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

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

/**
 * A conditional exemption, not a route of its own: these nationalities enter
 * without a visa *only* when travelling on an organized tour and holding a
 * hotel voucher. Without that, they follow whichever route their country
 * otherwise falls under — for most of this list, an embassy application.
 */
const ORGANIZED_TOUR = [
  { name: 'Azerbaijan', code: 'az' },
  { name: 'Georgia', code: 'ge' },
  { name: 'India', code: 'in' },
  { name: 'Indonesia', code: 'id' },
  { name: 'Kyrgyzstan', code: 'kg' },
  { name: 'Tajikistan', code: 'tj' },
  { name: 'Turkmenistan', code: 'tm' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'Uzbekistan', code: 'uz' },
];

/**
 * Everyone else: nationalities that appear on none of the exemption lists and
 * therefore need a visa arranged before travelling.
 *
 * The published source only enumerates the exemptions, so this list is the
 * derived complement — "not exempt" means "apply in advance". Spelling them out
 * lets the checker answer by name instead of falling back to a hedge, which is
 * the difference between an answer and a shrug for roughly half the world.
 */
const VISA_REQUIRED = [
  { name: 'Afghanistan', code: 'af' },
  { name: 'Albania', code: 'al' },
  { name: 'Armenia', code: 'am' },
  { name: 'Bahamas', code: 'bs' },
  { name: 'Bangladesh', code: 'bd' },
  { name: 'Belarus', code: 'by' },
  { name: 'Belize', code: 'bz' },
  { name: 'Bhutan', code: 'bt' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Botswana', code: 'bw' },
  { name: 'Burundi', code: 'bi' },
  { name: 'Cambodia', code: 'kh' },
  { name: 'Cameroon', code: 'cm' },
  { name: 'Central African Republic', code: 'cf' },
  { name: 'Chad', code: 'td' },
  { name: 'China', code: 'cn' },
  { name: 'Colombia', code: 'co' },
  { name: 'Cuba', code: 'cu' },
  { name: 'Democratic Republic of the Congo', code: 'cd' },
  { name: 'Djibouti', code: 'dj' },
  { name: 'Dominica', code: 'dm' },
  { name: 'Dominican Republic', code: 'do' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'Egypt', code: 'eg' },
  { name: 'El Salvador', code: 'sv' },
  { name: 'Eritrea', code: 'er' },
  { name: 'Eswatini', code: 'sz' },
  { name: 'Ethiopia', code: 'et' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Grenada', code: 'gd' },
  { name: 'Guatemala', code: 'gt' },
  { name: 'Guyana', code: 'gy' },
  { name: 'Haiti', code: 'ht' },
  { name: 'Iran', code: 'ir' },
  { name: 'Iraq', code: 'iq' },
  { name: 'Jamaica', code: 'jm' },
  { name: 'Kazakhstan', code: 'kz' },
  { name: 'Kenya', code: 'ke' },
  { name: 'Kosovo', code: 'xk' },
  { name: 'Laos', code: 'la' },
  { name: 'Lebanon', code: 'lb' },
  { name: 'Lesotho', code: 'ls' },
  { name: 'Liberia', code: 'lr' },
  { name: 'Madagascar', code: 'mg' },
  { name: 'Malawi', code: 'mw' },
  { name: 'Marshall Islands', code: 'mh' },
  { name: 'Micronesia', code: 'fm' },
  { name: 'Mongolia', code: 'mn' },
  { name: 'Mozambique', code: 'mz' },
  { name: 'Myanmar', code: 'mm' },
  { name: 'Nauru', code: 'nr' },
  { name: 'Nepal', code: 'np' },
  { name: 'Nicaragua', code: 'ni' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'North Korea', code: 'kp' },
  { name: 'Pakistan', code: 'pk' },
  { name: 'Palau', code: 'pw' },
  { name: 'Palestine', code: 'ps' },
  { name: 'Panama', code: 'pa' },
  { name: 'Papua New Guinea', code: 'pg' },
  { name: 'Paraguay', code: 'py' },
  { name: 'Peru', code: 'pe' },
  { name: 'Philippines', code: 'ph' },
  { name: 'Republic of the Congo', code: 'cg' },
  { name: 'Rwanda', code: 'rw' },
  { name: 'Saint Vincent and the Grenadines', code: 'vc' },
  { name: 'Samoa', code: 'ws' },
  { name: 'Sao Tome and Principe', code: 'st' },
  { name: 'Sierra Leone', code: 'sl' },
  { name: 'Solomon Islands', code: 'sb' },
  { name: 'Somalia', code: 'so' },
  { name: 'South Sudan', code: 'ss' },
  { name: 'Sri Lanka', code: 'lk' },
  { name: 'Sudan', code: 'sd' },
  { name: 'Suriname', code: 'sr' },
  { name: 'Syria', code: 'sy' },
  { name: 'Taiwan', code: 'tw' },
  { name: 'Tanzania', code: 'tz' },
  { name: 'Timor-Leste', code: 'tl' },
  { name: 'Togo', code: 'tg' },
  { name: 'Tonga', code: 'to' },
  { name: 'Trinidad and Tobago', code: 'tt' },
  { name: 'Tuvalu', code: 'tv' },
  { name: 'Uganda', code: 'ug' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'Vanuatu', code: 'vu' },
  { name: 'Venezuela', code: 've' },
  { name: 'Vietnam', code: 'vn' },
  { name: 'Yemen', code: 'ye' },
  { name: 'Zambia', code: 'zm' },
  { name: 'Zimbabwe', code: 'zw' },
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

/**
 * EU member states, which the visa-free list above covers only as a single
 * "All European Union citizens (except Cyprus)" line. Spelled out here so the
 * checker can actually answer someone who types "France" — searching the raw
 * list for that returns nothing, which would wrongly imply they need a visa.
 */
const EU_VISA_FREE: { name: string; code: string }[] = [
  { name: 'Austria', code: 'at' },
  { name: 'Belgium', code: 'be' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Czechia', code: 'cz' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Estonia', code: 'ee' },
  { name: 'Finland', code: 'fi' },
  { name: 'France', code: 'fr' },
  { name: 'Germany', code: 'de' },
  { name: 'Greece', code: 'gr' },
  { name: 'Hungary', code: 'hu' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Italy', code: 'it' },
  { name: 'Latvia', code: 'lv' },
  { name: 'Lithuania', code: 'lt' },
  { name: 'Luxembourg', code: 'lu' },
  { name: 'Malta', code: 'mt' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'Poland', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Romania', code: 'ro' },
  { name: 'Slovakia', code: 'sk' },
  { name: 'Slovenia', code: 'si' },
  { name: 'Spain', code: 'es' },
  { name: 'Sweden', code: 'se' },
];

/** `home` is the easter egg for Tunisians searching their own country. */
type VisaRoute = 'home' | 'visa-free' | 'on-arrival' | 'embassy';

interface CountryRule {
  name: string;
  code: string;
  /** The best route available — what the verdict badge shows. */
  route: VisaRoute;
  /** Why this country is visa-free when the published list only says "EU". */
  basis?: string;
  /** Overrides the default 90-day stay when the country has its own allowance. */
  stay?: string;
  /**
   * Also named on the visa-on-arrival list. Malaysia and Singapore appear on
   * both lists, and showing only the better one made the checker contradict the
   * Route 02 section further down the page.
   */
  alsoOnArrival?: boolean;
  /** Enters visa-free when on an organized tour holding a hotel voucher. */
  organizedTour?: boolean;
}

const ROUTE_RANK: Record<VisaRoute, number> = {
  home: -1,
  'visa-free': 0,
  'on-arrival': 1,
  embassy: 2,
};

const ROUTE_COPY: Record<VisaRoute, { label: string; detail: string }> = {
  home: {
    // Real characters, not HTML entities: these strings are interpolated into
    // JSX, where React escapes them and "&rsquo;" would render literally.
    label: 'You’re already home',
    detail: 'No visa, no paperwork, no flight. Just show up in Yasmine Hammamet and we’ll see you there.',
  },
  'visa-free': {
    label: 'No visa needed',
    detail: 'You can enter Tunisia without applying in advance.',
  },
  'on-arrival': {
    label: 'Visa on arrival',
    detail: 'You can be issued a visa at the border. Confirm eligibility with your airline or the embassy before you fly.',
  },
  embassy: {
    label: 'Apply in advance',
    detail: 'You will need to apply at a Tunisian embassy or consulate before travelling.',
  },
};

/**
 * One lookup table merged from the three published lists, carrying every fact
 * about a country rather than a single winning verdict — the checker is meant
 * to be the whole answer, so nobody has to scroll and cross-reference.
 */
const COUNTRY_RULES: CountryRule[] = (() => {
  const byName = new Map<string, CountryRule>();

  const add = (rule: CountryRule) => {
    const key = rule.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, rule);
      return;
    }
    // Keep the better route, but never lose a fact from the weaker one.
    const better = ROUTE_RANK[rule.route] < ROUTE_RANK[existing.route] ? rule : existing;
    byName.set(key, {
      ...existing,
      ...rule,
      route: better.route,
      basis: existing.basis ?? rule.basis,
      alsoOnArrival:
        existing.alsoOnArrival ||
        rule.alsoOnArrival ||
        rule.route === 'on-arrival' ||
        existing.route === 'on-arrival',
      organizedTour: existing.organizedTour || rule.organizedTour,
    });
  };

  EU_VISA_FREE.forEach((c) => add({ ...c, route: 'visa-free', basis: 'As an EU citizen' }));
  // The 'eu' entry is the umbrella line, already expanded above.
  VISA_FREE_COUNTRIES.filter((c) => c.code !== 'eu').forEach((c) => add({ ...c, route: 'visa-free' }));
  ARRIVAL_ELIGIBLE.forEach((c) => add({ ...c, route: 'on-arrival' }));
  // Conditional, so it never sets the route on its own — it only ever adds the
  // organized-tour exemption on top of whatever route already applies.
  ORGANIZED_TOUR.forEach((c) => add({ ...c, route: 'embassy', organizedTour: true }));
  VISA_REQUIRED.forEach((c) => add({ ...c, route: 'embassy' }));
  // Explicit, because the umbrella line carves it out.
  add({ name: 'Cyprus', code: 'cy', route: 'embassy', basis: 'The EU exemption does not cover Cyprus' });
  add({ name: 'Tunisia', code: 'tn', route: 'home' });

  const extended = new Map(EXTENDED_STAYS.map((s) => [s.country, s.duration]));
  return [...byName.values()].map((rule) =>
    extended.has(rule.name) ? { ...rule, stay: extended.get(rule.name) } : rule,
  );
})();

/** Wording differs by route: an on-arrival traveller does get a visa. */
const DEFAULT_STAY: Record<Exclude<VisaRoute, 'embassy' | 'home'>, string> = {
  'visa-free': 'Up to 90 days, no visa needed',
  'on-arrival': 'Typically up to 90 days',
};

/**
 * Turns the reference lists into an answer. The page's real question is "do I
 * need a visa?", which previously meant hand-scanning seventy country names.
 */
function VisaChecker() {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const matches = useMemo(() => {
    if (trimmed.length < 2) return [];
    const q = trimmed.toLowerCase();
    return COUNTRY_RULES.filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [trimmed]);

  const searched = trimmed.length >= 2;

  return (
    <div className="visa-checker">
      <label className="visa-checker-label" htmlFor="visa-country">
        Where is your passport from?
      </label>
      <div className="visa-checker-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id="visa-country"
          type="text"
          className="visa-checker-input"
          placeholder="Type a country — France, Japan, Nigeria…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="country-name"
        />
        {query && (
          <button type="button" className="visa-checker-clear" onClick={() => setQuery('')} aria-label="Clear">
            &times;
          </button>
        )}
      </div>

      <div className="visa-checker-results" aria-live="polite">
        {/* Every nationality is now listed, so reaching this means the name
            wasn't recognised — a spelling or naming difference, not a verdict. */}
        {searched && matches.length === 0 && (
          <div className="visa-result visa-result--unknown">
            <div className="visa-result-head">
              <strong>No match for “{trimmed}”</strong>
            </div>
            <p>
              Try a different spelling or the country&apos;s official name — some are listed differently
              (Czechia, Eswatini, Timor-Leste). If you still can&apos;t find it, assume you need to apply in
              advance and confirm with your nearest Tunisian mission.
            </p>
          </div>
        )}

        {matches.map((match) => {
          // Only routes that actually issue a visa need paperwork. A visa-free
          // traveller who is *also* on-arrival eligible must not be told to
          // bring visa documents they will never be asked for.
          const isHome = match.route === 'home';
          const needsDocs = !isHome && match.route !== 'visa-free';

          return (
            <div key={match.name} className={`visa-result visa-result--${match.route}`}>
              <div className="visa-result-head">
                <Flag code={match.code} name={match.name} />
                <strong>{match.name}</strong>
                <span className="visa-result-badge">{ROUTE_COPY[match.route].label}</span>
              </div>

              <p>
                {ROUTE_COPY[match.route].detail}
                {match.basis ? ` ${match.basis}.` : ''}
              </p>

              {/* The joke lands better on its own — no stay limits, no
                  paperwork, nothing to cross-reference. */}
              <dl className="visa-result-facts">
                {/* Inline checks rather than `!isHome`: the compiler narrows
                    `match.route` from these, not from a boolean alias. */}
                {match.route !== 'embassy' && match.route !== 'home' && (
                  <div>
                    <dt>How long</dt>
                    <dd>{match.stay ?? DEFAULT_STAY[match.route]}</dd>
                  </div>
                )}
                {match.alsoOnArrival && match.route === 'visa-free' && (
                  <div>
                    <dt>Also listed</dt>
                    <dd>Eligible for a visa on arrival too.</dd>
                  </div>
                )}
                {match.route === 'embassy' && (
                  <div>
                    <dt>Where</dt>
                    <dd>
                      <a
                        href="https://www.diplomatie.gov.tn/diplomatic-corps"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Find your nearest Tunisian mission →
                      </a>
                    </dd>
                  </div>
                )}
              </dl>


              {needsDocs && (
                <div className="visa-result-docs">
                  <span className="visa-result-docs-label">
                    {match.route === 'embassy' ? 'How to apply' : 'Bring with you'}
                  </span>
                  {/* Full detail, because the reference sections that used to
                      carry it are gone — this card is the whole answer now. */}
                  <ul>
                    {(match.route === 'embassy' ? EMBASSY_STEPS : ARRIVAL_DOCS).map((item, n) => (
                      <li key={item.title}>
                        {match.route === 'embassy' && <span className="visa-result-step">{n + 1}</span>}
                        <span>
                          <strong>{item.title}</strong>
                          <em>{item.desc}</em>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* The country-specific route. For most of this list it is the
                  only way in without an embassy visa, so it is called out
                  rather than buried in the paperwork below. */}
              {match.organizedTour && (
                <div className="visa-result-exception">
                  <span className="visa-result-exception-label">Alternative route</span>
                  <p>
                    Travelling on an <strong>organized tour with a hotel voucher</strong>? You can enter
                    Tunisia without a visa
                    {match.route === 'embassy' ? ' — no embassy application needed.' : '.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="visa-note visa-checker-note">
        Guidance only. Visa rules change — always confirm with the Tunisian embassy or consulate for your
        country before booking.
      </p>
    </div>
  );
}

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
            <h2 className="challenge-story-h">
              It depends on <span className="prog-hl">your nationality</span>.
            </h2>
            <p className="challenge-story-lead">
              Tunisia&apos;s visa policy isn&apos;t the same for everyone. Citizens of many countries can enter
              and stay for up to 90 days without a visa, while others must apply at a Tunisian embassy or
              consulate before arrival.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <VisaChecker />
          </motion.div>

        </div>
      </section>

      {/* Important notes */}
      <section className="prog-cta visa-notes">
        <div className="prog-container">
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
            <a
              href="https://www.diplomatie.gov.tn/diplomatic-corps"
              target="_blank"
              rel="noopener noreferrer"
              className="prog-cta-btn"
            >
              Find Tunisian Embassies &amp; Consulates →
            </a>
            
          </div>
        </div>
      </section>
    </div>
  );
}