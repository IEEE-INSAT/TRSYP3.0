'use client';

import Image from 'next/image';

const IMAGES = [
  { src: '/prev-1.jpg', alt: 'TRSYP 2.0 — 1st Place Winners' },
  { src: '/prev-2.jpg', alt: 'TRSYP 2.0 — Main Stage' },
  { src: '/prev-3.jpg', alt: 'TRSYP 2.0 — Team Members' },
];

export default function PreviousEditionSection() {
  const doubled = [...IMAGES, ...IMAGES, ...IMAGES, ...IMAGES];

  return (
    <section className="prev-edition" id="previous-edition">
      <div className="prev-edition-inner">
        <div className="prev-edition-header">
          <div className="prev-edition-eyebrow">
            <span className="prev-edition-eyebrow-line" />
            <span className="prev-edition-eyebrow-text">Look Back</span>
            <span className="prev-edition-eyebrow-line" />
          </div>
          <h2 className="prev-edition-title">Previous Edition</h2>
          <p className="prev-edition-sub">Highlights from TRSYP 2.0</p>
        </div>

        <div className="carousel-track-wrap">
          <div className="carousel-track">
            {doubled.map((img, i) => (
              <div key={i} className="carousel-slide">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={600}
                  height={400}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
