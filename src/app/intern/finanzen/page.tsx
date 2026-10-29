import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, Banknote, FileCheck2, FileClock, FileText, Receipt, ShieldCheck, TrendingUp } from "lucide-react";
import { isAccountingAdmin, accountingEnabled } from "@/lib/accounting/admin-auth";
import { readAccountingYear } from "@/lib/accounting/database";
import { buildMonthlyTable, sumMonths, validYear, type IncomingInvoice, type OutgoingInvoice } from "@/lib/accounting/monthly";
import { ExpenseForm } from "@/components/accounting/expense-form";
import { BankTransferPanel } from "@/components/accounting/bank-transfer-panel";
import { CashEventPanel } from "@/components/accounting/cash-event-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Interne Buchhaltung | LUVIPRO",
  robots: { index: false, follow: false, nocache: true },
};
const eur = (cents: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
const dateDE = (d: string | null) => d ? new Date(d + "T12:00:00Z").toLocaleDateString("de-DE", { timeZone: "UTC" }) : "–";
const period = (year: number) => new Intl.DateTimeFormat("de-DE", { month: "short" }).format(new Date(Date.UTC(year, 0, 1)));

function Highlight({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof FileText }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-300">{label}</p><Icon className="h-5 w-5 shrink-0 text-pulse" /></div>
      <p className="mt-4 break-words font-[var(--font-space-grotesk)] text-2xl font-bold text-white sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-6 text-slate-400">{note}</p>
    </div>
  );
}
export default async function AccountingDashboard({ searchParams }: {
  searchParams: Promise<{ year?: string; saved?: string }>;
}) {
  if (!accountingEnabled() || !(await isAccountingAdmin())) redirect("/intern/finanzen/login");
  const params = await searchParams;
  const requested = Number(params.year);
  const thisYear = new Date().getFullYear();
  const year = params.year && validYear(requested) ? requested : thisYear;
  let outgoing: OutgoingInvoice[] = [];
  let incoming: IncomingInvoice[] = [];
  let dbError = false;
  try {
    ({ outgoing, incoming } = await readAccountingYear(year));
  } catch {
    dbError = true;
  }
  const months = dbError ? [] : buildMonthlyTable(year, outgoing, incoming);
  const totals = months.length ? sumMonths(months) : null;
  const showRows = outgoing.toSorted((a,b) => (b.invoice_date || "").localeCompare(a.invoice_date || ""));
  const expenses = incoming.toSorted((a,b) => b.invoice_date.localeCompare(a.invoice_date));

  return (
    <main className="min-h-screen bg-obsidian pb-24 pt-10 text-white">
      <div className="section-shell">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <Link href="/" className="text-sm text-pulse hover:text-white">← LUVIPRO Website</Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-pulse">LUVIPRO · Verwaltung</p>
            <h1 className="mt-2 font-[var(--font-space-grotesk)] text-4xl font-bold sm:text-5xl">Buchhaltung & Rechnungen</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Interne Rechnungsablage und monatliche Übersicht zu Umsatz, ausgewiesener Umsatzsteuer, Eingangsbelegen und manuell bestätigter Vorsteuer.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/intern/finanzen?year=${year - 1}`} className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10" aria-label="Vorjahr">←</Link>
            <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 font-semibold">{year}</span>
            <Link href={`/intern/finanzen?year=${year + 1}`} className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10" aria-label="Folgejahr">→</Link>
            <Link href="/intern/finanzen/affiliate" className="rounded-xl border border-pulse/40 px-4 py-2 text-sm font-semibold text-pulse hover:bg-pulse/10">Affiliate & Rabattcodes</Link>
            <a href={`/api/accounting/monthly-pdf?month=${year}-${String(new Date().getMonth()+1).padStart(2,"0")}`} className="rounded-xl border border-pulse/40 px-4 py-2 text-sm font-semibold text-pulse hover:bg-pulse/10">Monatsabrechnung PDF</a>
            <form action="/api/accounting/session" method="GET" className="hidden" />
            <a href={`/api/accounting/export?year=${year}`} className="inline-flex items-center gap-2 rounded-xl border border-pulse/40 px-4 py-2 text-sm font-semibold text-pulse hover:bg-pulse/10"><ArrowDownToLine className="h-4 w-4" /> CSV / Excel</a>
          </div>
        </div>

        {dbError ? (
          <div role="status" className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-7 text-sm leading-8 text-amber-100">
            <strong className="block text-xl">Buchhaltungsdaten noch nicht verbunden.</strong>
            Die geschützten Tabellen und die private Belegablage müssen zuerst eingerichtet und sicher getestet werden. Es werden ausdrücklich keine erfundenen Umsätze oder Steuerzahlen angezeigt.
            <p className="mt-4 text-xs">Setup: docs/sql/invoicing-schema.sql und docs/sql/bookkeeping-extension.sql. Keine Datenbankmigration wurde automatisch ausgeführt.</p>
          </div>
        ) : (
          <>
            {params.saved === "1" && <p role="status" className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">Eingangsrechnung mit Originalbeleg gespeichert.</p>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Highlight label="Ausgangsrechnungen netto" value={eur(totals!.revenueNet)} note="Nur generierte LUVIPRO-Rechnungen, unabhängig vom E-Mail-Versand" icon={TrendingUp} />
              <Highlight label="Eingangsbelege brutto" value={eur(totals!.costsGross)} note="Erfasste Lieferantenrechnungen inkl. Umsatzsteuer" icon={Receipt} />
              <Highlight label="Umsatzsteuer (Ausgang)" value={eur(totals!.revenueVat)} note="Aus den LUVIPRO-Ausgangsrechnungen" icon={FileText} />
              <Highlight label="USt-Saldo (Schätzung)" value={eur(totals!.vatBalance)} note="Ausgangs-USt minus bestätigte Vorsteuer, keine UStVA" icon={Banknote} />
            </div>

            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-widest text-pulse">Monatsübersicht</p><h2 className="mt-3 text-2xl font-bold">Januar bis Dezember {year}</h2></div>
                <ShieldCheck className="h-7 w-7 text-pulse" />
              </div>
              <div className="mt-7 overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                  <thead className="bg-white/[0.07] text-xs text-slate-300">
                    <tr>{["Monat","Anz. AR / ER","Erlöse netto","USt Ausgang","Kosten brutto","Vorsteuer bestätigt","USt-Saldo","Netto-Differenz*"].map(h=><th className="whitespace-nowrap px-4 py-4 font-semibold" key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...months,totals!].map((row,i) => (
                      <tr key={row.month} className={`border-t border-white/10 ${i === 12 ? "bg-pulse/10 font-bold text-white" : "text-slate-200 hover:bg-white/[0.025]"}`}>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold">{i === 12 ? "Gesamt" : <a className="underline decoration-pulse/50 underline-offset-4" href={`/api/accounting/monthly-pdf?month=${row.month}`} title="Monatsabrechnung als PDF herunterladen">{new Intl.DateTimeFormat("de-DE",{month:"long"}).format(new Date(Date.UTC(year,i,1)))} ↓ PDF</a>}</td>
                        <td className="px-4 py-4">{row.outgoingCount} / {row.incomingCount}</td>
                        <td className="whitespace-nowrap px-4 py-4">{eur(row.revenueNet)}</td>
                        <td className="whitespace-nowrap px-4 py-4">{eur(row.revenueVat)}</td>
                        <td className="whitespace-nowrap px-4 py-4">{eur(row.costsGross)}</td>
                        <td className="whitespace-nowrap px-4 py-4">{eur(row.inputVatConfirmed)}</td>
                        <td className={`whitespace-nowrap px-4 py-4 ${row.vatBalance < 0 ? "text-emerald-300" : "text-amber-200"}`}>{eur(row.vatBalance)}</td>
                        <td className="whitespace-nowrap px-4 py-4">{eur(row.netDifference)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs leading-6 text-amber-200">* Netto-Differenz ist kein steuerlicher Gewinn: Wareneinkauf, Bestände, Abschreibungen, Ist-/Soll-Versteuerung, Rückzahlungen und Buchungskorrekturen benötigen buchhalterische Prüfung. USt-Saldo ist eine Orientierung, keine amtliche Umsatzsteuer-Voranmeldung.</p>
            </section>

            <CashEventPanel />
            <BankTransferPanel />

            <div className="mt-10 grid gap-6 xl:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <div className="flex items-center gap-3"><FileCheck2 className="h-6 w-6 text-pulse" /><h2 className="text-2xl font-semibold">Ausgangsrechnungen</h2></div>
                <p className="mt-3 text-sm text-slate-400">{showRows.length} Belege · Eigene Verkäufe, keine Rechnungen fremder Partnerwerkstätten.</p>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[660px] text-left text-sm">
                    <thead><tr className="border-b border-white/20 text-slate-300">{["Rechnung","Datum","Kunde","Brutto","Status","PDF"].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead>
                    <tbody>{showRows.length === 0 ? <tr><td colSpan={6} className="p-5 text-slate-400">Noch keine Ausgangsrechnungen in diesem Jahr.</td></tr> : showRows.map(inv=>(
                      <tr className="border-b border-white/10" key={inv.id}>
                        <td className="whitespace-nowrap p-3 font-semibold">{inv.invoice_number}</td><td className="p-3">{dateDE(inv.invoice_date)}</td>
                        <td className="p-3">{inv.invoice_snapshot?.customer?.name || "–"}</td><td className="whitespace-nowrap p-3">{typeof inv.gross_cents === "number" ? eur(inv.gross_cents) : "–"}</td>
                        <td className="p-3 text-xs">{inv.delivery_state === "sent" ? "Versendet" : inv.delivery_state}</td>
                        <td className="p-3">{inv.delivery_state !== "reserved" ? <a className="text-pulse underline" href={`/api/accounting/documents?kind=out&id=${inv.id}`}>PDF</a> : "–"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>

              <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <div className="flex items-center gap-3"><FileClock className="h-6 w-6 text-pulse" /><h2 className="text-2xl font-semibold">Eingangsrechnungen</h2></div>
                <p className="mt-3 text-sm text-slate-400">{expenses.length} Belege · Lieferantenrechnungen mit Original-PDF/Bild.</p>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead><tr className="border-b border-white/20 text-slate-300">{["Lieferant / Belegnummer","Datum","Brutto","Vorsteuer","Status","Beleg"].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead>
                    <tbody>{expenses.length === 0 ? <tr><td colSpan={6} className="p-5 text-slate-400">Noch keine Eingangsrechnungen in diesem Jahr.</td></tr> : expenses.map(exp=>(
                      <tr className="border-b border-white/10" key={exp.id}>
                        <td className="p-3 font-semibold">{exp.supplier}<span className="block text-xs font-normal text-slate-400">{exp.supplier_invoice_number}</span></td><td className="p-3">{dateDE(exp.invoice_date)}</td>
                        <td className="whitespace-nowrap p-3">{eur(exp.gross_cents)}</td>
                        <td className="whitespace-nowrap p-3">{exp.vorsteuer_confirmed ? eur(exp.vat_cents) : "Nicht bestätigt"}</td>
                        <td className="p-3 text-xs">{exp.paid ? "Bezahlt" : "Offen"}</td>
                        <td className="p-3"><a className="text-pulse underline" href={`/api/accounting/documents?kind=in&id=${exp.id}`}>Beleg</a></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            </div>

            <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-pulse/20 bg-white/[0.045] p-6 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.19em] text-pulse">Originalbelege sicher archivieren</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Eingangsrechnung erfassen</h2>
              <p className="mb-7 mt-3 text-sm leading-7 text-slate-300">Neue Lieferantenrechnung mit zugehörigem Originalbeleg speichern. Die Dokumente sind nicht öffentlich abrufbar.</p>
              <ExpenseForm />
            </section>
          </>
        )}
        <footer className="mt-12 max-w-5xl border-t border-white/10 pt-5 text-xs leading-6 text-slate-400">
          Interne Verwaltungsübersicht. Sie ersetzt weder Finanzbuchhaltung noch Steuerberater, USt-Voranmeldung oder Jahresabschluss.
          Die USt-Berechnung setzt den geprüften Steuerstatus der jeweiligen Rechnung voraus. Firmenfremde Werkstattumsätze werden nicht als LUVIPRO-Umsatz ausgewiesen.
        </footer>
      </div>
    </main>
  );
}
