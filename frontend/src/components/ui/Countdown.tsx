"use client";

import { useEffect, useState } from "react";

function getCountdown() {
  const eventDate = new Date("2026-10-03T00:00:00");
  const now = new Date();
  const diff = Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, diff);
}

export default function Countdown() {
  // Start with null to avoid hydration mismatch between server and client
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setDaysLeft(getCountdown());
  }, []);

  return (
    <div className="flex items-baseline gap-3">
      <span
        className="text-5xl md:text-6xl font-black text-white"
        style={{
          fontFamily: "var(--font-orbitron)",
          animation: "countdownGlow 2s ease-in-out infinite",
          // Reserve space to prevent layout shift
          minWidth: "3ch",
          display: "inline-block",
        }}
      >
        {daysLeft !== null ? daysLeft : "\u00A0"}
      </span>
      <span
        className="text-xl md:text-2xl font-bold text-white tracking-widest"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        DAYS LEFT
      </span>
    </div>
  );
}
