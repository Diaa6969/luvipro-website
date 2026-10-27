"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ClipboardCopy, ShieldCheck } from "lucide-react";
import { siteTranslation } from "@/lib/site-translation";
import { localeHref, type SiteLocale } from "@/lib/site-locales";
import { normalizeReportReference, validReportReference, type ReportSearchMode } from "@/lib/reports/reference";

/** Client-side reference preparation only; no public user data or PDF leakage. */
export function EuropeanLookup({ locale }: { locale: SiteLocale }) {
  const t = siteTranslation(locale);
  const [mode, setMode] = useState<ReportSearchMode>("vin");
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);
  const [confirmed, setConfirmed] = useState("");
  const [copied, setCopied] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ref = normalizeReportReference(entry);
    const valid = validReportReference(mode, ref);
    setError(!valid);
    setConfirmed(valid ? ref : "");
    setCopied(false);
  }
  return (
    <div className="rounded-2xl border border-pulse/25 bg-white/[0.04] p-5 sm:p-7">
      <p className="text-sm font-semibold text-pulse">{t.reportTitle}</p>
      <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Lookup mode">
        <button type="button" aria-pressed={mode==="vin"} onClick={()=>{setMode("vin");setEntry("");setConfirmed("");setError(false)}}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${mode==="vin"?"border-pulse bg-pulse/15 text-white":"border-white/15 text-slate-300"}`}>VIN / FIN</button>
        <button type="button" aria-pressed={mode==="report"} onClick={()=>{setMode("report");setEntry("");setConfirmed("");setError(false)}}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${mode==="report"?"border-pulse bg-pulse/15 text-white":"border-white/15 text-slate-300"}`}>{t.reportLabel}</button>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label htmlFor="localized-report-ref" className="block text-sm text-slate-200">{mode==="vin"?t.vinLabel:t.reportLabel}</label>
        <input id="localized-report-ref" required autoComplete="off"
          maxLength={mode==="vin"?17:64} value={entry}
          onChange={e=>{setEntry(e.target.value);setConfirmed("");setError(false)}}
          className="w-full rounded-xl border border-white/20 bg-[#0a1122] px-4 py-3 font-mono text-base uppercase text-white outline-none focus:border-pulse"
          placeholder={mode==="vin"?"WBA12345678901234":"LUV-2026-0000001"}
        />
        {error && <p className="text-sm text-amber-200" role="alert">{mode==="vin"?"VIN: 17 characters (A-H, J-N, P, R-Z, 0-9).":"Invalid report reference / ungültige Berichtsnummer."}</p>}
        <button type="submit" className="w-full rounded-full bg-pulse px-5 py-3 text-sm font-semibold text-obsidian hover:bg-frost">{t.search}</button>
      </form>
      {confirmed && <div role="status" className="mt-5 rounded-xl border border-pulse/20 bg-pulse/10 p-4">
        <p className="break-all font-mono text-sm text-frost">{confirmed}</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">{t.searchNotice}</p>
        <button type="button" onClick={()=>void navigator.clipboard.writeText(confirmed).then(()=>setCopied(true)).catch(()=>setCopied(false))}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-xs">
          <ClipboardCopy className="size-4"/>{copied?"✓":t.search}
        </button>
        <Link href={localeHref(locale,"app")} className="ms-4 inline-flex text-sm text-pulse underline">{t.app}</Link>
      </div>}
      <p className="mt-5 flex gap-2 text-xs leading-6 text-slate-400"><ShieldCheck className="mt-1 size-4 shrink-0 text-pulse"/>{t.searchNotice}</p>
    </div>
  );
}
