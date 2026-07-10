'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const TUNISIA_PLACES = [
  { name: 'Sidi Bou Said', desc: 'Iconic blue & white clifftop village' },
  { name: 'Carthage Ruins', desc: 'Ancient UNESCO World Heritage site' },
  { name: 'Medina of Tunis', desc: 'Historic old city, vibrant souks' },
  { name: 'Djerba Island', desc: 'Mediterranean island paradise' },
  { name: 'Sahara Desert', desc: 'Endless dunes, starlit nights' },
  { name: 'El Jem Amphitheatre', desc: 'Roman colosseum, remarkably preserved' },
  { name: 'Yasmine Hammamet', desc: 'Coastal resort town, golden beaches' },
  { name: 'Douz', desc: 'Gateway to the Sahara' },
];

const RATES: Record<string, number> = {
  USD: 3.12, EUR: 3.42, GBP: 3.95, CAD: 2.30, AUD: 2.05,
  JPY: 0.021, CNY: 0.43, INR: 0.037, MAD: 0.31, EGP: 0.064,
  SAR: 0.83, AED: 0.85, KWD: 10.18, QAR: 0.86, TRY: 0.096,
  BRL: 0.61, KRW: 0.0023, CHF: 3.58, SEK: 0.30, DKK: 0.46,
};

function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('USD');
  const [result, setResult] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const rate = RATES[currency] || 1;
    const val = parseFloat(amount) || 0;
    setResult(val * rate);
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 600);
    return () => clearTimeout(t);
  }, [amount, currency]);

  return (
    <div className="converter">
      <div className="converter-robot">
        <div className="converter-robot-head">
          <div className="converter-robot-eye left" />
          <div className="converter-robot-eye right" />
          <div className={`converter-robot-mouth ${typing ? 'is-talking' : ''}`} />
        </div>
        <div className="converter-robot-body">
          <div className="converter-robot-screen">
            <span className="converter-robot-screen-label">PROCESSING</span>
            <div className={`converter-robot-bars ${typing ? 'is-active' : ''}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
          </div>
        </div>
        <div className="converter-robot-arms">
          <span className="converter-robot-arm left" />
          <span className="converter-robot-arm right" />
        </div>
      </div>

      <div className="converter-panel">
        <div className="converter-speech">
          <p>
            {typing
              ? 'Computing exchange rate...'
              : `${parseFloat(amount) || 0} ${currency} = ${result.toFixed(2)} TND`}
          </p>
        </div>

        <div className="converter-inputs">
          <div className="converter-field">
            <label className="converter-label">Amount</label>
            <input
              type="number"
              className="converter-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
            />
          </div>
          <div className="converter-field">
            <label className="converter-label">Currency</label>
            <select
              className="converter-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {Object.keys(RATES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="converter-result">
          <span className="converter-result-label">Tunisian Dinar (TND)</span>
          <span className="converter-result-value">{result.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function VenuePage() {
  return (
    <div className="venue-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <div className="prog-eyebrow">
            <span className="prog-eyebrow-line" />
            <span className="prog-eyebrow-text">Location & Travel</span>
            <span className="prog-eyebrow-line" />
          </div>
          <h1 className="prog-hero-h">VENUE</h1>
        </div>
      </section>

      {/* Section 1: Where */}
      <section className="venue-where">
        <div className="prog-container">
          <div className="venue-where-header">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Where It Happens</span>
            </div>
            <h2 className="venue-section-title">The Venue</h2>
          </div>

          <motion.div
            className="venue-hotel-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="venue-hotel-img">
              <Image
                src="/Le Royal.webp"
                alt="TRSYP 3.0 Host Venue"
                width={800}
                height={500}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px 0 0 20px' }}
              />
            </div>
            <div className="venue-hotel-info">
              <span className="venue-hotel-badge">TRSYP 3.0 HOST VENUE</span>
              <h3 className="venue-hotel-name">Le Royal, Yasmine Hammamet</h3>
              <p className="venue-hotel-desc">
                Le Royal Yasmine Hammamet is a prestigious 5-star hotel located directly on the beautiful Yasmine Hammamet beach. It features luxurious rooms with panoramic Mediterranean views, multiple refined dining options, four outdoor pools, a modern spa, and fully equipped conference centers to perfectly host our event.
              </p>
              <div className="venue-hotel-details">
                <div className="venue-detail">
                  <span className="venue-detail-label">Date</span>
                  <b>17–18 October 2026</b>
                </div>
                <div className="venue-detail">
                  <span className="venue-detail-label">Location</span>
                  <b>Yasmine Hammamet, Tunisia</b>
                </div>
                <div className="venue-detail">
                  <span className="venue-detail-label">Capacity</span>
                  <b>350+ Seats</b>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Discover Tunisia */}
      <section className="venue-tunisia">
        <div className="prog-container">
          <div className="venue-tunisia-header">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Discover Tunisia</span>
            </div>
            <h2 className="venue-section-title">Beyond the Conference</h2>
            <p className="venue-tunisia-sub">
              Tunisia sits at the crossroads of Africa and Europe; ancient ruins, Mediterranean
              coastline, Saharan dunes, and vibrant culture, all within a few hours of Tunis.
            </p>
          </div>

          {/* Map card */}
          <motion.div
            className="venue-map-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="venue-map-embed">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d204480.3573498658!2d10.0653!3d36.8065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd337f5e7ef543%3A0xd671924e714a0275!2sTunis%2C%20Tunisia!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '20px 0 0 20px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tunisia Map"
              />
            </div>
            <div className="venue-map-info">
              <h3>Tunisia at a Glance</h3>
              <div className="venue-map-stats">
                <div><b>12M</b><span>Population</span></div>
                <div><b>1,300 km</b><span>Coastline</span></div>
                <div><b>8</b><span>UNESCO Sites</span></div>
                <div><b>GMT+1</b><span>Timezone</span></div>
              </div>
            </div>
          </motion.div>

          {/* Places carousel */}
          <div className="venue-places-wrap">
            <div className="venue-places-track">
              {[...TUNISIA_PLACES, ...TUNISIA_PLACES].map((p, i) => (
                <div key={i} className="venue-place-card">
                  <div className="venue-place-img">
                    <Image
                      src="/aaa.jpg"
                      alt={p.name}
                      width={400}
                      height={260}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                    />
                  </div>
                  <h4>{p.name}</h4>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Currency Converter */}
      <section className="venue-currency">
        <div className="prog-container">
          <div className="venue-currency-header">
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">Currency Exchange</span>
            </div>
            <h2 className="venue-section-title">Money Converter</h2>
            <p className="venue-currency-sub">
              Let our robotic assistant help you convert your currency to Tunisian Dinar before your trip.
            </p>
          </div>
          <CurrencyConverter />
        </div>
      </section>
    </div>
  );
}
