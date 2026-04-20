"use client";

import { Star, Award, Mic } from "lucide-react";

const cards = [
  {
    icon: Star,
    iconBg: "from-pink-500 to-rose-600",
    title: "NETWORK WITH 350+ ENGINEERS, STUDENTS, & YPs FROM TUNISIA",
  },
  {
    icon: Award,
    iconBg: "from-pink-400 to-fuchsia-500",
    title: "COMPETE IN REAL-WORLD ROBOTICS CHALLENGES",
  },
  {
    icon: Mic,
    iconBg: "from-pink-400 to-pink-600",
    title: "LEARN FROM 20+ INDUSTRY EXPERTS & RESEARCHERS",
  },
];

export default function WhyJoinSection() {
  return (
    <section id="why-join" className="py-24 bg-black relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2
              className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              WHY JOIN US?
            </h2>
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
            <h2
              className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              COMPETE &amp; GROW
            </h2>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
            <span className="w-2 h-2 bg-[#ff2d8a] rotate-45 inline-block" />
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="group border border-[#00e5c8]/20 bg-[#050d0d] p-8 transition-all duration-300 hover:border-[#00e5c8] hover:bg-[#071212] hover:shadow-[0_0_40px_rgba(0,229,200,0.1)] cursor-default"
            >
              {/* Icon */}
              <div className="mb-6">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <card.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-lg font-black text-white leading-tight tracking-wide uppercase"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                {card.title}
              </h3>

              {/* Bottom accent line */}
              <div className="mt-6 w-8 h-0.5 bg-[#00e5c8] group-hover:w-full transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
