"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { BrandLogo } from "@/components/ui/brand-logo";

const navItems = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "UV-Gerät", href: "#scanner" },
  { label: "Ablauf", href: "#how-it-works" },
  { label: "Preise", href: "#pricing" },
  { label: "Marktplatz", href: "#marketplace" },
];

const mobileLinks = [
  { label: "Startseite", href: "/" },
  { label: "Produkte", href: "/products" },
  { label: "Fahrzeug verifizieren", href: "/verify" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Partnerwerkstätten", href: "/partner-workshops" },
  { label: "LUVIPRO App", href: "/app" },
  { label: "Kontakt", href: "/contact" },
];

const legalLinks = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-obsidian/72 backdrop-blur-xl">
      <nav className="section-shell flex h-16 min-w-0 items-center justify-between gap-3 sm:h-20">
        <BrandLogo />

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <CtaLink href="/verify" variant="secondary">
            Fahrzeug prüfen
          </CtaLink>
          <CtaLink href="/contact">Partner werden</CtaLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white sm:h-11 sm:w-11 lg:hidden"
          aria-label="Menü öffnen"
          aria-controls={menuId}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
        onClick={closeMenu}
      >
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className={`ml-auto flex h-dvh w-[min(88vw,380px)] max-w-full flex-col overflow-y-auto border-l border-white/10 bg-obsidian/92 p-5 shadow-[0_0_70px_rgba(139,92,246,0.22)] backdrop-blur-2xl transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4">
            <BrandLogo />
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-pulse/50 hover:bg-pulse/10"
              aria-label="Menü schließen"
              onClick={closeMenu}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.045] p-3">
            <nav className="space-y-1" aria-label="Mobile Hauptnavigation">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-4 py-3 text-base font-semibold text-slate-100 transition hover:bg-pulse/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://luvipro.shop"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="block rounded-lg px-4 py-3 text-base font-semibold text-slate-100 transition hover:bg-pulse/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse"
              >
                Unser Shop
              </a>
            </nav>
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-lg border border-ultraviolet/20 bg-ultraviolet/10 p-4">
              <p className="text-xs font-semibold uppercase text-pulse">Rechtliches</p>
              <nav className="mt-3 flex flex-wrap gap-2" aria-label="Rechtliche Links">
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-pulse/45 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
