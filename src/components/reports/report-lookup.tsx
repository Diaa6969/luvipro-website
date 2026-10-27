"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCopy, FileSearch, ShieldCheck } from "lucide-react";
import { normalizeReportReference, validReportReference, type ReportSearchMode } from "@/lib/reports/reference";

type SearchMode = ReportSearchMode;

/**
 * A VIN or report number is a SEARCH REFERENCE, never an access credential.
 * No personal inspection data, PDFs or unauthenticated Supabase records are
 * returned from this public website. Purchased files are served in-app after
 * authenticated authorization; QR and public-token endpoints are not used.
 */
export function ReportLookup() {
  const [mode, setMode] = useState<SearchMode>("vin");
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState<{ mode: SearchMode; reference: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = normalizeReportReference(input);
    const valid = validReportReference(mode, value);
    if (!valid) {
      setError(mode === "vin"
        ? "Bitte eine vollständige, gültig formatierte FIN/VIN mit 17 Zeichen eingeben."
        : "Bitte eine gültige Berichtsnummer eingeben (6–64 Zeichen, nur Buchstaben, Zahlen und Bindestriche).");
      setSubmitted(null);
      return;
    }
    setError("");
    setSubmitted({ mode, reference: value });
    setCopied(false);
  }

  async function copyReference() {
    if (!submitted) return;
    try {
      await navigator.clipboard.writeText(submitted.reference);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="glass-panel rounded-2xl border border-pulse/20 p-6 sm:p-8">
      <div className="flex items-center gap-3 text-pulse">
        <FileSearch className="h-6 w-6" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Prüfbericht suchen</p>
      </div>
      <h2 className="mt-4 font-[var(--font-space-grotesk)] text-2xl font-semibold text-white sm:text-3xl">
        Bericht per VIN oder Berichtsnummer
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Wählen Sie Ihre Fahrzeug-Identifizierungsnummer (FIN/VIN) oder die individuelle Berichtsnummer.
        Den vollständigen Bericht erhalten nur berechtigte Nutzer nach Prüfung des Zugriffs und, falls erforderlich, nach dem Kauf.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label="Bericht suchen nach">
        <button type="button" aria-pressed={mode === "vin"} onClick={() => { setMode("vin"); setInput(""); setSubmitted(null); setError(""); }}
          className={`rounded-xl border px-5 py-4 text-left font-semibold transition ${mode === "vin" ? "border-pulse bg-pulse/10 text-white" : "border-white/15 text-slate-300 hover:border-pulse/50"}`}>
          FIN / VIN
        </button>
        <button type="button" aria-pressed={mode === "report"} onClick={() => { setMode("report"); setInput(""); setSubmitted(null); setError(""); }}
          className={`rounded-xl border px-5 py-4 text-left font-semibold transition ${mode === "report" ? "border-pulse bg-pulse/10 text-white" : "border-white/15 text-slate-300 hover:border-pulse/50"}`}>
          Berichtsnummer
        </button>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label htmlFor="lookup-reference" className="block text-sm font-semibold text-slate-200">
          {mode === "vin" ? "17-stellige Fahrzeug-Identifizierungsnummer" : "Individuelle Berichtsnummer"}
        </label>
        <input
          id="lookup-reference" autoComplete="off" required
          maxLength={mode === "vin" ? 17 : 64} value={input}
          placeholder={mode === "vin" ? "z. B. WBA12345678901234" : "z. B. Berichts-ID"}
          onChange={(e) => { setInput(e.target.value); setSubmitted(null); setError(""); }}
          className="block min-h-13 w-full rounded-xl border border-white/20 bg-[#090e1b] px-4 py-3 font-mono text-base uppercase tracking-[0.05em] text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-pulse focus:outline-none"
        />
        {error && <p className="text-sm text-rose-200" role="alert">{error}</p>}
        <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-pulse px-5 py-3 font-semibold text-obsidian transition hover:bg-frost">
          Referenz für die App vorbereiten <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      {submitted && (
        <div role="status" className="mt-6 space-y-4 rounded-xl border border-pulse/30 bg-pulse/10 p-5">
          <p className="text-sm font-semibold text-white">Suchreferenz vorbereitet</p>
          <p className="break-all font-mono text-sm text-frost">{submitted.reference}</p>
          <p className="text-sm leading-7 text-slate-200">
            Auf der Website werden keine vertraulichen Berichte ohne Anmeldung freigegeben.
            Öffnen Sie die LUVIPRO App, melden Sie sich an und suchen Sie dort mit dieser
            {submitted.mode === "vin" ? " FIN/VIN" : " Berichtsnummer"}, um verfügbare Berichte zu prüfen
            und berechtigt herunterzuladen. Eine bestätigte Berichtssuche auf dem Server ist hier noch nicht aktiviert.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void copyReference()}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10">
              <ClipboardCopy className="size-4" />{copied ? "Kopiert" : "Referenz kopieren"}
            </button>
            <Link href="/app" className="rounded-full border border-pulse/50 px-4 py-2 text-sm font-semibold text-pulse hover:bg-pulse/10">
              Zur LUVIPRO App
            </Link>
          </div>
        </div>
      )}
      <p className="mt-6 flex items-start gap-3 text-xs leading-6 text-slate-400">
        <ShieldCheck className="mt-1 size-4 shrink-0 text-pulse" />
        Eine FIN oder Berichtsnummer allein ist kein Berechtigungsnachweis. Ein kostenpflichtiger Bericht darf nur nach erfolgreicher Zahlungs- und Zugriffsprüfung heruntergeladen werden.
      </p>
    </div>
  );
}
