import Image from "next/image";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "TRSYP", href: "#about" },
  { label: "Program", href: "#program" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "IEEE Partners", href: "#partners" },
  { label: "FAQ", href: "#faq" },
];

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo.png"
            alt="TRSYP Logo"
            width={150}
            height={45}
            className="mb-4"
          />
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap justify-center gap-6 mb-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs text-gray-400 hover:text-[#00e5c8] transition-colors duration-200 tracking-wider uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Social icons */}
        <div className="flex justify-center gap-6 mb-10">
          {/* Facebook */}
          <a
            href="#"
            className="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:border-[#00e5c8] hover:text-[#00e5c8] transition-all duration-200"
            aria-label="Facebook"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="#"
            className="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:border-[#00e5c8] hover:text-[#00e5c8] transition-all duration-200"
            aria-label="Instagram"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2" />
              <circle cx="12" cy="12" r="4" strokeWidth="2" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
          {/* LinkedIn */}
          <a
            href="#"
            className="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:border-[#00e5c8] hover:text-[#00e5c8] transition-all duration-200"
            aria-label="LinkedIn"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p
            className="text-[10px] text-gray-600 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            IEEE TRSYP 3.0 · ALL RIGHTS RESERVED
          </p>
          {/* Bottom diamond decorators */}
          <div className="flex justify-center gap-2 mt-4">
            <span className="w-1.5 h-1.5 bg-[#00e5c8] rotate-45 inline-block" />
            <span className="w-1.5 h-1.5 bg-[#ff2d8a] rotate-45 inline-block" />
            <span className="w-1.5 h-1.5 bg-[#00e5c8] rotate-45 inline-block" />
          </div>
        </div>
      </div>
    </footer>
  );
}
