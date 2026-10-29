import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAccountingAdmin, accountingEnabled } from "@/lib/accounting/admin-auth";
import { affiliateConfigured, affiliateDb } from "@/lib/affiliate/server";
export const dynamic="force-dynamic";
export const metadata: Metadata={title:"Affiliate Verwaltung | LUVIPRO",robots:{index:false,follow:false,nocache:true}};
type Applicant={id:string;company_name:string;contact_name:string;email:string;country:string;business_address:string;website:string;marketing_plan:string;status:string;created_at:string;registration_path:string};
type Discount={id:string;code:string;affiliate_id:string;discount_bps:number;commission_bps:number;valid_from:string;valid_until:string;usage_limit:number|null;redemption_count:number;active:boolean;version:number};
export default async function AffiliateAdminPage({searchParams}:{searchParams:Promise<{ok?:string}>}) {
 if(!accountingEnabled() || !(await isAccountingAdmin())) redirect("/intern/finanzen/login");
 const params=await searchParams;
 let apps:Applicant[]=[],codes:Discount[]=[],payouts:{id:string;affiliate_id:string;payout_month:string;status:string;amount_cents:number}[]=[],error="";
 if(!affiliateConfigured()) error="Das Affiliate-Modul ist noch nicht aktiviert (AFFILIATE_APPLICATIONS_ENABLED).";
 else try {
  const [a,c,p]=await Promise.all([
   affiliateDb("luvipro_affiliate_applications?select=id,company_name,contact_name,email,country,business_address,website,marketing_plan,status,created_at,registration_path&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_discount_codes?select=id,code,affiliate_id,discount_bps,commission_bps,valid_from,valid_until,usage_limit,redemption_count,active,version&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_affiliate_payouts?select=id,affiliate_id,payout_month,status,amount_cents&order=created_at.desc&limit=100")
  ]);
  apps=await a.json() as Applicant[]; codes=await c.json() as Discount[];payouts=await p.json() as typeof payouts;
 }catch{error="Die geschützten Affiliate-Tabellen sind noch nicht erreichbar. Migration und Rechte prüfen.";}
 const input="w-full rounded-lg border border-white/15 bg-[#10182a] p-3 text-white";
 const approved=apps.filter(a=>a.status==="approved");
 return <main className="min-h-screen bg-obsidian py-14 text-white"><div className="section-shell">
  <nav className="mb-8 flex flex-wrap gap-5 text-sm text-pulse"><Link href="/intern/finanzen">← Buchhaltung</Link><Link href="/affiliate">Öffentliche Bewerbung ↗</Link></nav>
  <h1 className="text-4xl font-bold">Marketing & Affiliate Management</h1>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Nur die Verwaltung vergibt Rabattcodes nach persönlicher Prüfung des Gewerbenachweises. Rabattcodes sind noch nicht mit der Bezahlkasse verbunden.</p>
  {params.ok==="1"&&<p role="status" className="mt-6 rounded-lg bg-emerald-900/30 p-4 text-emerald-200">Änderung gespeichert.</p>}
  {params.error==="1"&&<p role="alert" className="mt-5 rounded-lg bg-rose-500/10 p-4 text-rose-200">Aktion nicht ausgeführt. Bitte Ablaufdatum, Berechtigung oder veraltete Daten prüfen und neu laden.</p>}
  {error&&<p role="alert" className="mt-6 rounded-lg bg-amber-900/30 p-4 text-amber-100">{error}</p>}
  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Neuen Rabattcode manuell anlegen</h2>
   <form action="/api/accounting/affiliate" method="POST" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <input type="hidden" name="action" value="create_code"/>
    <label>Freigegebener Partner<select className={input} name="affiliate_id" required><option value="">Partner auswählen</option>{approved.map(a=><option key={a.id} value={a.id}>{a.company_name} — {a.contact_name}</option>)}</select></label>
    <label>Rabattcode<input className={input} name="code" pattern="[A-Z0-9][A-Z0-9_-]{3,31}" placeholder="MAX10" required maxLength={32}/></label>
    <label>Kundenrabatt %<input className={input} type="number" name="discount" min="0" max="100" step="0.01" required defaultValue="10"/></label>
    <label>Provision %<input className={input} type="number" name="commission" min="0" max="100" step="0.01" required defaultValue="10"/></label>
    <label>Gültig ab<input className={input} type="date" name="valid_from" required/></label>
    <label>Gültig bis<input className={input} type="date" name="valid_until" required/></label>
    <label>Max. Einlösungen (optional)<input className={input} name="usage_limit" type="number" min="1" step="1"/></label>
    <p className="text-xs leading-6 text-amber-200 sm:col-span-2">Aus Sicherheitsgründen bleibt der Code zunächst inaktiv, bis Checkout-Validierung und Zahlungsnachweise angebunden und getestet sind. Eine Aktivierung erfolgt getrennt.</p>
    <button disabled={!approved.length||!!error} className="rounded-lg bg-violet-600 px-6 py-3 font-bold disabled:opacity-40">Code speichern</button>
   </form>
  </section>
  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Gewerbe-Bewerbungen ({apps.length})</h2>
   <div className="mt-5 space-y-5">{apps.map(a=><article key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{a.company_name} · {a.contact_name}</p><span className="rounded bg-white/10 px-3 py-1 text-xs">{a.status}</span></div>
    <p className="mt-2 break-words text-sm text-slate-300">{a.email} · {a.country} · {a.business_address}</p>
    <p className="mt-2 break-words text-sm text-slate-400">{a.website} {a.marketing_plan}</p>
    <a className="mt-3 inline-block text-sm text-pulse underline" href={`/api/accounting/affiliate/document?id=${a.id}&format=pdf`}>Gewerbenachweis geschützt ansehen / herunterladen</a>
    {a.status==="pending"&&<form action="/api/accounting/affiliate" method="POST" className="mt-5 flex flex-wrap items-center gap-3">
     <input type="hidden" name="affiliate_id" value={a.id}/>
     <input className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm" name="review_notes" maxLength={500} placeholder="Prüfvermerk / Ablehnungsgrund" aria-label="Prüfvermerk"/>
     <button name="action" value="approve" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold">Gewerbe geprüft · Genehmigen</button>
     <button name="action" value="reject" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold">Ablehnen</button>
    </form>}
   </article>)}
   {!apps.length&&!error&&<p className="text-slate-400">Noch keine Anträge.</p>}</div>
  </section>
  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Rabattcodes verwalten ({codes.length})</h2>
   <p className="mt-3 text-sm leading-7 text-slate-300">Codes jederzeit pausieren, Laufzeit verlängern oder Konditionen ändern. Änderungen gelten nur für künftige Verkäufe und werden protokolliert. Benutzte Codes können nicht umbenannt werden. Aktivierung ist erst möglich, wenn die sichere Checkout-Rabattprüfung einsatzbereit ist.</p>
   <div className="mt-7 grid gap-5 xl:grid-cols-2">{codes.map(c=><article key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <div className="flex flex-wrap justify-between gap-4"><div>
     <h3 className="text-xl font-bold text-pulse">{c.code}</h3>
     <p className="mt-1 text-sm text-slate-300">{apps.find(a=>a.id===c.affiliate_id)?.company_name??"Partner"} · {c.discount_bps/100}% Rabatt · {c.commission_bps/100}% Provision</p>
     <p className="mt-1 text-xs text-slate-400">{c.valid_from} – {c.valid_until} · {c.redemption_count}/{c.usage_limit??"∞"} Einlösungen</p>
    </div><span className={`h-fit rounded-lg px-3 py-2 text-xs font-semibold ${c.active?"bg-emerald-700/30 text-emerald-200":"bg-amber-600/20 text-amber-100"}`}>{c.active?"Aktiv":"Pausiert / inaktiv"}</span></div>
    <div className="mt-5 flex flex-wrap gap-3">
     {c.active ? <form action="/api/accounting/affiliate" method="POST">
      <input type="hidden" name="action" value="pause_code"/><input type="hidden" name="code_id" value={c.id}/><input type="hidden" name="expected_version" value={c.version}/>
      <button className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold">Sofort deaktivieren</button>
     </form>:<form action="/api/accounting/affiliate" method="POST">
      <input type="hidden" name="action" value="resume_code"/><input type="hidden" name="code_id" value={c.id}/><input type="hidden" name="expected_version" value={c.version}/>
      <button disabled={process.env.AFFILIATE_COUPON_REDEMPTION_ENABLED!=="true"} title="Nur nach geprüfter Checkout-Integration" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">Wieder aktivieren</button>
     </form>}
    </div>
    <details className="mt-5 rounded-lg border border-white/10 p-4"><summary className="cursor-pointer font-semibold">Gültigkeit verlängern</summary>
     <form action="/api/accounting/affiliate" method="POST" className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="action" value="renew_code"/><input type="hidden" name="code_id" value={c.id}/><input type="hidden" name="expected_version" value={c.version}/>
      <label className="text-sm">Neues Ablaufdatum<input type="date" name="valid_until" min={c.valid_until} defaultValue={c.valid_until} className={input} required/></label>
      <button className="rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold">Verlängern</button>
     </form>
    </details>
    <details className="mt-3 rounded-lg border border-white/10 p-4"><summary className="cursor-pointer font-semibold">Code / Konditionen bearbeiten</summary>
     <form action="/api/accounting/affiliate" method="POST" className="mt-5 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="action" value="edit_code"/><input type="hidden" name="code_id" value={c.id}/><input type="hidden" name="expected_version" value={c.version}/>
      <label className="text-xs">Rabattcode<input className={input} name="code" defaultValue={c.code} required pattern="[A-Z0-9][A-Z0-9_-]{3,31}" maxLength={32} readOnly={c.redemption_count>0}/></label>
      <label className="text-xs">Max. Einlösungen<input className={input} name="usage_limit" min={Math.max(1,c.redemption_count)} type="number" defaultValue={c.usage_limit??""} placeholder="Unbegrenzt"/></label>
      <label className="text-xs">Rabatt %<input className={input} name="discount" required type="number" min="0" max="100" step=".01" defaultValue={c.discount_bps/100}/></label>
      <label className="text-xs">Provision %<input className={input} name="commission" required type="number" min="0" max="100" step=".01" defaultValue={c.commission_bps/100}/></label>
      <label className="text-xs">Gültig ab<input className={input} name="valid_from" required type="date" defaultValue={c.valid_from} readOnly={c.redemption_count>0}/></label>
      <label className="text-xs">Gültig bis<input className={input} name="valid_until" required type="date" defaultValue={c.valid_until}/></label>
      <p className="text-xs leading-6 text-amber-100 sm:col-span-2">Nach einer Konditionsänderung bleibt der Code zur Sicherheit inaktiv. Frühere Provisionen und Rechnungen bleiben unverändert.</p>
      <button className="rounded-lg bg-violet-600 px-5 py-3 font-semibold sm:col-span-2">Änderungen speichern</button>
     </form>
    </details>
   </article>)}{!codes.length&&<p className="text-slate-400">Keine Rabattcodes vorhanden.</p>}</div>
  </section>
  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Monatliche Affiliate-Abrechnungen</h2>
   <p className="mt-3 text-sm text-slate-400">Nur dokumentierte Auszahlungsperioden; die PDF-Abrechnung ist ein Nachweis und ersetzt keine ordnungsgemäße Provisionsrechnung.</p>
   <div className="mt-4 space-y-3">{payouts.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-3 border-b border-white/10 py-3 text-sm">
    <span>{apps.find(a=>a.id===p.affiliate_id)?.company_name || p.affiliate_id} · {p.payout_month}</span>
    <span>{new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(p.amount_cents/100)} · {p.status}</span>
    <a className="text-pulse underline" href={`/api/accounting/affiliate/payout-pdf?id=${p.id}`}>Abrechnung PDF ↓</a>
   </div>)}
   {!payouts.length&&<p className="text-sm text-slate-400">Noch keine Monatsabrechnungen.</p>}</div>
  </section>
 </div></main>;
}