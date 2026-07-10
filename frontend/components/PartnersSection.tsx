import Image from 'next/image';
import { getHeapCodeStatistics } from 'node:v8';

const HOSTS = [
  { id: 1, src: "/partners/RASINSAT.webp", label: "IEEE RAS INSAT Student Branch Chapter", scale: 0.7 },
  { id: 2, src: "/partners/IEEEINSATSB.webp", label: "IEEE INSAT Student Branch", scale: 0.85 },
  { id: 3, src: "/partners/ras-tunisia.svg", label: "IEEE RAS Tunisia Section", scale: 1 },
  { id: 4, src: "/partners/tn-section.webp", label: "IEEE Tunisia Section", scale: 0.7 },
  { id: 5, src: "/partners/IEEE-Region-8.png", label: "IEEE Region 8", scale: 0.75 },
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
      </div>
    </section>
  );
}
