'use client';

import Image from "next/image";
import { motion } from "motion/react";

export default function ComingSoon() {
  return (
    <section className="cs-section">
      <div className="cs-bg-gradient" aria-hidden="true" />

      {/* Glowing background blobs */}
      <div className="cs-glow-container" aria-hidden="true">
        <div className="cs-glow-top-right" />
        <div className="cs-glow-bottom-left" />
        <div className="cs-glow-center" />
      </div>

      {/* Content */}
      <div className="cs-content">
        {/* Heading */}
        <motion.h1
          className="cs-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          Coming Soon
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="cs-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Something incredible is on the horizon
        </motion.p>

        {/* Divider */}
        <motion.div 
          className="cs-divider"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <span className="cs-div-dot cs-div-dot--green" />
          <span className="cs-div-dot cs-div-dot--pink" />
          <span className="cs-div-dot cs-div-dot--green" />
        </motion.div>

        {/* Description */}
        <motion.p
          className="cs-desc"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          We're preparing to showcase the future of robotics and innovation. Stay tuned for announcements and updates.
        </motion.p>
      </div>
    </section>
  );
}
