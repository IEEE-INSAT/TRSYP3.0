"use client";

import { useEffect, useRef } from "react";
import Navbar from "@/components/ui/Navbar";
import Link from "next/link";
import Footer from "@/components/ui/Footer";
import {
  ClipboardList,
  Mail,
  Handshake,
  MapPin,
  Mic2,
  Image,
  Building2,
  Rocket,
  UtensilsCrossed,
  Music,
  Target,
  Croissant,
  Wrench,
  Users,
  Utensils,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── schedule data ─── */
const preConference = {
  tag: "PRE-CONFERENCE",
  title: "Conference Journey & Bibliothèque Humaine Robotique",
  subtitle: "Avant-goût — Septembre 2026",
  items: [
    {
      Icon: ClipboardList,
      title: "Participant Forms",
      desc: "Complete registration & participant forms to secure your spot and customize your experience.",
    },
    {
      Icon: Mail,
      title: "Invitations",
      desc: "Official invitations distributed to selected participants, speakers, and VIPs.",
    },
    {
      Icon: Handshake,
      title: "ALECSO // INSAT",
      desc: "Special collaboration with ALECSO and INSAT — an exclusive robotics exposition preview.",
    },
  ],
};

const day1 = {
  tag: "DAY 01",
  date: "3 OCTOBER 2026",
  title: "Innovation & Discovery",
  events: [
    { time: "08:00", label: "Check-in & Registration", accent: "cyan", Icon: MapPin },
    {
      time: "09:00",
      label: "Opening Ceremony + Panel",
      desc: "Max 1 hour — keynote addresses and expert panel on Human-Robot Symbiosis.",
      accent: "pink",
      Icon: Mic2,
    },
    {
      time: "10:30",
      label: "Poster Session + Expo",
      desc: "Research poster presentations alongside the robotics exposition.",
      accent: "cyan",
      Icon: Image,
    },
    {
      time: "ALL DAY",
      label: "Enterprise Exhibition",
      desc: "Company exhibits running throughout both days — explore cutting-edge robotics and AI solutions.",
      accent: "cyan",
      Icon: Building2,
      highlight: true,
    },
    {
      time: "14:00",
      label: "Non-Technical Challenge + Technical Challenge Launch",
      desc: "Kick-off of the non-technical challenge (section-specific) plus the launch of the technical challenge with an accompanying workshop / round table.",
      accent: "pink",
      Icon: Rocket,
    },
    {
      time: "19:00",
      label: "Dinner",
      desc: "Gala dinner — a taste of Tunisia with fellow innovators.",
      accent: "cyan",
      Icon: UtensilsCrossed,
    },
    {
      time: "21:00",
      label: "Competition + DJ Night",
      desc: "Evening competition rounds followed by a live DJ set to keep the energy going.",
      accent: "pink",
      Icon: Music,
    },
    {
      time: "22:30",
      label: "Social Activity",
      desc: "Unwind and bond with participants through curated team activities.",
      accent: "cyan",
      Icon: Target,
    },
  ],
};

const day2 = {
  tag: "DAY 02",
  date: "4 OCTOBER 2026",
  title: "Learning & Celebration",
  events: [
    { time: "08:00", label: "Breakfast", accent: "cyan", Icon: Croissant },
    {
      time: "09:00",
      label: "Workshops (×4 in Parallel)",
      desc: "Four concurrent workshops — choose the track that fits your passion and skill level.",
      accent: "pink",
      Icon: Wrench,
    },
    {
      time: "11:00",
      label: "Leadership Meeting",
      desc: "Section-specific leadership roundtable to shape the future of IEEE RAS in Tunisia.",
      accent: "cyan",
      Icon: Users,
    },
    {
      time: "12:30",
      label: "Buffet Lunch",
      desc: "Savory buffet lunch — refuel and recharge before the grand finale.",
      accent: "cyan",
      Icon: Utensils,
    },
    {
      time: "14:30",
      label: "Closing Ceremony",
      desc: "Partner addresses · Technical & non-technical challenge winners · Competition winners · Best Ambassador & Coordinator awards.",
      accent: "pink",
      Icon: Trophy,
      highlight: true,
    },
  ],
};

/* ─── intersection observer hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealDiv({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-item ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── sub-components ─── */
function SectionHeader({
  tag,
  title,
  subtitle,
  accentColor = "#00e5c8",
}: {
  tag: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
}) {
  return (
    <RevealDiv className="text-center mb-16">
      <div className="flex justify-center items-center gap-3 mb-4">
        <span
          className="w-8 h-[1px] inline-block"
          style={{ background: accentColor }}
        />
        <span
          className="text-[10px] tracking-[0.35em] uppercase font-bold"
          style={{ fontFamily: "var(--font-orbitron)", color: accentColor }}
        >
          {tag}
        </span>
        <span
          className="w-8 h-[1px] inline-block"
          style={{ background: accentColor }}
        />
      </div>
      <h2
        className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-3"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-gray-400 text-sm tracking-widest uppercase"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          {subtitle}
        </p>
      )}
    </RevealDiv>
  );
}

