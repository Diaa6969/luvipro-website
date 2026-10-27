"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Globe2, Search, X } from "lucide-react";
import { localeHome, localeHref, siteLocales, type SiteLocale } from "@/lib/site-locales";

/**
 * Visible language control on every viewport. The menu uses a body portal so
 * overflow/clipping in the animated page and header cannot hide its 31 links.
 * Both the dialog and its backdrop are fully opaque.
 */
export function LanguagePicker({
  current,
  compact = false,
  section,
}: {
  current: SiteLocale;
  compact?: boolean;
  section?: "products" | "reports" | "workshops" | "contact" | "app";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = siteLocales.find(([code]) => code === current);
  const title = current === "ar" ? "اختر اللغة" : current === "de" ? "Sprache wählen" : "Choose language";

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return siteLocales.filter(([code, name]) =>
      code.includes(term) || name.toLocaleLowerCase().includes(term),
    );
  }, [search]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", escape);
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    setSearch("");
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={title}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => { setSearch(""); setIsOpen(true); }}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-pulse/50 bg-[#101b32] px-3 py-2 text-sm font-semibold text-white shadow-md shadow-black/30 transition hover:border-pulse hover:bg-[#1b2b49] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse sm:px-4"
      >
        <Globe2 className="size-5 shrink-0 text-pulse" aria-hidden="true" />
        <span>{compact ? selected?.[1] ?? "Language" : `🌍 ${selected?.[1] ?? "Language"}`}</span>
        <span className="text-pulse" aria-hidden="true">▾</span>
      </button>
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[2147483000] flex items-center justify-center overflow-y-auto bg-[#030815] p-3 text-white sm:p-6"
          role="presentation"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="flex max-h-[min(92dvh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#354565] bg-[#0b1428] shadow-[0_24px_100px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#273955] bg-[#101d35] px-5 py-4 sm:px-7">
              <div>
                <h2 className="flex items-center gap-3 text-lg font-bold sm:text-xl">
                  <Globe2 className="size-6 text-pulse" aria-hidden="true" />
                  {title}
                </h2>
                <p className="mt-2 text-xs text-slate-300">{siteLocales.length} languages · 31 Sprachen</p>
              </div>
              <button
                type="button"
                aria-label={current === "ar" ? "إغلاق" : "Close / Schließen"}
                onClick={close}
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#43516c] bg-[#16243d] hover:bg-[#253959] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="border-b border-[#273955] bg-[#0b1428] px-5 py-4 sm:px-7">
              <label htmlFor="luvipro-language-search" className="flex items-center gap-3 rounded-xl border border-[#3b4c69] bg-[#131f36] px-4 py-3">
                <Search className="size-5 shrink-0 text-pulse" aria-hidden="true" />
                <span className="sr-only">Search a language / Sprache suchen</span>
                <input
                  ref={searchRef}
                  id="luvipro-language-search"
                  type="search"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  autoComplete="off"
                  placeholder="Search / Sprache suchen / بحث"
                  aria-label="Search languages"
                  className="w-full min-w-0 bg-[#131f36] text-base text-white outline-none placeholder:text-slate-400"
                />
              </label>
            </div>
            <nav
              aria-label="Available website languages"
              className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto overscroll-contain bg-[#0b1428] p-4 sm:grid-cols-2 sm:p-6"
            >
              {filtered.map(([code, native]) => (
                <Link
                  key={code}
                  lang={code}
                  hrefLang={code}
                  href={section ? localeHref(code, section) : localeHome(code)}
                  aria-current={code === current ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-base transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse ${
                    code === current
                      ? "border-pulse bg-[#29385d] font-bold text-white"
                      : "border-[#283852] bg-[#14223a] text-slate-100 hover:border-pulse/50 hover:bg-[#223552]"
                  }`}
                >
                  <span>{native}</span>
                  <span className="shrink-0 text-xs uppercase text-slate-300">{code}{code === current ? " ✓" : ""}</span>
                </Link>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full p-5 text-center text-sm text-slate-300">No matching language / Keine Sprache gefunden</p>
              )}
            </nav>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
