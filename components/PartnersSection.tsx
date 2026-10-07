import Image from 'next/image';

const HOSTS = [
  { id: 1, src: "/partners/RASINSAT.webp", label: "IEEE RAS INSAT Student Branch Chapter", scale: 0.7 },
  { id: 2, src: "/partners/IEEEINSATSB.webp", label: "IEEE INSAT Student Branch", scale: 0.85 },
  { id: 3, src: "/partners/ras-tunisia.svg", label: "IEEE RAS Tunisia Section", scale: 0.9 },
  { id: 4, src: "/partners/tn-section.webp", label: "IEEE Tunisia Section", scale: 0.7 },
  { id: 5, src: "/partners/IEEE-Region-8.png", label: "IEEE Region 8", scale: 0.75 },
];

// Adwya uses a cleaned dark-theme variant (transparent, flat colors);
// irtsc-logo.png is png.png cropped to the logo (the original is mostly padding)
const PARTNERS = [
  { id: 1, src: "/partners/IEEEFoundation.png", label: "IEEE Foundation", scale: 0.8 },
  { id: 2, src: "/partners/IEEEYoungProfessionals.png", label: "IEEE Young Professionals", scale: 0.85 },
  { id: 3, src: "/partners/orange-tunisie.png", label: "Orange Tunisie", scale: 0.65 },
  { id: 4, src: "/partners/adwya-logo.png", label: "Adwya", scale: 0.75 },
  { id: 5, src: "/partners/irtsc-logo.png", label: "IRTSC", scale: 0.8 },
];

export default function PartnersSection() {
  return (
    <section className="partners" id="partners">
      <div className="partners-inner">
        <div className="partners-header">
          <div className="partners-eyebrow">
            <span className="partners-eyebrow-line" />
            <span className="partners-eyebrow-text">Organized By</span>
            <span className="partners-eyebrow-line" />
          </div>
          <h2 className="partners-title">Our Hosts</h2>
        </div>

        <div className="partners-grid">
          {HOSTS.map((p) => (
            <div key={p.id} className="partners-slot">
              <Image
                src={p.src}
                alt={p.label}
                fill
                style={{ objectFit: "contain", transform: `scale(${p.scale})` }}
              />
            </div>
          ))}
        </div>

        <div className="partners-header partners-header--sub">
          <div className="partners-eyebrow">
            <span className="partners-eyebrow-line" />
            <span className="partners-eyebrow-text">Supported By</span>
            <span className="partners-eyebrow-line" />
          </div>
          <h2 className="partners-title">Our Partners</h2>
        </div>

        <div className="partners-grid">
          {PARTNERS.map((p) => (
            <div key={p.id} className="partners-slot">
              <Image
                src={p.src}
                alt={p.label}
                fill
                style={{ objectFit: "contain", transform: `scale(${p.scale})` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
