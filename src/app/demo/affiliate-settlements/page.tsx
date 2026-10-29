"use client";
import {useState} from "react";
import Link from "next/link";
import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
const euro=(c:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(c/100);
export default function SettlementDemo(){
 const [stage,setStage]=useState<"eligible"|"prepared"|"document"|"paid">("eligible");
 const [vat,setVat]=useState<"19"|"0">("19");
 const [bankRef,setBankRef]=useState("");
 const [actualTransfer,setActualTransfer]=useState(false);
 const [message,setMessage]=useState("");
 const gross=27000; // Fixed, VAT-inclusive 10% of 2,700 € net device sale
 const net=vat==="19"?Math.round(gross/1.19):gross;
 const tax=gross-net;
 async function pdf(){
  const doc=await PDFDocument.create(),page=doc.addPage([595,842]);
  const bold=await doc.embedFont(StandardFonts.HelveticaBold),font=await doc.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({x:0,y:780,width:595,height:62,color:rgb(.11,.06,.25)});
  page.drawText("LUVIPRO · DEMO GUTSCHRIFT",{x:40,y:806,font:bold,size:17,color:rgb(1,1,1)});
  const rows=["UNGUELTIGES MUSTER – KEINE RECHNUNG, KEIN BELEG",
    "Leistender Unternehmer: Muster Werbepartner GmbH",
    "Leistungsempfaenger: LUVIPRO (Demodaten)",
    "Belegnummer: DEMO-TEST-0001",
    "Leistung: Affiliate Marketing / Vermittlung",
    "Leistungszeitraum: 01.10.2026 - 31.10.2026",
    "Netto-Provision: "+euro(net),"Umsatzsteuer ("+vat+" %): "+euro(tax),
    "Brutto: "+euro(gross),
    "Bankueberweisung: nur durch Admin extern durchzufuehren.",
    "Keine rechtswirksame Gutschrift: echte Gewerbe-/Steuerdaten fehlen."];
  rows.forEach((line,i)=>page.drawText(line,{x:40,y:740-i*48,font:i===0?bold:font,size:i===0?11:10}));
  const bytes=await doc.save();const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:"application/pdf"}));
  const a=document.createElement("a");a.href=url;a.download="LUVIPRO-Gutschrift-DEMO-nicht-gueltig.pdf";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 function pay(){
  if(!actualTransfer||bankRef.trim().length<5){setMessage("Zuerst externe Banküberweisung wirklich durchführen und Belegnummer eingeben. In dieser Demo werden keine Gelder bewegt.");return;}
  setStage("paid");setMessage("Banküberweisung nur in der Demo als abgeschlossen markiert. Kein echtes Geld und kein Datenbankeintrag.");
 }
 return <main className="min-h-screen bg-obsidian pb-24 pt-12 text-white"><div className="section-shell max-w-4xl">
  <Link href="/demo/marketing" className="text-sm text-pulse">← Zurück zu Marketing Demo</Link>
  <div className="mt-8 rounded-xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100"><b>DEMO – SYNTHETISCHE DATEN.</b> Keine echte Firma, keine Steuerrechnung, keine Bankverbindung und keine Auszahlung.</div>
  <p className="mt-10 text-xs font-bold uppercase tracking-widest text-pulse">LUVIPRO · Buchhaltung Vorschau</p>
  <h1 className="mt-2 text-4xl font-bold">Monatliche Affiliate-Auszahlung</h1>
  <p className="mt-4 leading-7 text-slate-300">Der Affiliate erhält insgesamt 10 % des Nettoverkaufspreises als Brutto-Provision inklusive gegebenenfalls anfallender Umsatzsteuer (nur bei ausdrücklicher Vertragsvereinbarung). In diesem Beispiel sind es immer 270,00 € Gesamtauszahlung: bei 19 % USt sind 226,89 € netto und 43,11 € Umsatzsteuer enthalten. Der Admin erstellt eine Gutschrift, überweist ausschließlich selbst per Bank und bestätigt erst danach den Zahlungsausgang.</p>
  <div className="mt-8 grid gap-4 sm:grid-cols-3">
   {[["Provision netto (nach USt-Aufteilung)",net],["Umsatzsteuer im Betrag enthalten",tax],["Bankauszahlung gesamt",gross]].map(([label,amount])=><div className="rounded-xl border border-white/10 bg-white/[.04] p-5" key={String(label)}><p className="text-sm text-slate-300">{label}</p><p className="mt-3 text-2xl font-bold">{euro(Number(amount))}</p></div>)}
  </div>
  <section className="mt-8 rounded-2xl border border-white/10 p-6">
   <div className="flex flex-wrap justify-between gap-4"><h2 className="text-xl font-bold">Abrechnungsstatus</h2><strong className="rounded-lg bg-white/10 px-4 py-2 text-sm">{stage}</strong></div>
   <label className="mt-6 block text-sm">Steuerstatus des Affiliates (nur Beispiel)
   <select disabled={stage==="paid"} value={vat} onChange={e=>setVat(e.target.value as "19"|"0")} className="mt-2 block w-full rounded-xl border border-white/10 bg-[#151d31] p-4">
    <option value="19">19 % Umsatzsteuer – Regelfall DE</option><option value="0">0 % – geprüfter Kleinunternehmer § 19 UStG</option>
   </select></label>
   <div className="mt-6 flex flex-wrap gap-3">
    <button disabled={stage!=="eligible"} onClick={()=>setStage("prepared")} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:opacity-40">1. Abrechnung vorbereiten</button>
    <button disabled={stage!=="prepared"} onClick={()=>setStage("document")} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:opacity-40">2. Gutschrift ausstellen</button>
    <button disabled={stage==="eligible"||stage==="prepared"} onClick={pdf} className="rounded-xl border border-white/20 px-5 py-3 font-semibold disabled:opacity-40">Demo-Gutschrift PDF ↓</button>
   </div>
   {stage==="document"&&<div className="mt-7 grid gap-5 rounded-xl border border-white/10 p-5">
    <h3 className="font-bold">3. Externe manuelle Überweisung nachweisen</h3>
    <p className="text-sm leading-6 text-amber-100">LUVIPRO löst hier KEINE Überweisung aus. Admin muss den Bruttobetrag {euro(gross)} bei seiner Bank selbst überweisen.</p>
    <label className="text-sm">Bankreferenz / Verwendungszweck<input value={bankRef} onChange={e=>setBankRef(e.target.value)} className="mt-2 block w-full rounded-xl border border-white/20 bg-[#151d31] p-3" placeholder="DEMO-TRANSFER-0001"/></label>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={actualTransfer} onChange={e=>setActualTransfer(e.target.checked)}/>Externe Bankzahlung vom Admin bestätigt (in dieser Demo rein hypothetisch).</label>
    <button onClick={pay} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold">✓ Admin bestätigt: Überweisung ist erfolgt</button>
   </div>}
   {stage==="paid"&&<div className="mt-7 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">Auszahlung dokumentiert (nur Demo). Bankreferenz: {bankRef}. Originale Rechnungen, Gutschriften und Buchungssätze müssen im Live-System unveränderbar archiviert werden.</div>}
   {message&&<p role="status" className="mt-5 text-sm text-amber-100">{message}</p>}
   <button onClick={()=>{setStage("eligible");setBankRef("");setActualTransfer(false);setMessage("");}} className="mt-6 text-sm text-slate-300 underline">Demo zurücksetzen</button>
  </section>
 </div></main>;
}