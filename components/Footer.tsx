import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { SITE_LINKS } from '@/lib/navigation';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link className="footer-logo-link" href="/" aria-label="TRSYP 3.0 home">
          <BrandLogo className="footer-logo" />
        </Link>

        <p className="footer-brand-sub">
          IEEE Tunisian RAS Student &amp; Young Professional Congress
        </p>

        <nav className="footer-nav" aria-label="Footer navigation">
          {SITE_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="footer-socials">
          <a href="https://www.facebook.com/profile.php?id=61563766478734" target="_blank" rel="noopener noreferrer" className="footer-social" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
          </a>
          <a href="https://www.instagram.com/ieee_trsyp/" target="_blank" rel="noopener noreferrer" className="footer-social" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>
          </a>
          <a href="https://www.linkedin.com/company/ieee-tunisian-ras-student-and-young-professional-congress-2-0/" target="_blank" rel="noopener noreferrer" className="footer-social" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>
          </a>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} TRSYP 3.0. All rights reserved.
        </p>

        <div className="footer-flourish" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </footer>
  );
}
