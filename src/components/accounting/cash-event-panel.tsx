"use client";
import {useState,type FormEvent} from "react";
export function CashEventPanel() {
 const [message,setMessage]=useState(""),[pending,setPending]=useState(false);
 const input="mt-1 w-full rounded-lg border border-white/20 bg-[#10182a] p-2 text-white";
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault(); const f=e.currentTarget; setPending(true);setMessage("");
  try {
   const r=await fetch("/api/accounting/cash-events",{method:"POST",body:new FormData(f)});
   const data=await r.json() as {error?:string};
   if(!r.ok) throw new Error(data.error||"Buchung fehlgeschlagen");
   f.reset();setMessage("Kassen-/Bankbewegung erfasst. Bitte im Monats-PDF kontrollieren.");
  }catch(err){setMessage(err instanceof Error?err.message:"Fehler");}finally{setPending(false);}
 }
 return <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
 <h2 className="text-2xl font-bold">Weitere Geldbewegungen · Kassenbuch</h2>
 <p className="mt-3 max-w-3xl text-xs leading-6 text-amber-100">Nur Vorgänge, die noch NICHT in Ausgangsrechnungen oder Eingangsbelegen erfasst sind. Keine doppelte Buchung von Rechnungszahlungen. Eine falsche Erfassung ist durch Storno-/Gegenbuchung zu korrigieren, nicht durch Löschen.</p>
 <form className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
  <label className="text-xs">Buchungsdatum<input className={input} type="date" name="eventDate" required/></label>
  <label className="text-xs">Geldfluss<select name="direction" className={input}><option value="in">Einnahme</option><option value="out">Ausgabe</option></select></label>
  <label className="text-xs">Kategorie<select name="category" className={input}>
   <option value="other_sales">Weitere Einnahme</option><option value="other_operating_cost">Weitere Betriebsausgabe</option><option value="bank_fee">Bankgebühr</option><option value="tax">Steuerzahlung</option><option value="refund">Erstattung / Rückzahlung</option><option value="capital">Einlage / Eigenkapital</option><option value="loan">Darlehenseingang</option><option value="loan_repayment">Darlehenstilgung</option><option value="asset">Anlagevermögen</option><option value="affiliate">Affiliate-Auszahlung</option><option value="transfer">Umbuchung</option><option value="other">Sonstiges</option>
  </select></label>
  <label className="text-xs">Bruttobetrag EUR<input className={input} type="text" name="gross" placeholder="29,99" required/></label>
  <label className="text-xs">USt-Anteil (nur bei klarer Zuordnung)<select name="vatRate" className={input}><option value="0">0 % / keine</option><option value="7">7 %</option><option value="19">19 %</option></select></label>
  <label className="text-xs">Gegenpartei<input className={input} name="counterparty" maxLength={160}/></label>
  <label className="text-xs">Beleg- / Zahlungsreferenz<input className={input} name="reference" maxLength={160}/></label>
  <label className="text-xs">Originalbeleg (PDF/JPG/PNG, optional)<input className={input} type="file" name="receipt" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"/></label>
  <label className="text-xs sm:col-span-2 lg:col-span-3">Beschreibung / Buchungsgrund<input name="description" className={input} required maxLength={500}/></label>
  <button type="submit" disabled={pending} className="rounded-lg bg-violet-600 p-3 font-semibold disabled:opacity-50">Geldbewegung speichern</button>
 </form>
 {message&&<p role="status" className="mt-3 text-sm text-amber-200">{message}</p>}
 </section>;
}
