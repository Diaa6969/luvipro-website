"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Globe2, Search } from "lucide-react";
import { localeHome, siteLocales, type SiteLocale } from "@/lib/site-locales";

/** Compact, keyboard-friendly native-language selector on desktop and mobile. */
export function LanguagePicker({ current, compact = false }: { current: SiteLocale; compact?: boolean }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() =>
    siteLocales.filter(([code, name]) =>
      code.includes(search.trim().toLowerCase()) ||
      name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    ), [search]);
  const selected = siteLocales.find(row => row[0] === current);
  return (
    <details className="group relative w-full min-w-0 sm:w-auto">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-pulse/50 hover:bg-pulse/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse [&::-webkit-details-marker]:hidden" aria-label="Select language / Sprache wählen">
        <Globe2 className="size-4 shrink-0 text-pulse" />
        <span>{compact ? selected?.[1] : `🌍 ${selected?.[1] ?? "Language"}`}</span>
        <span aria-hidden="true">▾</span>
      </summary>
      <div className="z-[80] mt-2 w-full min-w-[230px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/15 bg-[#081121] p-3 shadow-2xl shadow-black/50 sm:absolute sm:end-0 sm:w-72">
        <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2">
          <Search className="size-4 shrink-0 text-slate-400" />
          <span className="sr-only">Search a language</span>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            autoComplete="off" placeholder="Search / Sprache …" aria-label="Search languages"
            className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <p className="mt-3 px-2 text-xs text-slate-400">{siteLocales.length} languages</p>
        <nav className="mt-2 grid max-h-[min(55vh,440px)] gap-0.5 overflow-y-auto overscroll-contain" aria-label="Available website languages">
          {filtered.map(([code, native]) => (
            <Link key={code} lang={code} hrefLang={code} href={localeHome(code)}
              aria-current={code === current ? "page" : undefined}
              className={`rounded-lg px-3 py-2.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse ${code === current ? "bg-pulse/20 font-semibold text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}>
              <span>{native}</span> <span className="ms-1 text-[10px] uppercase text-slate-500">{code}</span>
            </Link>
          ))}
          {filtered.length === 0 && <p className="p-3 text-xs text-slate-400">No matching language</p>}
        </nav>
      </div>
    </details>
  );
}
