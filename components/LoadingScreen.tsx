'use client';

import { motion } from 'motion/react';
import BrandLogo from './BrandLogo';

export default function LoadingScreen({ message = 'Loading' }: { message?: string }) {
  return (
    <div className="ld-section" role="status" aria-live="polite">
      <div className="ld-bg-gradient" aria-hidden="true" />

      <div className="ld-glow-container" aria-hidden="true">
        <div className="ld-glow-top-right" />
        <div className="ld-glow-bottom-left" />
        <div className="ld-glow-center" />
      </div>

      <div className="ld-content">
        <motion.div
          className="ld-logo-wrap"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <BrandLogo className="ld-logo" title="TRSYP 3.0" />
        </motion.div>

        <div className="ld-spinner" aria-hidden="true">
          <span className="ld-spinner-dot ld-spinner-dot--green" />
          <span className="ld-spinner-dot ld-spinner-dot--pink" />
          <span className="ld-spinner-dot ld-spinner-dot--green" />
        </div>

        <motion.p
          className="ld-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
