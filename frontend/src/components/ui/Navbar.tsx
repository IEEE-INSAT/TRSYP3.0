"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "TRSYP", href: "/#about" },
  { label: "PROGRAM", href: "/program" },
  { label: "SPONSORS", href: "/#sponsors", disabled: true },
  { label: "IEEE PARTNERS", href: "/#partners", disabled: true },
  { label: "FAQ", href: "/#faq", disabled: true },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-[#050505]/90 backdrop-blur-md border-b border-[#00e5c8]/20 shadow-lg"
        : "bg-transparent border-b border-white/5"
      }`}>
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="TRSYP Logo"
            width={120}
            height={45}
          />
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.disabled ? (
                <span className="nav-link text-sm opacity-50 cursor-not-allowed pointer-events-none">
                  {link.label}
                </span>
              ) : (
                <a href={link.href} className="nav-link text-sm">
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a href="/registration" className="hidden md:block btn-cyan text-xs py-3">
          REGISTER NOW
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) =>
            link.disabled ? (
              <span
                key={link.label}
                className="nav-link opacity-50 cursor-not-allowed pointer-events-none"
              >
                {link.label}
              </span>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            )
          )}
          <a href="/register" className="btn-cyan text-center mt-2">
            REGISTER NOW
          </a>
        </div>
      )}
    </nav>
  );
}
