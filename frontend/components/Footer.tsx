import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" aria-hidden="true" />

      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Image
              src="/trsyp-logo.png"
              alt="TRSYP 3.0"
              width={600}
              height={204}
              style={{ height: '160px', width: 'auto', objectFit: 'contain' }}
              loading="eager"
            />
            <p className="footer-brand-sub">
              IEEE Tunisian RAS Student &amp; Young Professional Congress
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4 className="footer-col-title">Navigate</h4>
              <a href="/" className="footer-link">Home</a>
              <a href="/program" className="footer-link">Program</a>
              <a href="/challenge" className="footer-link">Challenge</a>
              <a href="/venue" className="footer-link">Venue</a>
              <a href="/about" className="footer-link">About Us</a>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">Event</h4>
              <a href="/program" className="footer-link">Schedule</a>
              <a href="/venue" className="footer-link">Location</a>
              <a href="/challenge" className="footer-link">Competitions</a>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">Connect</h4>
              <a href="#" className="footer-link">Contact Us</a>
              <a href="#" className="footer-link">IEEE INSAT SB</a>
              <a href="#" className="footer-link">IEEE RAS Tunisia</a>
            </div>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; 2026 TRSYP 3.0
          </p>
          <p className="footer-date">
            October 17&ndash;18, 2026 &mdash; Hammamet, Tunisia
          </p>
          <div className="footer-socials">
            <a href="#" className="footer-social" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="#" className="footer-social" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="#" className="footer-social" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
