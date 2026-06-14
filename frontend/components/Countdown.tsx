'use client';

import { useEffect, useState } from 'react';

const TARGET = new Date('2026-10-03T00:00:00');

function getTimeLeft() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function Countdown() {
  const [t, setT] = useState(getTimeLeft);
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { val: String(t.days),  label: 'Days' },
    { val: pad(t.hours),    label: 'Hrs'  },
    { val: pad(t.minutes),  label: 'Min'  },
    { val: pad(t.seconds),  label: 'Sec'  },
  ];

  return (
    <div className="cd">
      {units.map((u, i) => (
        <span key={u.label} className="cd-unit">
          <span className="cd-num">{u.val}</span>
          <span className="cd-label">{u.label}</span>
          {i < 3 && <span className="cd-sep" />}
        </span>
      ))}
    </div>
  );
}
