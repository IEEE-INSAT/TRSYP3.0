import Image from 'next/image';

const PARTNER_SLOTS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  label: `Partner ${i + 1}`,
}));

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
          {PARTNER_SLOTS.map((p) => (
            <div key={p.id} className="partners-slot">
              <Image
                src="/tn-section.webp"
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
