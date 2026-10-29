import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAccountingAdmin, accountingEnabled } from "@/lib/accounting/admin-auth";
import { affiliateConfigured, affiliateDb } from "@/lib/affiliate/server";
export const dynamic="force-dynamic";
export const metadata: Metadata={title:"Affiliate Verwaltung | LUVIPRO",robots:{index:false,follow:false,nocache:true}};
type Applicant={id:string;owner_uid:string|null;company_name:string;contact_name:string;email:string;country:string;business_address:string;website:string;marketing_plan:string;status:string;created_at:string;registration_path:string;legal_agb_version:string|null;legal_agb_accepted_at:string|null;individual_agreement_ref:string;individual_agreement_accepted_at:string|null};
type Discount={id:string;code:string;affiliate_id:string;discount_bps:number;commission_bps:number;valid_from:string;valid_until:string;usage_limit:number|null;redemption_count:number;active:boolean;version:number};
export default async function AffiliateAdminPage({searchParams}:{searchParams:Promise<{ok?:string;error?:string}>}) {
 if(!accountingEnabled() || !(await isAccountingAdmin())) redirect("/intern/finanzen/login");
 const params=await searchParams;
 type Payout={id:string;affiliate_id:string;payout_month:string;status:string;amount_cents:number};
 type TaxProfile={affiliate_id:string;vat_mode:string;tax_number_or_vat_id:string;selfbilling_agreed:boolean;verified_at:string|null;legal_name:string;postal_address:string;selfbilling_agreement_reference:string};
 type TaxDoc={id:string;payout_id:string;affiliate_id:string;document_number:string;net_cents:number;vat_cents:number;gross_cents:number};
 type Transfer={payout_id:string;gross_cents:number;bank_reference:string;transferred_on:string};
 type Reminder={payout_id:string;remind_on:string;note:string;status:"open"|"cleared";updated_at:string};
 let apps:Applicant[]=[],codes:Discount[]=[],payouts:Payout[]=[],profiles:TaxProfile[]=[],docs:TaxDoc[]=[],transfers:Transfer[]=[],reminders:Reminder[]=[],error="";
 if(!affiliateConfigured()) error="Das Affiliate-Modul ist noch nicht aktiviert (AFFILIATE_APPLICATIONS_ENABLED).";
 else try {
  const [a,c,p,tx,dt,tr,rm]=await Promise.all([
   affiliateDb("luvipro_affiliate_applications?select=id,owner_uid,company_name,contact_name,email,country,business_address,website,marketing_plan,status,created_at,registration_path,legal_agb_version,legal_agb_accepted_at,individual_agreement_ref,individual_agreement_accepted_at&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_discount_codes?select=id,code,affiliate_id,discount_bps,commission_bps,valid_from,valid_until,usage_limit,redemption_count,active,version&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_affiliate_payouts?select=id,affiliate_id,payout_month,status,amount_cents&order=created_at.desc&limit=100"),
   affiliateDb("luvipro_affiliate_tax_profiles?select=affiliate_id,vat_mode,tax_number_or_vat_id,selfbilling_agreed,verified_at,legal_name,postal_address,selfbilling_agreement_reference&limit=100"),
   affiliateDb("luvipro_affiliate_settlement_documents?select=id,payout_id,affiliate_id,document_number,net_cents,vat_cents,gross_cents&limit=100"),
   affiliateDb("luvipro_affiliate_manual_transfers?select=payout_id,gross_cents,bank_reference,transferred_on&limit=100"),
   affiliateDb("luvipro_affiliate_payment_reminders?select=payout_id,remind_on,note,status,updated_at&order=remind_on.asc&limit=200")
  ]);
  apps=await a.json() as Applicant[]; codes=await c.json() as Discount[];payouts=await p.json() as Payout[];profiles=await tx.json() as TaxProfile[];docs=await dt.json() as TaxDoc[];transfers=await tr.json() as Transfer[];reminders=await rm.json() as Reminder[];
 }catch{error="Die geschützten Affiliate-Tabellen sind noch nicht erreichbar. Migration und Rechte prüfen.";}
 const input="w-full rounded-lg border border-white/15 bg-[#10182a] p-3 text-white";
 const approved=apps.filter(a=>a.status==="approved");
 return <main className="min-h-screen bg-obsidian py-14 text-white"><div className="section-shell">
  <nav className="mb-8 flex flex-wrap gap-5 text-sm text-pulse"><Link href="/intern/finanzen">← Buchhaltung</Link><Link href="/affiliate">Öffentliche Bewerbung ↗</Link><Link href="/affiliate/agb">Affiliate-AGB ↗</Link></nav>
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
    <label className="text-sm sm:col-span-2 lg:col-span-3">Beleg/Vertragsreferenz der vom Affiliate bestätigten konkreten Codekonditionen<input className={input} name="code_terms_evidence_ref" minLength={4} maxLength={200} required placeholder="Unterschriebene Provisionsanlage oder datierte Vertragsreferenz"/></label>
    <label className="flex items-start gap-3 text-xs leading-6 text-amber-100 sm:col-span-2 lg:col-span-3"><input type="checkbox" name="code_terms_confirmed" required className="mt-1"/>Der Affiliate hat den konkreten Rabatt-, Provisionssatz und Gültigkeitszeitraum nachweislich individuell bestätigt; die vereinbarte Provision ist inklusive ggf. anfallender Umsatzsteuer.</label>
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
      <input type="hidden" name="affiliate_id" value={a.id}/><input type="hidden" name="action" value="approve"/>
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
      <input type="hidden" name="affiliate_id" value={a.id}/><input type="hidden" name="action" value="reject"/>
      <p className="text-sm font-semibold text-rose-200">Bewerbung ablehnen</p>
      <label className="text-xs">Begründung<input name="review_notes" className={input} maxLength={500} placeholder="Grund"/></label>
      <button className="rounded-lg bg-rose-700 px-4 py-3 text-sm font-bold">Ablehnen</button>
     </form>
    </div>}
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
      <label className="text-xs sm:col-span-2">Referenz der schriftlich vereinbarten Verlängerung<input name="code_terms_evidence_ref" className={input} minLength={4} maxLength={200} required placeholder="Vertragsnachtrag"/></label>
      <label className="flex items-center gap-2 text-xs"><input name="code_terms_confirmed" type="checkbox" required/>Verlängerung mit Affiliate vereinbart</label>
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
      <label className="text-xs sm:col-span-2">Nachweis der individuellen Zustimmung zu diesen geänderten Bedingungen<input name="code_terms_evidence_ref" className={input} minLength={4} maxLength={200} required placeholder="Unterschriebener Nachtrag / datierter Bestätigungsbeleg"/></label>
      <label className="flex items-start gap-2 text-xs sm:col-span-2"><input name="code_terms_confirmed" required type="checkbox" className="mt-1"/>Neue Bedingungen wurden nachweislich angenommen.</label>
      <p className="text-xs leading-6 text-amber-100 sm:col-span-2">Nach einer Konditionsänderung bleibt der Code zur Sicherheit inaktiv. Frühere Provisionen und Rechnungen bleiben unverändert.</p>
      <button className="rounded-lg bg-violet-600 px-5 py-3 font-semibold sm:col-span-2">Änderungen speichern</button>
     </form>
    </details>
   </article>)}{!codes.length&&<p className="text-slate-400">Keine Rabattcodes vorhanden.</p>}</div>
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