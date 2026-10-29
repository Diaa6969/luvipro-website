"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Applicant={id:number;company:string;contact:string;status:"pending"|"approved"|"rejected"};
type Discount={code:string;discount:number;commission:number;start:string;end:string;affiliate:string;active:boolean};
const examples:Applicant[]=[{id:1,company:"Muster Werkstatt GmbH",contact:"Max Muster",status:"pending"},{id:2,company:"UV Media Handel",contact:"Beispiel Partner",status:"approved"}];
const money=(v:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
export default function MarketingDemo(){
 const [tab,setTab]=useState<"requests"|"codes"|"finance"|"payouts"|"account">("requests");
 const [apps,setApps]=useState<Applicant[]>(examples);
 const [codes,setCodes]=useState<Discount[]>([{code:"TEST10",discount:10,commission:10,start:"2026-11-01",end:"2026-12-31",affiliate:"UV Media Handel",active:false}]);
 const [feedback,setFeedback]=useState("");
 const [saving,setSaving]=useState(false);
 const [accountType,setAccountType]=useState<"kunde"|"werkstatt">("werkstatt");
 const yearMonth="2026-10";
 const approved=apps.filter(x=>x.status==="approved");
 const monthly=useMemo(()=>({sales:6000,costs:840,vat:1140,pendingAffiliate:540}),[]);
 function change(id:number,status:Applicant["status"]){
  setApps(a=>a.map(x=>x.id===id?{...x,status}:x));
  setFeedback("Änderung nur in dieser Demo gespeichert – keine realen Kundendaten verändert.");
 }
 function createCode(data:FormData) {
  const code=String(data.get("code")||"").toUpperCase().trim();
  const discount=Number(data.get("discount")), commission=Number(data.get("commission"));
  const start=String(data.get("start")),end=String(data.get("end")),affiliate=String(data.get("affiliate"));
  if(!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code)||codes.some(x=>x.code===code)||discount<0||discount>100||commission<0||commission>100||end<start||!affiliate){
   setFeedback("Bitte gültigen, noch nicht verwendeten Code und Einstellungen eingeben.");return;
  }
  setCodes(v=>[{code,discount,commission,start,end,affiliate,active:false},...v]);
  setFeedback("Testcode lokal erstellt. Nicht in Datenbank/Shop aktiv.");
 }
 function modifyCode(original:string,action:"toggle"|"renew"|"edit",values?:FormData){
  const item=codes.find(c=>c.code===original);
  if(!item)return;
  if(action==="toggle"){
   setCodes(prev=>prev.map(c=>c.code===original?{...c,active:!c.active}:c));
   setFeedback("Code-Status nur in dieser Demo geändert. Im echten System erfordert Aktivierung freigeschalteten Checkout.");
   return;
  }
  if(action==="renew"){
   const date=String(values?.get("end")||"");
   if(!/^20\\d{2}-\\d{2}-\\d{2}$/.test(date)||date<item.end){setFeedback("Neues Ablaufdatum muss gleich oder später sein.");return;}
   setCodes(prev=>prev.map(c=>c.code===original?{...c,end:date}:c));setFeedback("Testcode verlängert.");return;
  }
  const code=String(values?.get("code")||"").trim().toUpperCase();
  const discount=Number(values?.get("discount")),commission=Number(values?.get("commission"));
  const start=String(values?.get("start")||""),end=String(values?.get("end")||"");
  if(!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code)||codes.some(c=>c.code===code&&c.code!==original)||
     !Number.isFinite(discount)||!Number.isFinite(commission)||discount<0||discount>100||commission<0||commission>100||end<start){
    setFeedback("Ungültige Einstellungen.");return;
  }
  setCodes(prev=>prev.map(c=>c.code===original?{...c,code,discount,commission,start,end,active:false}:c));
  setFeedback("Änderungen gespeichert. Der Code ist bis zur erneuten Freigabe pausiert (Demo).");
 }
 async function saveDemoPdf(){
  setSaving(true);try{
   const doc=await PDFDocument.create();doc.setTitle("LUVIPRO DEMO Monatsabrechnung");
   const p=doc.addPage([595,842]);const font=await doc.embedFont(StandardFonts.Helvetica);const bold=await doc.embedFont(StandardFonts.HelveticaBold);
   p.drawRectangle({x:0,y:774,width:595,height:68,color:rgb(.11,.07,.23)});
   p.drawText("LUVIPRO – MONATSABRECHNUNG",{x:44,y:800,size:18,font:bold,color:rgb(1,1,1)});
   p.drawText("DEMO – KEINE REALEN BUCHUNGEN / KEIN STEUERDOKUMENT",{x:44,y:744,size:10,font:bold});
   const lines=[`Monat: ${yearMonth}`,`Erloese netto: ${money(monthly.sales)}`,`Ausgaben: ${money(monthly.costs)}`,`Umsatzsteuer (Beispiel): ${money(monthly.vat)}`,`Affiliate Provisionen offen: ${money(monthly.pendingAffiliate)}`,"Alle Angaben sind rein synthetisch.","Keine echten Rechnungen, Zahlungen oder Steuerberechnungen."];
   lines.forEach((line,i)=>p.drawText(line,{x:44,y:689-i*36,size:12,font}));
   const bytes=await doc.save();const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:"application/pdf"}));
   const a=document.createElement("a");a.href=url;a.download="LUVIPRO-DEMO-Monatsabrechnung-2026-10.pdf";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch{setFeedback("Demo PDF konnte nicht erzeugt werden.");}finally{setSaving(false);}
 }
 const tabs=[["requests","Bewerbungen"],["codes","Rabattcodes"],["finance","Buchhaltung"],["payouts","Provisionen"],["account","Mein Affiliate-Konto"]] as const;
 return <main className="min-h-screen bg-obsidian pb-24 pt-12 text-white"><div className="section-shell max-w-6xl">
  <Link href="/" className="text-sm text-pulse">← LUVIPRO</Link>
  <div className="mt-8 rounded-xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-100"><strong>INTERAKTIVE TESTANSICHT · SYNTHETISCHE DATEN.</strong> Keine Verbindung zu echten Bewerbungen, Rechnungen, Zahlungen oder Bankkonten. Änderungen bleiben nur bis zum Neuladen dieser Seite sichtbar.</div>
  <div className="mt-8 flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-pulse">LUVIPRO ADMIN · VORSCHAU</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Marketing & Buchhaltung</h1><p className="mt-3 text-sm text-slate-400">So wird das Verwaltungsmodul nach der sicheren Aktivierung aussehen.</p></div><Link href="/affiliate" className="self-start rounded-xl border border-white/20 px-5 py-3 text-sm hover:bg-white/10">Zur Affiliate-Seite ↗</Link></div>
  <div className="mt-8 flex flex-wrap gap-2">{tabs.map(([key,label])=><button key={key} onClick={()=>{setTab(key);setFeedback("");}} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${tab===key?"bg-violet-600 text-white":"border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"}`}>{label}</button>)}</div>
  {feedback&&<p role="status" className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4 text-sm">{feedback}</p>}
  {tab==="requests"&&<section className="mt-6 space-y-4"><h2 className="text-xl font-bold">Affiliate-Anträge · Gewerbeprüfung</h2>{apps.map(a=><article key={a.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="font-semibold">{a.company}</p><p className="mt-1 text-sm text-slate-300">{a.contact}</p><p className="mt-2 text-xs text-slate-400">Gewerbenachweis: Musterdatei – nicht herunterladbar</p></div><span className="h-fit rounded-full bg-white/10 px-3 py-1 text-xs">{a.status}</span></div>{a.status==="pending"&&<div className="mt-5 flex gap-3"><button onClick={()=>change(a.id,"approved")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm">Annehmen (Demo)</button><button onClick={()=>change(a.id,"rejected")} className="rounded-lg bg-red-700 px-4 py-2 text-sm">Ablehnen (Demo)</button></div>}</article>)}</section>}
  {tab==="codes"&&<section className="mt-6 grid gap-6 lg:grid-cols-2"><form onSubmit={e=>{e.preventDefault();createCode(new FormData(e.currentTarget));e.currentTarget.reset();}} className="space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="text-xl font-bold">Rabattcode manuell erstellen</h2><label className="block text-sm">Freigegebener Affiliate<select name="affiliate" className="mt-1 w-full rounded-xl bg-[#172038] p-3 text-white" required><option value="">Partner auswählen</option>{approved.map(a=><option key={a.id}>{a.company}</option>)}</select></label><label className="block text-sm">Rabattcode<input name="code" required placeholder="PARTNER10" className="mt-1 w-full rounded-xl bg-[#172038] p-3 uppercase text-white"/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">Kundenrabatt %<input type="number" name="discount" min="0" max="100" step=".01" defaultValue="10" required className="mt-1 w-full rounded-xl bg-[#172038] p-3"/></label><label className="text-sm">Provision %<input type="number" name="commission" min="0" max="100" step=".01" defaultValue="10" required className="mt-1 w-full rounded-xl bg-[#172038] p-3"/></label><label className="text-sm">Gültig ab<input name="start" type="date" defaultValue="2026-11-01" required className="mt-1 w-full rounded-xl bg-[#172038] p-3"/></label><label className="text-sm">Gültig bis<input name="end" type="date" defaultValue="2026-12-31" required className="mt-1 w-full rounded-xl bg-[#172038] p-3"/></label></div><button className="rounded-xl bg-violet-600 px-5 py-3 font-semibold">Testcode erzeugen</button></form><div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="text-xl font-bold">Rabattcodes · Vorschau</h2>{codes.map(c=><div className="mt-4 rounded-xl border border-white/10 p-4" key={c.code}><p className="font-bold text-pulse">{c.code} <span className="ml-2 text-xs font-normal text-amber-200">{c.active?"Aktiv (Demo)":"Pausiert"}</span></p><p className="mt-1 text-sm text-slate-300">{c.affiliate}</p><p className="mt-2 text-sm">{c.discount}% Kundenrabatt · {c.commission}% Provision</p><p className="mt-1 text-xs text-slate-400">{c.start} – {c.end}</p>
<div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>modifyCode(c.code,"toggle")} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold">{c.active?"Deaktivieren":"Aktivieren"}</button></div>
<details className="mt-4 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm font-semibold">Gültigkeit verlängern</summary>
<form className="mt-4 flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();modifyCode(c.code,"renew",new FormData(e.currentTarget));}}>
<input type="date" name="end" defaultValue={c.end} min={c.end} required className="rounded-lg bg-[#172038] p-2 text-sm"/><button className="rounded-lg bg-violet-600 px-3 py-2 text-sm">Verlängern</button></form>
</details>
<details className="mt-3 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm font-semibold">Rabattcode bearbeiten</summary>
<form onSubmit={e=>{e.preventDefault();modifyCode(c.code,"edit",new FormData(e.currentTarget));}} className="mt-4 grid gap-3 sm:grid-cols-2">
<label className="text-xs">Code<input name="code" defaultValue={c.code} required className="mt-1 w-full rounded-lg bg-[#172038] p-2"/></label>
<label className="text-xs">Rabatt %<input name="discount" type="number" min="0" max="100" step=".01" defaultValue={c.discount} required className="mt-1 w-full rounded-lg bg-[#172038] p-2"/></label>
<label className="text-xs">Provision %<input name="commission" type="number" min="0" max="100" step=".01" defaultValue={c.commission} required className="mt-1 w-full rounded-lg bg-[#172038] p-2"/></label>
<label className="text-xs">Gültig ab<input name="start" type="date" defaultValue={c.start} required className="mt-1 w-full rounded-lg bg-[#172038] p-2"/></label>
<label className="text-xs">Gültig bis<input name="end" type="date" defaultValue={c.end} required className="mt-1 w-full rounded-lg bg-[#172038] p-2"/></label>
<button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold sm:col-span-2">Änderungen speichern</button></form>
</details>
</div>)}</div></section>}
  {tab==="finance"&&<section className="mt-6"><h2 className="text-xl font-bold">Buchhaltung · {yearMonth}</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{[["Erlöse netto",monthly.sales],["Ausgaben",monthly.costs],["USt Beispiel",monthly.vat]].map(([label,value])=><article key={label} className="rounded-xl border border-white/10 bg-white/[.04] p-6"><p className="text-sm text-slate-300">{label}</p><p className="mt-3 text-2xl font-bold">{money(Number(value))}</p></article>)}</div><button disabled={saving} onClick={saveDemoPdf} className="mt-6 rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:opacity-50">Monatsabrechnung als DEMO-PDF herunterladen</button><p className="mt-4 text-sm text-slate-400">Im Live-Modul werden Ausgangsrechnungen, Eingangsbelege, weitere Geldbewegungen und Provisionen als getrennte Positionen angezeigt.</p></section>}
  {tab==="payouts"&&<section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-6"><h2 className="text-xl font-bold">Monatliche Provisionen</h2><p className="mt-4 text-sm leading-7 text-slate-300">Beispiel: Eine bezahlte Gerätelieferung mit 10 % Rabatt und 10 % Partnerprovision ergibt 270 € Provision (bei 3.000 € Netto-Listenpreis). Der Betrag wird erst nach dokumentierter Zahlung, Lieferung und Ablauf der anwendbaren Rückgabefrist freigegeben.</p><div className="mt-5 flex flex-wrap gap-4"><span className="rounded-xl bg-white/10 px-5 py-4">Offen: {money(540)}</span><span className="rounded-xl bg-white/10 px-5 py-4">Auszahlung: monatlich</span><span className="rounded-xl bg-white/10 px-5 py-4">Keine echte Überweisung</span></div></section>}
{tab==="account"&&<section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-6">
<h2 className="text-2xl font-bold">Ein Konto – zusätzliche Affiliate-Funktionen</h2>
<p className="mt-3 text-sm leading-7 text-slate-300">Das ursprüngliche LUVIPRO-Konto bleibt bestehen. Dieselbe Auth-ID nutzt alle bisherigen Funktionen und zusätzlich das Affiliate-Dashboard nach Gewerbe-Freigabe. Keine Registrierung eines zweiten Nutzers erforderlich.</p>
<div className="mt-5 flex flex-wrap gap-3">
<button onClick={()=>setAccountType("kunde")} className={`rounded-xl px-4 py-3 text-sm ${accountType==="kunde"?"bg-violet-600":"border border-white/20"}`}>Kundenkonto + Affiliate</button>
<button onClick={()=>setAccountType("werkstatt")} className={`rounded-xl px-4 py-3 text-sm ${accountType==="werkstatt"?"bg-violet-600":"border border-white/20"}`}>Werkstattkonto + Affiliate</button></div>
<div className="mt-6 rounded-xl border border-white/10 p-5">
<p className="text-xl font-bold">UV Media Handel · Gewerbe bestätigt</p>
<p className="mt-2 text-sm text-slate-300">Bestehende Rolle: {accountType==="kunde"?"Kunde":"Partnerwerkstatt"} · Zusätzliche Funktion: Affiliate</p>
<div className="mt-5 grid gap-3 sm:grid-cols-3">
{[["Offene Provisionen",540],["Freigegeben",270],["Ausgezahlt",270]].map(([label,amount])=><div key={String(label)} className="rounded-xl bg-white/[.05] p-5"><p className="text-sm text-slate-300">{label}</p><p className="mt-3 text-2xl font-bold">{money(Number(amount))}</p></div>)}
</div><h3 className="mt-6 text-lg font-bold">Meine Rabattcodes</h3>{codes.filter(c=>c.affiliate==="UV Media Handel").map(c=><p className="mt-2 text-sm" key={c.code}>{c.code} · {c.commission}% Provision · {c.active?"Aktiv":"Pausiert"}</p>)}
<h3 className="mt-6 text-lg font-bold">Letzte Auszahlung</h3><p className="mt-3 text-sm">2026-10 · {money(270)} · Ausgezahlt (synthetische Demo)</p>
</div>
<Link href="/affiliate/login" className="mt-5 inline-flex rounded-xl border border-white/20 px-5 py-3 text-sm">Echtes bestehendes Konto öffnen ↗</Link>
</section>}
 </div></main>;
}