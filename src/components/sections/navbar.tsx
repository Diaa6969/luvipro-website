"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CtaLink } from "@/components/ui/cta-link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { LanguagePicker } from "@/components/ui/language-picker";

const navItems = [
  { label: "Vorteile", href: "/#ecosystem" },
  { label: "Für Werkstätten", href: "/products" },
  { label: "Ablauf", href: "/#how-it-works" },
  { label: "Fahrzeugcheck-Preise", href: "/#pricing" },
  { label: "Werkstatt finden", href: "/verify#partner-map" },
  { label: "Berichte", href: "/reports" },
];

const mobileLinks = [
  { label: "Startseite", href: "/" },
  { label: "Für Werkstätten · Gerät & Konditionen", href: "/products" },
  { label: "Fahrzeugcheck-Preise", href: "/#pricing" },
  { label: "Prüfbericht suchen", href: "/reports" },
  { label: "Fahrzeug checken lassen", href: "/verify#partner-map" },
  { label: "Partnerwerkstätten", href: "/partner-workshops" },
  { label: "Kontakt", href: "/contact" },
];

const legalLinks = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
];


export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const mobileMenu =
    isMounted && isOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-y-auto bg-[#030815] text-white xl:hidden"
            onClick={closeMenu}
          >
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.24),transparent_32%),radial-gradient(circle_at_86%_80%,rgba(32,214,255,0.16),transparent_30%)]" />
            <div
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
              className="relative z-[100000] flex min-h-dvh w-full max-w-full flex-col p-5 sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4">
                <BrandLogo />
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-pulse/50 hover:bg-pulse/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse"
                  aria-label="Menü schließen"
                  onClick={closeMenu}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-10 grid gap-3" aria-label="Mobile Hauptnavigation">
                {mobileLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="block rounded-lg border border-white/10 bg-white/[0.06] px-4 py-4 text-lg font-semibold text-slate-100 shadow-[0_0_28px_rgba(139,92,246,0.08)] transition hover:border-pulse/35 hover:bg-pulse/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse"
                  >
                    {link.label}
                  </Link>
                ))}

              </nav>

              <div className="mt-8 max-w-xs"><LanguagePicker current="de" /></div>

              <div className="mt-auto pt-10">
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
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="luvipro-fixed-header fixed inset-x-0 top-0 z-50 border-b border-[#243450] bg-[#050d1c]">
        <nav className="section-shell flex h-16 min-w-0 items-center justify-between gap-3 sm:h-20">
          <BrandLogo />

          <div className="hidden items-center gap-5 xl:flex">
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

          <div className="hidden items-center gap-3 2xl:flex">
            <CtaLink href="/reports" variant="secondary">
              Prüfbericht suchen
            </CtaLink>
            <CtaLink href="/verify#partner-map">Fahrzeug checken lassen</CtaLink>
          </div>

          <div className="ms-auto shrink-0 xl:ms-0"><LanguagePicker current="de" compact /></div>

          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#101b32] text-white sm:h-11 sm:w-11 xl:hidden"
            aria-label="Menü öffnen"
            aria-controls={menuId}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>
      {mobileMenu}
    </>
  );
}
