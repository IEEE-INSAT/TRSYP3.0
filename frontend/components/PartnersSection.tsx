import Image from 'next/image';

const PARTNERS = [
  { id: 1, src: '/partners/IEEEINSATSB.webp', label: 'IEEE INSAT Student Branch' },
  { id: 2, src: '/partners/RASINSAT.webp', label: 'RAS INSAT' },
  { id: 3, src: '/partners/tn-section.webp', label: 'IEEE Tunisia Section' },
];

export default function PartnersSection() {
  return (
    <section className="partners" id="partners">
      <div className="partners-inner">
        <div className="partners-header">
          <div className="partners-eyebrow">
            <span className="partners-eyebrow-line" />
            <span className="partners-eyebrow-text">Backed By</span>
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
                width={320}
                height={180}
                style={{ width: '70%', height: 'auto', objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
