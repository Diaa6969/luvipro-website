import type { Metadata } from "next";
import Link from "next/link";
import { affiliateBackendConfigured } from "@/lib/affiliate/server";
export const metadata:Metadata={title:"Affiliate Login | LUVIPRO",robots:{index:false,follow:false,nocache:true}};
export const dynamic="force-dynamic";
export default async function AffiliateLogin({searchParams}:{searchParams:Promise<{error?:string}>}){
 const params=await searchParams,enabled=affiliateBackendConfigured();
 return <main className="min-h-screen bg-obsidian px-5 pb-24 pt-14 text-white"><div className="mx-auto max-w-xl">
  <Link href="/affiliate" className="text-pulse">← Affiliate-Programm</Link>
  <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
   <p className="text-xs font-semibold uppercase tracking-widest text-pulse">LUVIPRO Partnerkonto</p>
   <h1 className="mt-3 text-3xl font-bold">Mit vorhandenem Konto anmelden</h1>
   <p className="mt-4 text-sm leading-7 text-slate-300">Nutzen Sie dieselbe E-Mail-Adresse und dasselbe Passwort wie in der LUVIPRO App – egal ob Sie Privatkunde oder Werkstattpartner sind. Es wird kein zweites Konto angelegt. Ihr Affiliate-Bereich wird nach der Gewerbeprüfung mit Ihrem bestehenden Konto verknüpft.</p>
   {!enabled&&<p role="status" className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">Der echte Kontozugriff ist noch nicht freigeschaltet. <Link href="/demo/marketing" className="underline">Interaktive Demo ausprobieren.</Link></p>}
   {params.error==="1"&&<p role="alert" className="mt-5 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-100">Anmeldung nicht möglich. Bitte Zugangsdaten, bestätigte E-Mail-Adresse und Gewerbe-Freigabe prüfen.</p>}
   <form action="/api/affiliate/session" method="POST" className="mt-7 space-y-5">
    <label className="block text-sm">E-Mail-Adresse<input required disabled={!enabled} autoComplete="email" type="email" name="email" maxLength={200} className="mt-2 block w-full rounded-xl border border-white/15 bg-[#10182a] p-3 text-white"/></label>
    <label className="block text-sm">Passwort<input required disabled={!enabled} autoComplete="current-password" type="password" name="password" maxLength={256} className="mt-2 block w-full rounded-xl border border-white/15 bg-[#10182a] p-3 text-white"/></label>
    <button disabled={!enabled} className="w-full rounded-xl bg-violet-600 p-4 font-bold disabled:cursor-not-allowed disabled:opacity-40">Mein Affiliate-Konto öffnen</button>
   </form>
   <p className="mt-5 text-xs text-slate-400">Bitte beachten Sie die <Link href="/affiliate/agb" className="text-pulse underline">Affiliate-Teilnahmebedingungen</Link>. Noch nicht für Affiliate freigegeben? <Link href="/affiliate" className="text-pulse underline">Gewerbe-Nachweis einreichen.</Link> Bestehende Nutzer- und Werkstattfunktionen bleiben unverändert.</p>
  </div>
 </div></main>;
}