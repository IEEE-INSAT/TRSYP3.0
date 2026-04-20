import Image from "next/image";
import Countdown from "./Countdown";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden scanlines"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #0a1515 40%, #050a0a 100%)",
      }}
    >
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[55%] h-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 80% 30%, rgba(0,229,200,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[40%] h-[50%] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 20% 80%, rgba(255,45,138,0.06) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Hero image as background overlay */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/hero.webp"
          alt="TRSYP robotics event"
          fill
          sizes="100vw"
          className="object-cover w-full h-full"
          priority
          placeholder="blur"
          blurDataURL="data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoQAAkAAkA4JYgCdAEO/hepgAAA/v3dT/6TnrH/V+ybJj59Hv/Zb+sT3kH+oxf/lXCvvKn/FfkX5H7wut/97gAAAA=="
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="max-w-2xl">
          {/* Logo mark */}
          <div className="mb-6 hero-fade-in" style={{ animationDelay: "0s" }}>
            <Image
              src="/logo.png"
              alt="TRSYP Logo"
              width={400}
              height={120}
              className="mb-6"
              priority
            />
            <p
              className="text-xs text-gray-400 tracking-widest uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              IEEE Tunisian RAS
            </p>
            <p
              className="text-xs text-gray-500 tracking-widest uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              Student &amp; Young Professional Congress
            </p>
          </div>

          {/* Countdown */}
          <div className="mb-6 hero-fade-in" style={{ animationDelay: "0.15s" }}>
            <Countdown />
          </div>

          {/* Date & Location */}
          <div className="flex flex-wrap items-center gap-6 mb-8 hero-fade-in" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-2 text-sm text-white">
              <svg
                className="w-4 h-4 text-[#00e5c8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
              </svg>
              <span
                className="uppercase tracking-widest text-s"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                17–18 OCTOBER 2026
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <svg
                className="w-4 h-4 text-[#00e5c8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  strokeWidth="2"
                />
                <circle cx="12" cy="9" r="2.5" strokeWidth="2" />
              </svg>
              <span
                className="uppercase tracking-widest text-s"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                TBD
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-16 hero-fade-in" style={{ animationDelay: "0.35s" }}>
            <Link href="register" className="btn-cyan">
              REGISTER NOW
            </Link>
            <Link href="#about" className="btn-outline">
              LEARN MORE
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 hero-fade-in" style={{ animationDelay: "0.45s" }}>
            {[
              { value: "2 DAYS", label: "OF INNOVATION" },
              { value: "350+", label: "PARTICIPANTS" },
              { value: "20+", label: "SPEAKERS & EXPERTS" },
            ].map((stat, i) => (
              <div key={i} className="flex items-start gap-3">
                {i > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00e5c8] mt-3 flex-shrink-0" />
                )}
                <div>
                  <div
                    className="text-xl md:text-2xl font-black text-white"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}
