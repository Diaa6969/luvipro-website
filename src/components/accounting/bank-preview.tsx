"use client";

import { useState, type FormEvent } from "react";

type Transaction = { date: string; transactionId: string; amountCents: number; reference: string };
const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function BankPreview() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("statement");
    setRows([]);
    setError("");
    if (!(file instanceof File) || !file.size || file.size > 500_000) {
      setError("Bitte eine CSV-Datei mit maximal 500 KB auswählen.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/accounting/bank-preview", { method: "POST", body: file });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Kontoauszug konnte nicht geprüft werden.");
      setRows(result.transactions);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Verbindung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return <section aria-labelledby="bank-preview-title" className="mt-10 rounded-2xl border border-white/10 p-5 sm:p-8">
    <h2 id="bank-preview-title" className="text-2xl font-semibold">Kontoauszug prüfen</h2>
    <p className="mt-2 text-sm text-slate-300">UTF-8-CSV mit Semikolon, Datum im Format JJJJ-MM-TT und eindeutiger Transaktions-ID. Die Prüfung erstellt eine Vorschau.</p>
    <p className="mt-2 break-words text-sm">Datum;Betrag;Währung;Transaktions-ID;Verwendungszweck</p>
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-4">
      <label className="min-w-0">Kontoauszug<input className="mt-2 block max-w-full text-sm" name="statement" type="file" accept=".csv,text/csv" required /></label>
      <button disabled={busy} className="rounded-xl bg-pulse px-4 py-2 font-semibold text-obsidian">CSV prüfen</button>
    </form>
    {error && <p role="alert" className="mt-3 text-red-200">{error}</p>}
    {!!rows.length && <div className="mt-4 overflow-x-auto">
      <table className="w-full text-start text-sm">
        <caption className="mb-2 text-start">{rows.length} geprüfte Transaktionen</caption>
        <thead><tr>{["Datum", "Betrag", "Transaktions-ID", "Verwendungszweck"].map(title => <th key={title} className="p-2 text-start">{title}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.transactionId} className="border-t border-white/10">
          <td className="p-2">{row.date}</td><td className="p-2">{money.format(row.amountCents / 100)}</td>
          <td className="p-2">{row.transactionId}</td><td className="p-2">{row.reference}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
