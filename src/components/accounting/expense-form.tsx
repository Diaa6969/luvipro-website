"use client";

import { FormEvent, useState } from "react";
import { safeVatSplit } from "@/lib/accounting/monthly";

const categories = [
  ["waren", "Wareneinkauf / Geräte"], ["software", "Software & Hosting"], ["marketing", "Marketing"],
  ["miete", "Miete"], ["buero", "Büro & Ausstattung"], ["personal", "Personal"],
  ["transport", "Transport"], ["sonstiges", "Sonstiges"],
];
const cls = "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-white/20 bg-[#0b1324] px-3 py-2.5 text-base text-white outline-none focus:border-pulse";

export function ExpenseForm() {
  const [gross, setGross] = useState("");
  const [rate, setRate] = useState<0|7|19>(19);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const normalized = gross.trim().replace(",", ".");
  const amount = /^\d{1,10}(?:\.\d{1,2})?$/.test(normalized) ? Math.round(Number(normalized) * 100) : 0;
  let preview: ReturnType<typeof safeVatSplit> | null = null;
  try { if (amount > 0) preview = safeVatSplit(amount, rate); } catch { /* wait for valid value */ }
  const format = (v: number) => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v / 100);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/accounting/expenses", {
        method: "POST", body: new FormData(event.currentTarget), credentials: "same-origin",
        redirect: "manual",
      });
      if (res.type === "opaqueredirect") {
        window.location.assign("/intern/finanzen?saved=1");
        return;
      }
      const data: { error?: string; year?: number } = await res.json();
      if (!res.ok) throw new Error(data.error || "Beleg nicht gespeichert");
      window.location.assign("/intern/finanzen?year=" + data.year + "&saved=1");
    } catch (e) { setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen"); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-slate-200">Lieferant / Rechnungsaussteller *
        <input className={cls} name="supplier" required maxLength={150} placeholder="z. B. Sulodak" />
      </label>
      <label className="text-sm text-slate-200">Lieferanten-Rechnungsnummer *
        <input className={cls} name="invoiceNumber" required maxLength={100} placeholder="Lief.-RE-2026-..." />
      </label>
      <label className="text-sm text-slate-200">Rechnungsdatum *
        <input className={cls} type="date" name="invoiceDate" required />
      </label>
      <label className="text-sm text-slate-200">Kategorie *
        <select className={cls} name="category" required defaultValue="waren">
          {categories.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-200">Rechnungsbetrag brutto (€) *
        <input className={cls} name="gross" required inputMode="decimal" placeholder="119,00" value={gross} onChange={e=>setGross(e.target.value)} />
      </label>
      <label className="text-sm text-slate-200">Umsatzsteuer laut Beleg *
        <select className={cls} name="vatRate" value={rate} onChange={e=>setRate(Number(e.target.value) as 0|7|19)}>
          <option value={19}>19 %</option><option value={7}>7 %</option><option value={0}>0 % / keine ausgewiesene USt.</option>
        </select>
      </label>
      <label className="text-sm text-slate-200 sm:col-span-2">Beschreibung
        <input className={cls} name="description" maxLength={500} placeholder="Wofür wurde die Rechnung ausgestellt?" />
      </label>
      <label className="text-sm text-slate-200 sm:col-span-2">Originalbeleg (PDF, PNG oder JPG, max. 5 MB) *
        <input className={cls} name="receipt" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required />
      </label>
      {preview && (
        <div className="sm:col-span-2 flex flex-wrap gap-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <span>Netto: <b className="text-white">{format(preview.netCents)}</b></span>
          <span>USt: <b className="text-white">{format(preview.vatCents)}</b></span>
          <span>Brutto: <b className="text-white">{format(preview.grossCents)}</b></span>
        </div>
      )}
      <label className="flex items-start gap-3 text-sm text-slate-200 sm:col-span-2">
        <input type="checkbox" name="paid" className="mt-1 size-4 accent-cyan-400" />
        Beleg ist bezahlt
      </label>
      <label className="flex items-start gap-3 text-sm text-slate-200 sm:col-span-2">
        <input type="checkbox" name="vatConfirmed" className="mt-1 size-4 accent-cyan-400" />
        Vorsteuerabzug anhand des gültigen Belegs steuerlich geprüft (nicht automatisch)
      </label>
      <p className="text-xs leading-5 text-amber-200 sm:col-span-2">Bei Import, EU-Erwerb, Reverse-Charge, Anzahlungen oder gemischten Steuersätzen erst steuerlich klären. Umsatzsteuer auf einer Rechnung bedeutet nicht automatisch abzugsfähige Vorsteuer.</p>
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-900/20 p-3 text-sm text-red-200 sm:col-span-2">{error}</p>}
      <button disabled={busy} className="min-h-12 rounded-xl bg-pulse px-6 py-3 font-semibold text-obsidian hover:bg-frost disabled:opacity-50 sm:col-span-2">
        {busy ? "Beleg wird gespeichert …" : "Eingangsrechnung sicher speichern"}
      </button>
    </form>
  );
}
