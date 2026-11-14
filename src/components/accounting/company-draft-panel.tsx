"use client";

import { useState, type FormEvent } from "react";
import { companyFields } from "@/lib/accounting/company-draft";

export function CompanyDraftPanel() {
  const [details, setDetails] = useState<Record<string, string>>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Verbindung fehlgeschlagen."); }
    finally { setBusy(false); }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const response = await fetch("/api/accounting/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      if (!response.ok) throw new Error("Entwurf konnte nicht gespeichert werden.");
      setMessage("Entwurf als neue Version gespeichert.");
    });
  }

  return <section className="mt-10 rounded-2xl border border-white/10 p-5 sm:p-8" aria-labelledby="company-draft">
    <h2 id="company-draft" className="text-2xl font-semibold">Firmendaten &amp; Aktivierung</h2>
    <p className="mt-2 text-slate-300">Firmendaten als Entwurf speichern. Die Rechnungsstellung bleibt separat freizugeben.</p>
    {!details && <button type="button" disabled={busy} className="mt-4 text-pulse underline" onClick={() => void run(async () => {
      const response = await fetch("/api/accounting/company", { cache: "no-store" });
      if (!response.ok) throw new Error("Firmendaten konnten nicht geladen werden.");
      setDetails((await response.json()).draft?.details ?? {});
    })}>Entwurf öffnen</button>}
    {details && <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
      {companyFields.map(([key, label]) => <label key={key}>{label}
        <input className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950 p-2" maxLength={250}
          value={details[key] ?? ""} onChange={event => {
            const value = event.target.value;
            setDetails(previous => ({ ...previous, [key]: value }));
          }} />
      </label>)}
      <button disabled={busy} className="rounded-xl bg-pulse p-3 font-semibold text-obsidian sm:col-span-2">Entwurf speichern</button>
    </form>}
    {message && <p className="mt-3" role="status">{message}</p>}
  </section>;
}
