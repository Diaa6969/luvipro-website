import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { affiliateAccountSummary,affiliateCurrentSession } from "@/lib/affiliate/account";
import { affiliateConfigured } from "@/lib/affiliate/server";
import { AffiliateLogoutButton } from "@/components/affiliate/logout-button";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Meine Provisionen | LUVIPRO Affiliate",robots:{index:false,follow:false,nocache:true}};
const eur=(cents:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(cents/100);
export default async function Dashboard(){
 if(!affiliateConfigured())redirect("/affiliate/login");
 const session=await affiliateCurrentSession();if(!session)redirect("/affiliate/login");
 let summary:Awaited<ReturnType<typeof affiliateAccountSummary>>;
 try{summary=await affiliateAccountSummary(session);}
 catch{redirect("/affiliate/login?error=1");}
 const {owner,codes,commissions,payouts,documents,totals}=summary;
 return <main className="min-h-screen bg-obsidian pb-24 pt-12 text-white"><div className="section-shell max-w-6xl">
  <header className="flex flex-wrap items-start justify-between gap-5">
   <div><Link href="/affiliate" className="text-sm text-pulse">← Affiliate-Programm</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-pulse">LUVIPRO · Partnerkonto</p><h1 className="mt-2 text-4xl font-bold">Meine Affiliate-Einnahmen</h1><p className="mt-3 text-slate-300">{owner.company_name} · {owner.email}</p></div>
   <div className="flex flex-wrap items-center gap-3"><Link href="/affiliate/agb" className="rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">Affiliate AGB</Link><AffiliateLogoutButton/></div>
  </header>
  <div className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">Gewerbe geprüft · Affiliate-Funktion mit Ihrem bestehenden LUVIPRO-Konto verbunden. Keine Änderung Ihrer Rolle als Kunde oder Partnerwerkstatt.</div>
  <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {[["Offene Provisionen",totals.pending,"Noch nicht freigegeben"],["Freigegeben",totals.eligible,"Nach dokumentierter Wartezeit"],["Zugeordnet gesamt",totals.pending+totals.eligible+totals.paid,"Noch nicht alles endgültig verdient"],["Ausbezahlt",totals.payoutsPaid,"Bestätigte Monatsauszahlungen"]].map(([title,value,desc])=><article key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5"><p className="text-sm text-slate-300">{title}</p><p className="mt-4 text-3xl font-bold text-white">{eur(Number(value))}</p><p className="mt-3 text-xs text-slate-400">{desc}</p></article>)}
  </section>
  <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-2xl font-bold">Meine Rabattcodes</h2>
   <div className="mt-5 grid gap-4 md:grid-cols-2">{codes.length?codes.map(c=><article key={c.id} className="rounded-xl border border-white/10 p-4"><p className="font-bold text-pulse">{c.code}</p><p className="mt-2 text-sm">{c.discount_bps/100}% Kundenrabatt · {c.commission_bps/100}% Provision</p><p className="mt-1 text-xs text-slate-300">Gültig: {c.valid_from} bis {c.valid_until} · Einlösungen {c.redemption_count}/{c.usage_limit??"∞"}</p><p className="mt-2 text-sm">{c.active?"Aktiv":"Pausiert / nicht freigeschaltet"}</p></article>):<p className="text-slate-400">Noch keine Codes zugewiesen.</p>}</div>
  </section>
  <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-2xl font-bold">Einzelne Provisionen</h2>
   <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead><tr className="border-b border-white/20"><th className="p-3">Datum</th><th className="p-3">Provision</th><th className="p-3">Status</th></tr></thead><tbody>{commissions.map(c=><tr key={c.id} className="border-b border-white/10"><td className="p-3">{c.created_at.slice(0,10)}</td><td className="p-3">{eur(c.commission_cents)}</td><td className="p-3">{c.status}</td></tr>)}</tbody></table>{!commissions.length&&<p className="p-4 text-slate-400">Noch keine Verkäufe zugeordnet.</p>}</div>
  </section>
  <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-2xl font-bold">Monatliche Auszahlungen</h2>
   <div className="mt-5 space-y-3">{payouts.map(p=><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-3 text-sm" key={p.id}><span>{p.payout_month}</span><span>{eur(p.amount_cents)}</span><span>{p.status==="paid"?"Ausgezahlt":"In Bearbeitung"}</span>{documents.filter(d=>d.payout_id===p.id).map(d=><a key={d.id} className="text-pulse underline" href={`/api/affiliate/gutschrift?id=${d.id}`}>Gutschrift ${d.document_number} · USt ${eur(d.vat_cents)} · Brutto ${eur(d.gross_cents)} (PDF) ↓</a>)}{p.status==="paid"&&<a href={`/api/affiliate/payout-pdf?id=${p.id}`} className="text-pulse underline">Zahlungsbeleg PDF ↓</a>}</div>)}{!payouts.length&&<p className="text-slate-400">Noch keine Monatsauszahlungen.</p>}</div>
   <p className="mt-5 text-xs leading-6 text-slate-400">Monatliche Auszahlung ausschließlich bei nachweislich bezahltem und geliefertem Kauf nach Ablauf der relevanten Rückgabe-/Widerrufsfrist. Auszahlung erfolgt durch LUVIPRO; keine selbstständige Überweisung.</p>
  </section>
 </div></main>;
}