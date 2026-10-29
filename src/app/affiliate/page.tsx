import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Affiliate-Partner werden | LUVIPRO", description: "LUVIPRO Partnerprogramm für registrierte Unternehmen und Gewerbetreibende." };
export default async function AffiliatePage({searchParams}:{searchParams:Promise<{submitted?:string}>}) {
 const { submitted }=await searchParams;
 const input="mt-2 w-full rounded-xl border border-white/20 bg-[#10182a] p-3 text-white outline-none focus:border-violet-400";
 return <main className="min-h-screen bg-obsidian pb-20 pt-16 text-white"><div className="section-shell max-w-4xl">
  <Link href="/" className="text-pulse">← LUVIPRO</Link>
  <p className="mt-10 text-xs font-bold uppercase tracking-widest text-pulse">LUVIPRO · Partnerprogramm</p>
  <h1 className="mt-3 text-4xl font-bold">Affiliate-Partner werden</h1>
  <p className="mt-5 max-w-2xl leading-8 text-slate-300">Bewerben Sie sich als registriertes Unternehmen oder Gewerbetreibender. Jede Bewerbung und jede Rabattaktion wird persönlich geprüft und freigegeben. Provisionen werden nur für verifizierte Käufe nach Ablauf der maßgeblichen Widerrufs- bzw. Rückgabefrist monatlich abgerechnet.</p>
  {submitted==="1" ? <div role="status" className="mt-10 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6">Vielen Dank. Ihre Bewerbung wurde zur Prüfung aufgenommen. Eine Freigabe oder ein Rabattcode erfolgt nicht automatisch.</div> : 
  <form action="/api/affiliate/apply" method="POST" encType="multipart/form-data" className="mt-10 grid gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:grid-cols-2 sm:p-8">
   <input type="text" name="website_check" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
   <label className="text-sm">Firma / Gewerbe *<input name="company" required maxLength={160} className={input}/></label>
   <label className="text-sm">Ansprechpartner *<input name="contact" required maxLength={160} className={input}/></label>
   <label className="text-sm">Geschäftliche E-Mail *<input type="email" name="email" required maxLength={200} className={input}/></label>
   <label className="text-sm">Telefon<input name="phone" maxLength={60} className={input}/></label>
   <label className="text-sm sm:col-span-2">Geschäftsanschrift *<input name="address" required maxLength={300} className={input}/></label>
   <label className="text-sm">Land *<select name="country" required className={input}><option value="DE">Deutschland</option><option value="AT">Österreich</option><option value="CH">Schweiz</option><option value="NL">Niederlande</option><option value="FR">Frankreich</option><option value="PL">Polen</option><option value="OTHER">Anderes Land (bitte anfragen)</option></select></label>
   <label className="text-sm">Website / Social Media<input name="social" maxLength={300} className={input}/></label>
   <label className="text-sm sm:col-span-2">Wie möchten Sie LUVIPRO bewerben?<textarea name="marketing" maxLength={1600} rows={4} className={input}/></label>
   <label className="text-sm sm:col-span-2">Gewerbeanmeldung / Handelsregister- oder gleichwertiger Gewerbenachweis * (PDF, JPG, PNG; max. 5 MB)<input type="file" name="registration" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required className="mt-3 block w-full text-sm text-slate-300"/></label>
   <label className="flex items-start gap-3 text-xs leading-6 text-slate-300 sm:col-span-2"><input type="checkbox" name="privacy" required className="mt-1" />Ich habe die <Link href="/datenschutz" className="text-pulse underline">Datenschutzhinweise</Link> zur Bewerbung gelesen und bin mit der Verarbeitung meiner Bewerbungsangaben einverstanden.</label>
   <label className="flex items-start gap-3 text-xs leading-6 text-slate-300 sm:col-span-2"><input type="checkbox" name="terms" required className="mt-1" />Ich bestätige, dass ich über eine gültige gewerbliche Registrierung verfüge. Die Bewerbung begründet keinen Anspruch auf Aufnahme, Rabattcodes oder Provisionen. Die Teilnahmebedingungen werden vor Freigabe vereinbart.</label>
   <button type="submit" className="rounded-xl bg-violet-500 px-6 py-4 font-bold hover:bg-violet-400 sm:col-span-2">Bewerbung einreichen</button>
  </form>}
  <p className="mt-6 text-xs leading-6 text-slate-400">Auszahlungen nur nach dokumentiertem Zahlungseingang, Lieferung und Abschluss der Rückgabeprüfung; eine monatliche Auszahlung ist kein automatisches Leistungsversprechen. Das Programm ist derzeit an die Freischaltung der Bewerbungs- und Abrechnungsfunktionen gebunden.</p>
 </div></main>;
}