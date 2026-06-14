'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const DOTS = [
  { x: '5%',  y: '8%',  size: 3, color: 'rgba(0,232,122,0.5)',  dur: 14, dx: 30,  dy: -20 },
  { x: '12%', y: '25%', size: 2, color: 'rgba(255,29,120,0.4)', dur: 18, dx: -15, dy: 25 },
  { x: '20%', y: '55%', size: 2.5, color: 'rgba(0,232,122,0.35)', dur: 22, dx: 20, dy: -35 },
  { x: '8%',  y: '75%', size: 1.5, color: 'rgba(255,29,120,0.3)', dur: 16, dx: -25, dy: 15 },
  { x: '15%', y: '90%', size: 2, color: 'rgba(0,232,122,0.3)',  dur: 20, dx: 18,  dy: -22 },
  { x: '30%', y: '12%', size: 2, color: 'rgba(255,29,120,0.35)', dur: 19, dx: -12, dy: 30 },
  { x: '35%', y: '40%', size: 3, color: 'rgba(0,232,122,0.4)',  dur: 15, dx: 22,  dy: -18 },
  { x: '28%', y: '65%', size: 1.5, color: 'rgba(255,29,120,0.3)', dur: 21, dx: -20, dy: 28 },
  { x: '40%', y: '85%', size: 2.5, color: 'rgba(0,232,122,0.35)', dur: 17, dx: 15, dy: -25 },
  { x: '50%', y: '5%',  size: 2, color: 'rgba(255,29,120,0.4)', dur: 23, dx: -18, dy: 20 },
  { x: '55%', y: '30%', size: 1.5, color: 'rgba(0,232,122,0.3)', dur: 16, dx: 25, dy: -15 },
  { x: '48%', y: '50%', size: 3, color: 'rgba(255,29,120,0.35)', dur: 20, dx: -22, dy: 32 },
  { x: '60%', y: '70%', size: 2, color: 'rgba(0,232,122,0.4)',  dur: 18, dx: 12,  dy: -28 },
  { x: '52%', y: '92%', size: 2.5, color: 'rgba(255,29,120,0.3)', dur: 14, dx: -15, dy: 18 },
  { x: '70%', y: '15%', size: 2, color: 'rgba(0,232,122,0.35)', dur: 21, dx: 20,  dy: -22 },
  { x: '75%', y: '38%', size: 1.5, color: 'rgba(255,29,120,0.4)', dur: 17, dx: -28, dy: 15 },
  { x: '68%', y: '60%', size: 3, color: 'rgba(0,232,122,0.3)',  dur: 19, dx: 18,  dy: -30 },
  { x: '80%', y: '80%', size: 2, color: 'rgba(255,29,120,0.35)', dur: 22, dx: -12, dy: 22 },
  { x: '88%', y: '10%', size: 2.5, color: 'rgba(0,232,122,0.4)', dur: 15, dx: -20, dy: 25 },
  { x: '92%', y: '45%', size: 2, color: 'rgba(255,29,120,0.3)', dur: 20, dx: 15,  dy: -18 },
];

export const GridBeam: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('gridbeam-wrap', className)}>
    <div className="gridbeam-grid" aria-hidden="true" />
    {DOTS.map((d, i) => (
      <motion.span
        key={i}
        className="gridbeam-dot"
        style={{ left: d.x, top: d.y, width: d.size, height: d.size, background: d.color }}
        animate={{ x: [0, d.dx, 0], y: [0, d.dy, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: d.dur, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
    ))}
    <Beam style={{ left: '15%', top: '12%' }} delay={0} />
    <Beam style={{ left: '55%', top: '35%' }} delay={2.5} />
    <Beam style={{ left: '80%', top: '60%' }} delay={5} />
    <Beam style={{ left: '30%', top: '75%' }} delay={7.5} />
    <Beam style={{ left: '42%', top: '8%' }} delay={1} />
    <Beam style={{ left: '68%', top: '22%' }} delay={3.5} />
    <Beam style={{ left: '10%', top: '45%' }} delay={6} />
    <Beam style={{ left: '90%', top: '40%' }} delay={8.5} />
    <Beam style={{ left: '22%', top: '55%' }} delay={1.5} />
    <Beam style={{ left: '75%', top: '80%' }} delay={4} />
    <Beam style={{ left: '48%', top: '68%' }} delay={6.5} />
    <Beam style={{ left: '5%', top: '88%' }} delay={9} />
    <Beam style={{ left: '62%', top: '5%' }} delay={0.5} />
    <Beam style={{ left: '35%', top: '28%' }} delay={3} />
    <Beam style={{ left: '85%', top: '18%' }} delay={5.5} />
    <Beam style={{ left: '50%', top: '50%' }} delay={8} />
    {children}
  </div>
);

function Beam({ style, delay = 0 }: { style?: React.CSSProperties; delay?: number }) {
  return (
    <svg
      width="156"
      height="63"
      viewBox="0 0 156 63"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="gridbeam-svg"
      style={style}
    >
      <path
        d="M31 .5h32M0 .5h32m30 31h32m-1 0h32m-1 31h32M62.5 32V0m62 63V31"
        stroke="url(#beam-grad)"
        strokeWidth={1.5}
      />
      <defs>
        <motion.linearGradient
          id="beam-grad"
          variants={{
            initial: { x1: '40%', x2: '50%', y1: '160%', y2: '180%' },
            animate: { x1: '0%', x2: '10%', y1: '-40%', y2: '-20%' },
          }}
          animate="animate"
          initial="initial"
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
            repeatDelay: 2,
            delay,
          }}
        >
          <stop stopColor="#00E87A" stopOpacity="0" />
          <stop stopColor="#00E87A" />
          <stop offset="0.325" stopColor="#FF1D78" />
          <stop offset="1" stopColor="#FF1D78" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}

export default GridBeam;
