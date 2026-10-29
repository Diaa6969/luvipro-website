import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAccountingAdmin, accountingEnabled } from "@/lib/accounting/admin-auth";
import { affiliateConfigured, affiliateDb } from "@/lib/affiliate/server";
export const dynamic="force-dynamic";
export const metadata: Metadata={title:"Affiliate Verwaltung | LUVIPRO",robots:{index:false,follow:false,nocache:true}};
type Applicant={id:string;company_name:string;contact_name:string;email:string;country:string;business_address:string;website:string;marketing_plan:string;status:string;created_at:string;registration_path:string};
type Discount={id:string;code:string;affiliate_id:string;discount_bps:number;commission_bps:number;valid_from:string;valid_until:string;usage_limit:number|null;redemption_count:number;active:boolean};
export default async function AffiliateAdminPage({searchParams}:{searchParams:Promise<{ok?:string}>}) {
 if(!accountingEnabled() || !(await isAccountingAdmin())) redirect("/intern/finanzen/login");
 const params=await searchParams;
 let apps:Applicant[]=[],codes:Discount[]=[],error="";
 if(!affiliateConfigured()) error="Das Affiliate-Modul ist noch nicht aktiviert (AFFILIATE_APPLICATIONS_ENABLED).";
 else try {
  const [a,c]=await Promise.all([
   affiliateDb("luvipro_affiliate_applications?select=id,company_name,contact_name,email,country,business_address,website,marketing_plan,status,created_at,registration_path&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_discount_codes?select=id,code,affiliate_id,discount_bps,commission_bps,valid_from,valid_until,usage_limit,redemption_count,active&order=created_at.desc&limit=100")
  ]);
  apps=await a.json() as Applicant[]; codes=await c.json() as Discount[];
 }catch{error="Die geschützten Affiliate-Tabellen sind noch nicht erreichbar. Migration und Rechte prüfen.";}
 const input="w-full rounded-lg border border-white/15 bg-[#10182a] p-3 text-white";
 const approved=apps.filter(a=>a.status==="approved");
 return <main className="min-h-screen bg-obsidian py-14 text-white"><div className="section-shell">
  <nav className="mb-8 flex flex-wrap gap-5 text-sm text-pulse"><Link href="/intern/finanzen">← Buchhaltung</Link><Link href="/affiliate">Öffentliche Bewerbung ↗</Link></nav>
  <h1 className="text-4xl font-bold">Marketing & Affiliate Management</h1>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Nur die Verwaltung vergibt Rabattcodes nach persönlicher Prüfung des Gewerbenachweises. Rabattcodes sind noch nicht mit der Bezahlkasse verbunden.</p>
  {params.ok==="1"&&<p role="status" className="mt-6 rounded-lg bg-emerald-900/30 p-4 text-emerald-200">Änderung gespeichert.</p>}
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
    <a className="mt-3 inline-block text-sm text-pulse underline" href={`/api/accounting/affiliate/document?id=${a.id}`}>Gewerbenachweis geschützt ansehen / herunterladen</a>
    {a.status==="pending"&&<form action="/api/accounting/affiliate" method="POST" className="mt-5 flex flex-wrap items-center gap-3">
     <input type="hidden" name="affiliate_id" value={a.id}/>
     <input className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm" name="review_notes" maxLength={500} placeholder="Prüfvermerk / Ablehnungsgrund" aria-label="Prüfvermerk"/>
     <button name="action" value="approve" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold">Gewerbe geprüft · Genehmigen</button>
     <button name="action" value="reject" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold">Ablehnen</button>
    </form>}
   </article>)}
   {!apps.length&&!error&&<p className="text-slate-400">Noch keine Anträge.</p>}</div>
  </section>
  <section className="mt-12 rounded-2xl border border-white/10 p-6"><h2 className="text-2xl font-bold">Rabattcodes ({codes.length})</h2>
   <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-white/20">{["Code","Rabatt","Provision","Gültigkeit","Nutzung","Status"].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead>
   <tbody>{codes.map(c=><tr className="border-b border-white/10" key={c.id}>
    <td className="p-3 font-semibold">{c.code}</td><td className="p-3">{c.discount_bps/100}%</td><td className="p-3">{c.commission_bps/100}%</td><td className="p-3">{c.valid_from} – {c.valid_until}</td><td className="p-3">{c.redemption_count}/{c.usage_limit??"∞"}</td><td className="p-3">{c.active?"Aktiv":"Nicht aktiviert"}</td>
   </tr>)}</tbody></table></div>
  </section>
 </div></main>;
}