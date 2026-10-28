"use client";

import { WebAppEntry } from "@/components/ui/web-app-entry";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CtaLink } from "@/components/ui/cta-link";
import { internationalHomeCopy, type InternationalLocale } from "@/lib/international-home-copy";
import { LanguagePicker } from "@/components/ui/language-picker";


export function LocaleDocument({ locale }: { locale: InternationalLocale }) {
  useEffect(() => {
    const html = document.documentElement;
    const previousLang = html.lang;
    const previousDir = html.dir;
    html.lang = locale;
    html.dir = locale === "ar" ? "rtl" : "ltr";
    return () => {
      html.lang = previousLang;
      html.dir = previousDir;
    };
  }, [locale]);
  return null;
}


export function InternationalNavbar({ locale }: { locale: InternationalLocale }) {
  const t = internationalHomeCopy[locale];
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuId = useId();

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);
  const navItems = t.sections.nav.map((label, index) => ({
    label,
    href: [`/${locale}#ecosystem`, `/${locale}/products`, `/${locale}#how-it-works`, `/${locale}/products`, `/${locale}#partner-map`][index],
  }));
  const mobileLinks = [
    { label: t.site.home, href: `/${locale}` },
    { label: t.site.products, href: `/${locale}/products` },
    { label: t.site.prices, href: `/${locale}/products` },
    { label: locale === "ar" ? "البحث عن تقرير" : "Find a report", href: `/${locale}/reports` },
    { label: t.site.verify, href: `/${locale}/reports` },
    { label: t.site.workshops, href: `/${locale}/workshops` },
    { label: t.site.contact, href: `/${locale}/contact` },
  ];
  const legalLinks = [
    { label: t.site.imprint, href: "/impressum" },
    { label: t.site.privacy, href: "/datenschutz" },
    { label: t.site.terms, href: "/agb" },
  ];

  const mobileMenu = isMounted && isOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto bg-[#030815] text-white xl:hidden"
          onClick={closeMenu}
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.24),transparent_32%),radial-gradient(circle_at_86%_80%,rgba(32,214,255,0.16),transparent_30%)]" />
          <div
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label={t.site.navigation}
            className="relative z-[100000] flex min-h-dvh w-full max-w-full flex-col p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <BrandLogo homeHref={`/${locale}`} />
              <button
                type="button"
                aria-label={t.site.closeMenu}
                onClick={closeMenu}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-10 grid gap-3" aria-label={t.site.navigation}>
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

              <WebAppEntry />
            </nav>
            <div className="mt-7">
              <p className="mb-3 text-xs font-semibold uppercase text-pulse">{t.site.languages}</p>
              <LanguagePicker current={locale} />
            </div>
            <div className="mt-auto pt-10">
              <div className="rounded-lg border border-ultraviolet/20 bg-ultraviolet/10 p-4">
                <p className="text-xs font-semibold uppercase text-pulse">{t.site.legal}</p>
                <nav className="mt-3 flex flex-wrap gap-2" aria-label={t.site.legal}>
                  {legalLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={closeMenu} className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 hover:text-white">
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
        <nav className="section-shell flex h-16 min-w-0 items-center justify-between gap-3 sm:h-20" aria-label={t.site.navigation}>
          <BrandLogo homeHref={`/${locale}`} />
          <div className="hidden items-center gap-4 xl:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-300 transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 2xl:flex">
            <CtaLink href={`/${locale}/reports`} variant="secondary">{locale === "ar" ? "البحث عن تقرير" : "Find report"}</CtaLink>
            <CtaLink href={`/${locale}/contact`}>{t.site.partner}</CtaLink>
          </div>
          <div className="hidden shrink-0 md:block"><WebAppEntry /></div>
          <div className="ms-auto shrink-0 xl:ms-0"><LanguagePicker current={locale} compact /></div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#101b32] text-white sm:h-11 sm:w-11 xl:hidden"
            aria-label={t.site.openMenu}
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
