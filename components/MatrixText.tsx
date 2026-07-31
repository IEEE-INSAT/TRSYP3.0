'use client';

import { useEffect, useState, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!?';

interface Props {
  text: string;
  className?: string;
  speed?: number;
  pauseMs?: number;
}

export default function MatrixText({ text, className, speed = 40, pauseMs = 2200 }: Props) {
  const [display, setDisplay] = useState(() =>
    text.split('').map(c => (c === ' ' || c === '\n' ? c : CHARS[Math.floor(Math.random() * CHARS.length)])).join('')
  );
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const revealedRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const scramble = (revealedCount: number) => {
      setDisplay(
        text.split('').map((c, i) => {
          if (c === ' ' || c === '\n') return c;
          if (i < revealedCount) return c;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('')
      );
    };

    const tick = () => {
      if (cancelled) return;
      revealedRef.current += 1;
      scramble(revealedRef.current);

      if (revealedRef.current < text.length) {
        timerRef.current = setTimeout(() => {
          if (!cancelled) rafRef.current = requestAnimationFrame(tick);
        }, speed);
      } else {
        // fully revealed — pause then restart
        timerRef.current = setTimeout(() => {
          if (cancelled) return;
          revealedRef.current = 0;
          scramble(0);
          timerRef.current = setTimeout(() => {
            if (!cancelled) rafRef.current = requestAnimationFrame(tick);
          }, speed);
        }, pauseMs);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, [text, speed, pauseMs]);

  return <span className={className}>{display}</span>;
}
