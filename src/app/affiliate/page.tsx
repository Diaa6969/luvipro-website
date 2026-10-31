import type { Metadata } from "next";
import Link from "next/link";
import { affiliateConfigured } from "@/lib/affiliate/server";
import { affiliateCurrentSession, verifyAffiliateToken } from "@/lib/affiliate/account";
import { affiliateTermsVersion } from "@/lib/affiliate/terms";
export const metadata: Metadata = { title: "Affiliate-Partner werden | LUVIPRO", description: "LUVIPRO Partnerprogramm für registrierte Unternehmen und Gewerbetreibende." };
export default async function AffiliatePage({searchParams}:{searchParams:Promise<{submitted?:string}>}) {
 const { submitted }=await searchParams;
 const token=await affiliateCurrentSession();let confirmedEmail="";if(token){try{confirmedEmail=(await verifyAffiliateToken(token)).email;}catch{}}
 const canApply=affiliateConfigured()&&!!confirmedEmail;
 const input="mt-2 w-full rounded-xl border border-white/20 bg-[#10182a] p-3 text-white outline-none focus:border-violet-400";
 return <main className="min-h-screen bg-obsidian pb-20 pt-16 text-white"><div className="section-shell max-w-4xl">
  <Link href="/" className="text-pulse">← LUVIPRO</Link>
  <p className="mt-10 text-xs font-bold uppercase tracking-widest text-pulse">LUVIPRO · Partnerprogramm</p>
  <h1 className="mt-3 text-4xl font-bold">Affiliate-Partner werden</h1>
  <div className="mt-5 rounded-xl border border-violet-400/30 bg-violet-500/10 p-5 text-sm leading-7 text-slate-200"><b>Vertragsgrundlagen:</b> Vor einer Aufnahme lesen Sie bitte die <Link href="/affiliate/agb" className="font-semibold text-pulse underline">Affiliate-Teilnahmebedingungen (AGB)</Link>. Ihre individuelle Rabatt- und Provisionsquote wird erst gesondert vereinbart. Bei vereinbarter Brutto-Provision ist eine auf Ihre Leistung anfallende Umsatzsteuer bereits im Provisionsgesamtbetrag enthalten. Ihre eigenen Ertragsteuern tragen Sie selbst.</div>
  <div className="mt-6 flex flex-wrap gap-3"><Link href="/affiliate/login" className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500">Mein Affiliate-Konto / Einnahmen</Link></div>
  <p className="mt-5 max-w-2xl leading-8 text-slate-300">Bewerben Sie sich als registriertes Unternehmen oder Gewerbetreibender. Jede Bewerbung und jede Rabattaktion wird persönlich geprüft und freigegeben. Provisionen werden nur für verifizierte Käufe nach Ablauf der maßgeblichen Widerrufs- bzw. Rückgabefrist monatlich abgerechnet. Die individuell vereinbarte Provisionsquote bezieht sich auf den Nettoverkaufspreis nach Rabatt; der Provisionsbetrag ist als gesamte Bruttovergütung einschließlich gegebenenfalls anfallender Umsatzsteuer vorgesehen. Voraussetzung ist eine ausdrückliche schriftliche Vergütungsvereinbarung. Für die eigene Gewinnbesteuerung ist der Affiliate verantwortlich.</p>
  {submitted==="1" ? <div role="status" className="mt-10 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6">Vielen Dank. Ihre Bewerbung wurde zur Prüfung aufgenommen. Eine Freigabe oder ein Rabattcode erfolgt nicht automatisch.</div> : <>
   {!affiliateConfigured() && <div role="status" className="mt-10 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6 text-amber-100">
     <strong>Online-Bewerbungen sind derzeit nicht freigeschaltet.</strong>
     <p className="mt-2 text-sm leading-7">Das Formular kann noch keine Unterlagen entgegennehmen. Bitte keine persönlichen Dokumente hochladen. Für Fragen zum gewerblichen Partnerprogramm erreichen Sie uns unter <a href="mailto:info@luvipro.de" className="font-semibold underline">info@luvipro.de</a>.</p>
   </div>}
  {!confirmedEmail&&<p className="mt-6">Bitte zuerst <Link className="text-pulse underline" href="/affiliate/login">mit dem bestehenden LUVIPRO-Konto anmelden</Link>. Customer- und Partnerrollen bleiben erhalten.</p>}
  <form action="/api/affiliate/apply" method="POST" encType="multipart/form-data" className="mt-10 grid gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:grid-cols-2 sm:p-8">
   <input type="text" name="website_check" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
   <input type="hidden" name="terms_version" value={affiliateTermsVersion}/>
   <label className="text-sm">Firma / Gewerbe *<input name="company" required maxLength={160} className={input}/></label>
   <label className="text-sm">Ansprechpartner *<input name="contact" required maxLength={160} className={input}/></label>
   <label className="text-sm">Geschäftliche E-Mail *<input type="email" name="email" readOnly value={confirmedEmail} required maxLength={200} className={input}/></label>
   <label className="text-sm">Telefon<input name="phone" maxLength={60} className={input}/></label>
   <label className="text-sm sm:col-span-2">Geschäftsanschrift *<input name="address" required maxLength={300} className={input}/></label>
   <label className="text-sm">Land *<select name="country" required className={input}><option value="DE">Deutschland</option><option value="AT">Österreich</option><option value="CH">Schweiz</option><option value="NL">Niederlande</option><option value="FR">Frankreich</option><option value="PL">Polen</option></select></label>
   <label className="text-sm">Website / Social Media<input name="social" maxLength={300} className={input}/></label>
   <label className="text-sm sm:col-span-2">Wie möchten Sie LUVIPRO bewerben?<textarea name="marketing" maxLength={1600} rows={4} className={input}/></label>
   <label className="text-sm sm:col-span-2">Gewerbeanmeldung / Handelsregister- oder gleichwertiger Gewerbenachweis * (PDF, JPG, PNG; max. 5 MB)<input type="file" name="registration" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required className="mt-3 block w-full text-sm text-slate-300"/></label>
   <label className="flex items-start gap-3 text-xs leading-6 text-slate-300 sm:col-span-2"><input type="checkbox" name="privacy" required className="mt-1 shrink-0" /><span>Ich habe die <Link href="/datenschutz" className="text-pulse underline">Datenschutzhinweise</Link> zur Verarbeitung meiner Bewerbungsangaben gelesen.</span></label>
   <label className="flex items-start gap-3 text-xs leading-6 text-slate-300 sm:col-span-2"><input type="checkbox" name="terms" required className="mt-1 shrink-0" /><span>Ich handle gewerblich, habe die <Link href="/affiliate/agb" className="text-pulse underline">Affiliate-Teilnahmebedingungen (AGB), Fassung {affiliateTermsVersion}</Link> gelesen und akzeptiere ihre Einbeziehung bei einer späteren schriftlichen Aufnahme. Mir ist bekannt: Die Bewerbung allein begründet weder eine Vertragsaufnahme noch einen Provisionsanspruch. Eine individuelle, ausdrücklich vereinbarte Brutto-Provisionsquote enthält gegebenenfalls Umsatzsteuer; für meine eigenen Ertragsteuern bin ich verantwortlich. Die individuellen Konditionen und eine mögliche Gutschriftvereinbarung werden zusätzlich gesondert bestätigt.</span></label>
   <button disabled={!canApply} type="submit" className="rounded-xl bg-violet-500 px-6 py-4 font-bold hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2">{canApply ? "Bewerbung einreichen" : "Einreichung vorübergehend deaktiviert"}</button>
  </form></>}
  <p className="mt-6 text-xs leading-6 text-slate-400">Auszahlungen nur nach dokumentiertem Zahlungseingang, Lieferung und Abschluss der Rückgabeprüfung; eine monatliche Auszahlung ist kein automatisches Leistungsversprechen. Die für die Abrechnung maßgeblichen individuellen Konditionen werden vor einer entgeltlichen Zusammenarbeit gesondert vereinbart.</p>
 </div></main>;
}