function TimelineCard({
  time,
  label,
  desc,
  accent,
  Icon,
  highlight,
  index,
}: {
  time: string;
  label: string;
  desc?: string;
  accent: string;
  Icon: LucideIcon;
  highlight?: boolean;
  index: number;
}) {
  const accentColor = accent === "pink" ? "#ff2d8a" : "#00e5c8";
  return (
    <RevealDiv delay={index * 80} className="relative pl-8 md:pl-12 pb-10 group">
      {/* Timeline line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[1px]"
        style={{
          background: `linear-gradient(to bottom, ${accentColor}44, transparent)`,
        }}
      />
      {/* Timeline dot */}
      <div
        className="absolute left-[-5px] top-1 w-[11px] h-[11px] rounded-full border-2 transition-shadow duration-300 group-hover:shadow-[0_0_12px]"
        style={{
          borderColor: accentColor,
          background: "#050505",
          boxShadow: highlight ? `0 0 12px ${accentColor}` : "none",
        }}
      />
      {/* Card */}
      <div
        className={`relative border rounded-sm p-5 md:p-6 transition-all duration-300 hover:translate-x-1 ${highlight
          ? "border-opacity-60"
          : "border-white/10 hover:border-opacity-40"
          }`}
        style={{
          background: highlight
            ? `linear-gradient(135deg, ${accentColor}08 0%, #0a0a0a 100%)`
            : "linear-gradient(135deg, #0a0f0f 0%, #050505 100%)",
          borderColor: highlight ? accentColor : undefined,
        }}
      >
        {/* Highlight badge */}
        {highlight && (
          <div
            className="absolute -top-3 right-4 text-[9px] tracking-[0.3em] uppercase font-bold px-3 py-1 rounded-sm"
            style={{
              fontFamily: "var(--font-orbitron)",
              background: accentColor,
              color: "#000",
            }}
          >
            HIGHLIGHT
          </div>
        )}
        <div className="flex flex-wrap items-start gap-4">
          {/* Time badge */}
          <div
            className="text-[11px] tracking-[0.2em] font-bold px-3 py-1 rounded-sm shrink-0"
            style={{
              fontFamily: "var(--font-orbitron)",
              background: `${accentColor}15`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            {time}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-base md:text-lg font-bold text-white mb-1 flex items-center gap-2.5"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <Icon
                className="w-5 h-5 shrink-0"
                style={{ color: accentColor }}
                strokeWidth={1.8}
              />
              {label}
            </h3>
            {desc && (
              <p className="text-gray-400 text-sm leading-relaxed ml-[30px]">
                {desc}
              </p>
            )}
          </div>
        </div>
      </div>
    </RevealDiv>
  );
}

/* ─── main page ─── */
export default function ProgramPage() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      {/* ===== Hero Banner ===== */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #071414 40%, #050a0a 100%)",
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(0,229,200,0.5) 60px, rgba(0,229,200,0.5) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,229,200,0.5) 60px, rgba(0,229,200,0.5) 61px)",
          }}
        />
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[50%] h-full opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 80% 20%, rgba(0,229,200,0.1) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-[40%] h-[60%] opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 20% 80%, rgba(255,45,138,0.08) 0%, transparent 60%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="hero-fade-in" style={{ animationDelay: "0s" }}>
            <div className="flex justify-center gap-2 mb-6">
              <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
              <span className="w-2 h-2 bg-[#ff2d8a] rotate-45 inline-block" />
              <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
            </div>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-widest uppercase mb-4"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              PROGRAM
            </h1>
            <p
              className="text-gray-400 text-sm md:text-base tracking-widest uppercase max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              3–4 OCTOBER 2026 · HUMAN-ROBOT SYMBIOSIS
            </p>
          </div>

          {/* Phase navigation pills */}
          <div
            className="hero-fade-in mt-12 flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "0.2s" }}
          >
            {[
              { href: "#pre-conference", label: "PRE-CONFERENCE", color: "#00e5c8" },
              { href: "#day1", label: "DAY 01", color: "#ff2d8a" },
              { href: "#day2", label: "DAY 02", color: "#00e5c8" },
            ].map((pill) => (
              <a
                key={pill.label}
                href={pill.href}
                className="text-[10px] tracking-[0.3em] uppercase font-bold px-5 py-2.5 border rounded-sm transition-all duration-300 hover:scale-105"
                style={{
                  fontFamily: "var(--font-orbitron)",
                  borderColor: `${pill.color}40`,
                  color: pill.color,
                  background: `${pill.color}08`,
                }}
              >
                {pill.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>

      {/* ===== Pre-Conference Section ===== */}
      <section id="pre-conference" className="py-20 md:py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader
            tag={preConference.tag}
            title={preConference.title}
            subtitle={preConference.subtitle}
          />

          <div className="grid md:grid-cols-3 gap-6">
            {preConference.items.map((item, i) => {
              const ItemIcon = item.Icon;
              return (
                <RevealDiv key={i} delay={i * 100}>
                  <div className="card-dark rounded-sm h-full group cursor-default">
                    <div className="mb-4 transition-transform duration-300 group-hover:scale-110 inline-block">
                      <ItemIcon
                        className="w-8 h-8"
                        style={{ color: i % 2 === 0 ? "#00e5c8" : "#ff2d8a" }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3
                      className="text-sm font-bold text-white uppercase tracking-widest mb-2"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </RevealDiv>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Divider ===== */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00e5c8]/30 to-transparent" />
      </div>

      {/* ===== Day 1 ===== */}
      <section id="day1" className="py-20 md:py-28 relative">
        {/* Subtle side glow */}
        <div
          className="absolute top-0 left-0 w-[30%] h-full opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 0% 50%, rgba(255,45,138,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <SectionHeader
            tag={day1.tag}
            title={day1.title}
            subtitle={day1.date}
            accentColor="#ff2d8a"
          />
          <div>
            {day1.events.map((event, i) => (
              <TimelineCard
                key={i}
                index={i}
                time={event.time}
                label={event.label}
                desc={event.desc}
                accent={event.accent}
                Icon={event.Icon}

              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Divider ===== */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#ff2d8a]/30 to-transparent" />
      </div>

      {/* ===== Day 2 ===== */}
      <section id="day2" className="py-20 md:py-28 relative">
        <div
          className="absolute top-0 right-0 w-[30%] h-full opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 100% 50%, rgba(0,229,200,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <SectionHeader
            tag={day2.tag}
            title={day2.title}
            subtitle={day2.date}
          />
          <div>
            {day2.events.map((event, i) => (
              <TimelineCard
                key={i}
                index={i}
                time={event.time}
                label={event.label}
                desc={event.desc}
                accent={event.accent}
                Icon={event.Icon}

              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #000 0%, #051212 50%, #000 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,229,200,0.5) 40px, rgba(0,229,200,0.5) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,229,200,0.5) 40px, rgba(0,229,200,0.5) 41px)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <RevealDiv>
            <div className="flex justify-center gap-2 mb-6">
              <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
              <span className="w-2 h-2 bg-[#ff2d8a] rotate-45 inline-block" />
              <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
            </div>
            <h2
              className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-4"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              DON&apos;T MISS OUT
            </h2>
            <p
              className="text-gray-400 text-sm tracking-widest uppercase mb-8"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              SECURE YOUR SPOT · LIMITED SEATS
            </p>
            <Link href="/register" className="btn-cyan text-base px-10 py-4">
              REGISTER NOW
            </Link>
          </RevealDiv>
        </div>
      </section>

      <Footer />

      {/* Reveal animation styles */}
      <style jsx global>{`
        .reveal-item {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-item.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
