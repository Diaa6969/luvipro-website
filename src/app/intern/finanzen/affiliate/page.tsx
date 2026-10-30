import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAccountingAdmin } from "@/lib/accounting/admin-auth";
import { isAffiliatePageAdmin } from "@/lib/affiliate/admin-access";
import { affiliateBackendConfigured, affiliateDb } from "@/lib/affiliate/server";
import { AffiliatePromoManager,type PromoCode } from "@/components/accounting/affiliate-promo-manager";
export const dynamic="force-dynamic";
export const metadata: Metadata={title:"Affiliate Verwaltung | LUVIPRO",robots:{index:false,follow:false,nocache:true}};
type Applicant={registration_verified_at:string|null;review_revision:number;id:string;owner_uid:string|null;company_name:string;contact_name:string;email:string;country:string;business_address:string;website:string;marketing_plan:string;status:string;created_at:string;registration_path:string;legal_agb_version:string|null;legal_agb_accepted_at:string|null;individual_agreement_ref:string;individual_agreement_accepted_at:string|null};

export default async function AffiliateAdminPage({searchParams}:{searchParams:Promise<{ok?:string;error?:string}>}) {
 if(!(await isAffiliatePageAdmin())) redirect("/affiliate/login");
 const legacyFinanceAdmin=await isAccountingAdmin();
 const params=await searchParams;
 type Payout={id:string;affiliate_id:string;payout_month:string;status:string;amount_cents:number};
 type TaxProfile={affiliate_id:string;vat_mode:string;tax_number_or_vat_id:string;selfbilling_agreed:boolean;verified_at:string|null;legal_name:string;postal_address:string;selfbilling_agreement_reference:string};
 type TaxDoc={id:string;payout_id:string;affiliate_id:string;document_number:string;net_cents:number;vat_cents:number;gross_cents:number};
 type Transfer={payout_id:string;gross_cents:number;bank_reference:string;transferred_on:string};
 type Reminder={payout_id:string;remind_on:string;note:string;status:"open"|"cleared";updated_at:string};
 let apps:Applicant[]=[],codes:PromoCode[]=[],payouts:Payout[]=[],profiles:TaxProfile[]=[],docs:TaxDoc[]=[],transfers:Transfer[]=[],reminders:Reminder[]=[],error="";
 if(!affiliateBackendConfigured()) error="Die gesicherte Affiliate-Anbindung ist noch nicht konfiguriert.";
 else try {
  const [a,c,p,tx,dt,tr,rm]=await Promise.all([
   affiliateDb("luvipro_affiliate_applications?select=registration_verified_at,review_revision,id,owner_uid,company_name,contact_name,email,country,business_address,website,marketing_plan,status,created_at,registration_path,legal_agb_version,legal_agb_accepted_at,individual_agreement_ref,individual_agreement_accepted_at&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_discount_codes?select=*,rules:luvipro_promo_rules(*)&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_affiliate_payouts?select=id,affiliate_id,payout_month,status,amount_cents&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_affiliate_tax_profiles?select=affiliate_id,vat_mode,tax_number_or_vat_id,selfbilling_agreed,verified_at,legal_name,postal_address,selfbilling_agreement_reference&limit=100"),
   affiliateDb("luvipro_affiliate_settlement_documents?select=id,payout_id,affiliate_id,document_number,net_cents,vat_cents,gross_cents&limit=100"),
   affiliateDb("luvipro_affiliate_manual_transfers?select=payout_id,gross_cents,bank_reference,transferred_on&limit=100"),
   affiliateDb("luvipro_affiliate_payment_reminders?select=payout_id,remind_on,note,status,updated_at&order=remind_on.asc&limit=200")
  ]);
  apps=await a.json() as Applicant[]; codes=await c.json() as PromoCode[];payouts=await p.json() as Payout[];profiles=await tx.json() as TaxProfile[];docs=await dt.json() as TaxDoc[];transfers=await tr.json() as Transfer[];reminders=await rm.json() as Reminder[];
 }catch{error="Die geschützten Affiliate-Tabellen sind noch nicht erreichbar. Migration und Rechte prüfen.";}
 const input="w-full rounded-lg border border-white/15 bg-[#10182a] p-3 text-white";
 const approved=apps.filter(a=>a.status==="approved");
 return <main className="min-h-screen bg-obsidian py-14 text-white"><div className="section-shell">
  <nav className="mb-8 flex flex-wrap gap-5 text-sm text-pulse"><Link href="/affiliate">← Affiliate-Programm</Link>{legacyFinanceAdmin&&<Link href="/intern/finanzen">Buchhaltung</Link>}<Link href="/affiliate">Öffentliche Bewerbung ↗</Link><Link href="/affiliate/agb">Affiliate-AGB ↗</Link></nav>
  <h1 className="text-4xl font-bold">Marketing & Affiliate Management</h1>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Nur die Verwaltung vergibt Rabattcodes nach persönlicher Prüfung des Gewerbenachweises. Preisprüfung und Bestellzuordnung nutzen die gemeinsame Datenbank. Zahlungsdienste bleiben separat deaktiviert.</p>
  {params.ok==="1"&&<p role="status" className="mt-6 rounded-lg bg-emerald-900/30 p-4 text-emerald-200">Änderung gespeichert.</p>}
  {params.error==="1"&&<p role="alert" className="mt-5 rounded-lg bg-rose-500/10 p-4 text-rose-200">Aktion nicht ausgeführt. Bitte Ablaufdatum, Berechtigung oder veraltete Daten prüfen und neu laden.</p>}
  {error&&<p role="alert" className="mt-6 rounded-lg bg-amber-900/30 p-4 text-amber-100">{error}</p>}
  <AffiliatePromoManager codes={codes} affiliates={apps} disabled={!!error}/>
  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Gewerbe-Bewerbungen ({apps.length})</h2>
   <div className="mt-5 space-y-5">{apps.map(a=><article key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{a.company_name} · {a.contact_name}</p><span className="rounded bg-white/10 px-3 py-1 text-xs">{a.status}</span></div>
    <p className="mt-2 break-words text-sm text-slate-300">{a.email} · {a.country} · {a.business_address}</p>
    <p className="mt-2 break-words text-sm text-slate-400">{a.website} {a.marketing_plan}</p>
    <a className="mt-3 inline-block text-sm text-pulse underline" href={`/api/accounting/affiliate/document?id=${a.id}&format=pdf`}>Gewerbenachweis geschützt ansehen / herunterladen</a>
    {a.status==="approved"&&<div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
     <p className="text-sm font-semibold text-emerald-100">Bestehendes LUVIPRO-Konto verbinden</p>
     <p className="mt-2 text-xs leading-6 text-slate-300">Kundenkonto oder Partnerwerkstatt bleibt erhalten, inklusive aller bisherigen Rechte und Daten. Affiliate wird über dieselbe Supabase Auth-ID ergänzt. Falls die Konto-E-Mail mit der geprüften Affiliate-E-Mail identisch ist, kann der Nutzer die Verbindung selbst vornehmen.</p>
     {a.owner_uid?<p className="mt-3 text-sm text-emerald-200">Verbunden mit Auth-Benutzer: {a.owner_uid}</p>:<form action="/api/accounting/affiliate" method="POST" className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="action" value="link_existing_account"/>
      <input type="hidden" name="affiliate_id" value={a.id}/>
      <label className="text-xs">Bestehende Auth User UUID (Kunde oder Werkstatt)<input name="owner_uid" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" pattern="[0-9a-fA-F-]{36}" required className={input}/></label>
      <label className="flex items-start gap-2 text-xs leading-6 text-slate-200"><input required type="checkbox" name="identity_verified" className="mt-1"/>Ich habe den Gewerbenachweis und die tatsächliche Zuordnung dieser vorhandenen Benutzer-ID persönlich verifiziert. Bestehende Rollen werden nicht geändert.</label>
      <button className="self-start rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold">Vorhandenes Konto verknüpfen</button>
     </form>}
    </div>}
    <p className="mt-3 text-xs text-slate-400">AGB-Fassung: {a.legal_agb_version||"Kein digitaler Nachweis"} · Bestätigt am: {a.legal_agb_accepted_at?.slice(0,10)||"—"} {a.individual_agreement_accepted_at?"· Einzelvereinbarung bestätigt: "+a.individual_agreement_ref:""}</p>
    {a.status==="pending"&&<div className="mt-5 grid gap-4 lg:grid-cols-2">
     <form action="/api/accounting/affiliate" method="POST" className="grid gap-3 rounded-lg border border-emerald-400/20 p-4">
      <input type="hidden" name="affiliate_id" value={a.id}/><input type="hidden" name="action" value="approve"/><input type="hidden" name="review_revision" value={a.review_revision}/>
      <p className="text-sm font-semibold text-emerald-200">Gewerbe und individuelle Affiliate-Vereinbarung freigeben</p>
      <label className="text-xs">Schriftlich bestätigte Provisionsvereinbarung / Vertragsreferenz
        <input name="individual_agreement_ref" className={input} required minLength={4} maxLength={200} placeholder="Unterschriebener Vertrag, Datum, Dokument-ID"/>
      </label>
      <label className="text-xs">Prüfnotiz<input name="review_notes" className={input} maxLength={500} placeholder="Gewerbe / Vertreter / Dokument geprüft"/></label>
      <label className="flex items-start gap-2 text-xs leading-6 text-slate-200"><input type="checkbox" name="individual_agreement_confirmed" required className="mt-1"/>Der Affiliate hat die individuelle Vereinbarung nachweislich angenommen; der Gewerbenachweis wurde überprüft.</label>
      <label className="flex items-start gap-2 text-xs leading-6 text-slate-200"><input type="checkbox" name="gross_inclusive_terms" required className="mt-1"/>Die Brutto-Provisionsvergütung inklusive gegebenenfalls anfallender Umsatzsteuer wurde ausdrücklich vereinbart.</label>
      <button disabled={!a.legal_agb_accepted_at} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold disabled:opacity-40">Gewerbe und Vertrag geprüft · Genehmigen</button>
     </form>
     <form action="/api/accounting/affiliate" method="POST" className="grid content-start gap-3 rounded-lg border border-rose-400/20 p-4">
      <input type="hidden" name="affiliate_id" value={a.id}/><input type="hidden" name="action" value="reject"/><input type="hidden" name="review_revision" value={a.review_revision}/>
      <p className="text-sm font-semibold text-rose-200">Bewerbung ablehnen</p>
      <label className="text-xs">Öffentliche Begründung<input name="applicant_message" required minLength={5} className={input} maxLength={500} placeholder="Grund"/></label>
      <button className="rounded-lg bg-rose-700 px-4 py-3 text-sm font-bold">Ablehnen</button>
     </form>
    </div>}
   </article>)}
   {!apps.length&&!error&&<p className="text-slate-400">Noch keine Anträge.</p>}</div>
  </section>

  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Steuerprofil & Gutschriftvereinbarung</h2>
   <p className="mt-3 text-sm leading-7 text-amber-100">Provision = festgelegter Prozentsatz vom Nettoverkaufspreis (nach Rabatt) als Bruttogesamtvergütung inklusive gegebenenfalls anfallender Umsatzsteuer – nur mit ausdrücklicher schriftlicher Vereinbarung. Der Affiliate versteuert seinen Gewinn selbst. Beispiel 270,00 € Gesamtprovision bei 19 % USt: 226,89 € netto + 43,11 € USt = 270,00 € Auszahlung; Kleinunternehmer: 270,00 € ohne ausgewiesene USt. Gutschriftverfahren nach § 14 UStG nur mit vorheriger schriftlicher Einigung. EU-/Auslandsfälle und ungeklärte Steuertatbestände bleiben gesperrt.</p>
   <div className="mt-6 grid gap-6 lg:grid-cols-2">{approved.map(a=>{
    const profile=profiles.find(p=>p.affiliate_id===a.id);
    return <form key={a.id} action="/api/accounting/affiliate/settlements" method="POST" className="grid gap-3 rounded-xl border border-white/10 bg-white/[.03] p-5 sm:grid-cols-2">
     <input type="hidden" name="action" value="save_tax"/>
     <input type="hidden" name="affiliate_id" value={a.id}/>
     <h3 className="font-semibold sm:col-span-2">{a.company_name}</h3>
     <label className="text-xs sm:col-span-2">Rechtlicher Name des leistenden Unternehmers<input name="legal_name" defaultValue={profile?.legal_name||a.company_name} required maxLength={180} className={input}/></label>
     <label className="text-xs sm:col-span-2">Vollständige Geschäftsanschrift<input name="postal_address" defaultValue={profile?.postal_address||a.business_address} required maxLength={400} className={input}/></label>
     <label className="text-xs sm:col-span-2">Steuernummer oder USt-IdNr. des Affiliates<input name="tax_number_or_vat_id" defaultValue={profile?.tax_number_or_vat_id||""} required maxLength={50} className={input}/></label>
     <label className="text-xs sm:col-span-2">Überprüfte Umsatzsteuer-Eigenschaft<select name="vat_mode" defaultValue={profile?.vat_mode||"de_19"} className={input}>
       <option value="de_19">DE regulär – 19 % USt auf Provision</option>
       <option value="de_kleinunternehmer">DE Kleinunternehmer (§ 19 UStG) – 0 %</option>
      </select></label>
     <label className="text-xs sm:col-span-2">Schriftliche Gutschriftvereinbarung (Dokument-Referenz)<input name="agreement_ref" required maxLength={160} className={input} defaultValue={profile?.selfbilling_agreement_reference||""} placeholder="Vertrag / datierte Vereinbarung"/></label>
     <label className="flex gap-2 text-xs leading-5 sm:col-span-2"><input type="checkbox" name="selfbilling_agreed" required className="mt-1"/>Der Affiliate hat VOR Ausstellung der Gutschrift der Selbstabrechnung nachweislich zugestimmt.</label>
     <label className="flex gap-2 text-xs leading-5 sm:col-span-2"><input type="checkbox" name="gross_inclusive_agreed" required className="mt-1"/>Die Provisionsvereinbarung bestimmt ausdrücklich: Provisionssatz auf Nettoverkaufspreis = endgültiger Brutto-Auszahlungsbetrag einschließlich ggf. anfallender USt; keine USt zusätzlich zu zahlen.</label>
     <label className="flex gap-2 text-xs leading-5 sm:col-span-2"><input type="checkbox" name="reviewed" required className="mt-1"/>Identität, Gewerbe, steuerliche Behandlung und Vereinbarung persönlich verifiziert.</label>
     <button className="rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold sm:col-span-2">Steuerprofil geprüft speichern</button>
     {profile&&<p className="text-xs text-emerald-100 sm:col-span-2">Verifiziert: {profile.verified_at?.slice(0,10)||"—"} · {profile.vat_mode}</p>}
    </form>;
   })}</div>
  </section>
  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Manuelle Auszahlung – keine automatische Überweisung</h2>
   <div className="mt-5 grid gap-3 sm:grid-cols-3">
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"><p className="text-xs text-amber-100">Offene Auszahlungen</p><p className="mt-2 text-2xl font-bold">{payouts.filter(p=>p.status==="prepared"&&!transfers.some(t=>t.payout_id===p.id)).length}</p></div>
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4"><p className="text-xs text-rose-100">Erinnerung fällig / überfällig</p><p className="mt-2 text-2xl font-bold">{reminders.filter(r=>r.status==="open" && r.remind_on <= new Date().toISOString().slice(0,10) && payouts.some(p=>p.id===r.payout_id && p.status==="prepared")).length}</p></div>
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"><p className="text-xs text-emerald-100">Zahlungen bestätigt</p><p className="mt-2 text-2xl font-bold">{transfers.length}</p></div>
   </div>
   <p className="mt-3 text-sm leading-7 text-slate-300">1. Nur verifizierte/abgelaufene Provisionen zum Monatsabschluss vorbereiten. 2. Rechtssichere Gutschrift nach geprüftem Steuerprofil ausstellen. 3. Banküberweisung AUSSERHALB der Anwendung persönlich ausführen. 4. Erst danach Referenz und Datum erfassen. Alle Schritte erhalten einen unveränderbaren Prüfpfad. Kein Stripe-/PayPal-/Bank-Payout wird durch einen Klick hier ausgelöst.</p>
   <form action="/api/accounting/affiliate/settlements" method="POST" className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 p-4">
    <input type="hidden" name="action" value="prepare"/>
    <label className="text-xs">Freigegebener Affiliate<select name="affiliate_id" required className={input}><option value="">Partner wählen</option>{approved.map(a=><option key={a.id} value={a.id}>{a.company_name}</option>)}</select></label>
    <label className="text-xs">Abrechnungsmonat (1. des Monats)<input type="date" name="month" required className={input} defaultValue={new Date().toISOString().slice(0,7)+"-01"}/></label>
    <button className="rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold">Monatsabschluss vorbereiten</button>
   </form>
   <p className="mt-3 text-xs text-amber-100">Ein Abrechnungsmonat pro Affiliate ist einzigartig; bereits zugeordnete Provisionen können nicht ein zweites Mal abgerechnet werden.</p>
  </section>
  <section className="mt-12 rounded-2xl border border-white/10 p-6">
   <h2 className="text-2xl font-bold">Monatliche Affiliate-Abrechnungen</h2>
   <p className="mt-3 text-sm text-slate-400">Nur dokumentierte Auszahlungsperioden; die PDF-Abrechnung ist ein Nachweis und ersetzt keine ordnungsgemäße Provisionsrechnung.</p>
   <div className="mt-4 space-y-3">{payouts.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-3 border-b border-white/10 py-3 text-sm">
    <span>{apps.find(a=>a.id===p.affiliate_id)?.company_name || p.affiliate_id} · {p.payout_month}</span>
    <span>Provision gesamt (inkl. ggf. USt): {new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(p.amount_cents/100)} · {p.status}</span>
    {p.status==="prepared" && <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${reminders.some(r=>r.payout_id===p.id&&r.status==="open"&&r.remind_on<=new Date().toISOString().slice(0,10))?"bg-rose-700/30 text-rose-100":"bg-amber-700/20 text-amber-100"}`}>{reminders.some(r=>r.payout_id===p.id&&r.status==="open"&&r.remind_on<=new Date().toISOString().slice(0,10))?"🔔 Zahlungserinnerung fällig":"⏳ Zahlung offen"}</span>}
    {p.status==="prepared" && <form action="/api/accounting/affiliate/settlements" method="POST" className="grid w-full gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:grid-cols-3">
      <input type="hidden" name="action" value="set_reminder"/>
      <input type="hidden" name="payout_id" value={p.id}/>
      <label className="text-xs">Zahlung erinnern am<input type="date" name="remind_on" required className={input} defaultValue={reminders.find(r=>r.payout_id===p.id)?.remind_on||new Date().toISOString().slice(0,10)}/></label>
      <label className="text-xs sm:col-span-2">Notiz (optional)<input name="note" maxLength={300} className={input} defaultValue={reminders.find(r=>r.payout_id===p.id)?.note||""} placeholder="Bank prüfen / Zahlung manuell ausführen"/></label>
      <button className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold sm:col-span-3">🔔 Zahlungserinnerung speichern / ändern</button>
    </form>}
    <a className="text-pulse underline" href={`/api/accounting/affiliate/payout-pdf?id=${p.id}`}>Interne Abrechnung PDF ↓</a>
    {docs.find(d=>d.payout_id===p.id)?<div className="w-full rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-4">
      {docs.filter(d=>d.payout_id===p.id).map(d=><div key={d.id} className="flex flex-wrap justify-between gap-3">
       <span>Gutschrift {d.document_number} · Netto {new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(d.net_cents/100)} + USt {new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(d.vat_cents/100)} = Brutto {new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(d.gross_cents/100)}</span>
       <a className="text-pulse underline" href={`/api/affiliate/gutschrift?id=${d.id}`}>Gutschrift PDF ↓</a>
      </div>)}
      {transfers.find(t=>t.payout_id===p.id)?
       <p className="mt-3 text-xs text-emerald-100">Banküberweisung nachgewiesen: {transfers.find(t=>t.payout_id===p.id)?.transferred_on} · Referenz {transfers.find(t=>t.payout_id===p.id)?.bank_reference}</p>:
       <form action="/api/accounting/affiliate/settlements" method="POST" className="mt-5 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="action" value="mark_manual_paid"/>
        <input type="hidden" name="payout_id" value={p.id}/>
        <label className="text-xs">Banküberweisung tatsächlich erfolgt am<input className={input} type="date" name="paid_on" required/></label>
        <label className="text-xs">Eindeutige Bankreferenz / Transaktions-ID<input className={input} name="payment_reference" minLength={5} maxLength={200} required/></label>
        <label className="text-xs sm:col-span-2 flex items-start gap-2"><input type="checkbox" name="bank_transfer_done" required className="mt-1"/>Ich habe die Überweisung persönlich außerhalb von LUVIPRO ausgeführt.</label>
        <label className="text-xs sm:col-span-2 flex items-start gap-2"><input type="checkbox" name="evidence_checked" required className="mt-1"/>Bankbeleg, Betrag inklusive Umsatzsteuer und Gutschrift geprüft.</label>
        <button className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold sm:col-span-2">✓ Admin bestätigt: Überweisung ist erfolgt</button>
       </form>}
     </div>:
     <form className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-amber-500/20 p-4" action="/api/accounting/affiliate/settlements" method="POST">
      <input type="hidden" name="action" value="issue_gutschrift"/><input type="hidden" name="payout_id" value={p.id}/>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="terms_approved" required/>Steuerprofil und Gutschriftvereinbarung überprüft</label>
      <button disabled={p.status!=="prepared"} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold disabled:opacity-40">Gutschrift mit USt erstellen</button>
     </form>}
   </div>)}
   {!payouts.length&&<p className="text-sm text-slate-400">Noch keine Monatsabrechnungen.</p>}</div>
  </section>
 </div></main>;
}