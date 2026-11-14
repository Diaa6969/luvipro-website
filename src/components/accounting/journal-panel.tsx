"use client";

import { useState, type FormEvent } from "react";

type Entry = {
  id: string;
  posting_date: string;
  reference: string;
  memo: string;
  reversal_of: string | null;
  luvipro_finance_lines: { account: string; debit_cents: number; credit_cents: number; line_number: number }[];
};

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const input = "mt-1 w-full rounded-lg border border-white/20 bg-slate-950 p-2 text-white";

function toCents(value: FormDataEntryValue | null) {
  const amount = String(value ?? "").trim().replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(amount)) throw new Error("Bitte einen gültigen Eurobetrag eingeben.");
  const [whole, fraction = ""] = amount.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function JournalPanel({ postingEnabled }: { postingEnabled: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reversal, setReversal] = useState<Entry>();

  async function load() {
    const result = await fetch("/api/accounting/journal", { cache: "no-store" });
    if (!result.ok) throw new Error("Journal nicht verfügbar. Bitte Datenbankmigration und Anmeldung prüfen.");
    setEntries(await result.json());
    setLoaded(true);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Verbindung fehlgeschlagen."); }
    finally { setBusy(false); }
  }

  async function post(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      const amount = reversal ? 0 : toCents(data.get("amount"));
      const lines = reversal ? [] : [
        { account: data.get("debit"), debit: amount, credit: 0 },
        { account: data.get("credit"), debit: 0, credit: amount },
      ];
      const result = await fetch("/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.get("date"), reference: data.get("reference"), memo: data.get("memo"), lines, reversal: reversal?.id }),
      });
      if (!result.ok) throw new Error((await result.json().catch(() => null))?.error ?? "Buchung fehlgeschlagen.");
      setReversal(undefined);
      setMessage("Buchung gespeichert.");
      try { await load(); }
      catch { setMessage("Buchung gespeichert. Das Journal konnte noch nicht neu geladen werden."); }
    });
  }

  return <section aria-labelledby="journal-title" className="mt-10 rounded-2xl border border-white/10 p-5 sm:p-8">
    <h2 id="journal-title" className="text-2xl font-semibold">Buchungsjournal</h2>
    <button type="button" disabled={busy} onClick={() => void run(load)} className="mt-3 text-pulse underline">Letzte 100 Buchungen laden</button>
    {loaded && !entries.length && <p className="mt-3">Keine Buchungen vorhanden.</p>}
    <ul className="mt-4 space-y-3">
      {entries.map(entry => <li key={entry.id} className="rounded-xl border border-white/10 p-4">
        <p className="font-semibold">{entry.posting_date} · {entry.reference}</p>
        <p>{entry.memo}{entry.reversal_of && " · Storno"}</p>
        <ul className="my-2 text-sm text-slate-300">
          {[...entry.luvipro_finance_lines].sort((a, b) => a.line_number - b.line_number).map(line =>
            <li key={line.line_number}>{line.account} · {line.debit_cents > 0 ? "Soll" : "Haben"} {money.format((line.debit_cents || line.credit_cents) / 100)}</li>
          )}
        </ul>
        {postingEnabled && !entry.reversal_of && !entries.some(other => other.reversal_of === entry.id) &&
          <button type="button" onClick={() => setReversal(entry)} className="text-pulse underline">Storno vorbereiten</button>}
      </li>)}
    </ul>
    {postingEnabled && <form onSubmit={post} className="mt-5 grid gap-4 sm:grid-cols-2">
      {reversal && <p className="sm:col-span-2">Storno für {reversal.reference} · <button type="button" onClick={() => setReversal(undefined)} className="text-pulse underline">Abbrechen</button></p>}
      <label>Buchungsdatum<input className={input} name="date" type="date" required /></label>
      <label>Eindeutige Referenz<input className={input} name="reference" maxLength={180} required /></label>
      <label className="sm:col-span-2">Buchungstext<input className={input} name="memo" maxLength={500} required /></label>
      {!reversal && <>
        <label>Sollkonto<input className={input} name="debit" inputMode="numeric" pattern="[0-9]{4,9}" required /></label>
        <label>Habenkonto<input className={input} name="credit" inputMode="numeric" pattern="[0-9]{4,9}" required /></label>
        <label>Betrag in Euro<input className={input} name="amount" inputMode="decimal" required /></label>
      </>}
      <button disabled={busy} className="rounded-xl bg-pulse p-3 font-semibold text-obsidian sm:col-span-2">{reversal ? "Storno buchen" : "Buchung erfassen"}</button>
    </form>}
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
