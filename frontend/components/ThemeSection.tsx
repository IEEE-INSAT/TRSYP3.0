import Image from 'next/image';
import MatrixText from './MatrixText';

export default function ThemeSection() {
  return (
    <section className="theme-section" id="our-theme">
      {/* Label sits ABOVE the banner */}
      <div className="theme-pre-header">
        <span className="theme-pre-line" />
        <span className="theme-label">Our Theme</span>
        <span className="theme-pre-line" />
      </div>

      {/* Banner image container */}
      <div className="theme-banner-wrap" style={{ position: 'relative' }}>
        <Image
          className="theme-banner-img theme-banner-desktop"
          src="/b.png"
          alt="Human and robot facing each other — Human-Robot Symbiosis"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority={false}
        />
        <Image
          className="theme-banner-img theme-banner-mobile"
          src="/b2.png"
          alt="Human and robot facing each other — Human-Robot Symbiosis"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority={false}
        />
        <div className="theme-overlay" />

        <div className="theme-content">
          <div className="theme-dash" />
          <h2 className="theme-title">
            <span className="theme-title-line">
              <MatrixText text="Human–Robot" />
            </span>
            <span className="theme-title-line theme-title-accent">
              <MatrixText text="Symbiosis" pauseMs={2600} />
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}
