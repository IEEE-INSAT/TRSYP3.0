import Image from 'next/image';

const HOSTS = [
  { id: 1, src: "/partners/RASINSAT.webp", label: "IEEE RAS INSAT Student Branch Chapter", scale: 0.7 },
  { id: 2, src: "/partners/IEEEINSATSB.webp", label: "IEEE INSAT Student Branch", scale: 0.85 },
  { id: 3, src: "/partners/ras-tunisia.svg", label: "IEEE RAS Tunisia Section", scale: 0.9 },
  { id: 4, src: "/partners/tn-section.webp", label: "IEEE Tunisia Section", scale: 0.7 },
  { id: 5, src: "/partners/IEEE-Region-8.webp", label: "IEEE Region 8", scale: 0.75 },
];

// Adwya uses a cleaned dark-theme variant (transparent, flat colors);
// irtsc-logo.webp is png.png cropped to the logo (the original is mostly padding);
// yp-tunisia-logo.webp is YP_Tunisia.png cropped, with its dark wordmark turned white;
// ies-logo.webp is ies.jpg with the white background removed and the navy wordmark turned white;
// atr-logo.webp, map-logo.webp and sarra-events-logo.webp (from the PDF) have their white
// background removed and dark wordmarks turned white; mad-logo.webp is mad_.jpg with its
// baked-in checkerboard background removed; alpha-motion-logo.webp is the wolf and wordmark
// cut out of the rollup3.png banner
const PARTNERS = [
  { id: 1, src: "/partners/IEEEFoundation.png", label: "IEEE Foundation", scale: 0.8 },
  { id: 2, src: "/partners/IEEEYoungProfessionals.webp", label: "IEEE Young Professionals", scale: 0.85 },
  { id: 3, src: "/partners/orange-tunisie.png", label: "Orange Tunisie", scale: 0.65 },
  { id: 4, src: "/partners/adwya-logo.webp", label: "Adwya", scale: 0.75 },
  { id: 5, src: "/partners/irtsc-logo.webp", label: "IRTSC", scale: 0.8 },
  { id: 6, src: "/partners/yp-tunisia-logo.webp", label: "IEEE Young Professionals Tunisia Section", scale: 0.8 },
  { id: 7, src: "/partners/atr-logo.webp", label: "ATR - Association des Techniques de Robotique", scale: 0.75 },
  { id: 8, src: "/partners/sarra-events-logo.webp", label: "Sarra of Congress and Events", scale: 0.7 },
  { id: 9, src: "/partners/map-logo.webp", label: "MAP", scale: 0.75 },
  { id: 10, src: "/partners/mad-logo.webp", label: "MAD", scale: 0.65 },
  { id: 11, src: "/partners/alpha-motion-logo.webp", label: "Alpha Motion", scale: 0.85 },
  { id: 12, src: "/partners/ieee-foundation-gold-seal.webp", label: "IEEE Foundation Donor Supported Program", scale: 0.8 },
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
