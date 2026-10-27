"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Banknote, CheckCircle2, MailCheck, RefreshCw } from "lucide-react";
import type { BankOrder } from "@/lib/bank-transfer/logic";

const euro = (cents: number) => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(cents / 100);
const control = "w-full rounded-lg border border-white/15 bg-[#0b1324] px-3 py-2 text-white outline-none focus:border-pulse";
type Preview = { to: string; subject: string; text: string };

export function BankTransferPanel() {
  const [orders,setOrders] = useState<BankOrder[]>([]);
  const [busy,setBusy] = useState<string | null>(null);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [preview,setPreview] = useState<{orderId:string;data:Preview}|null>(null);
  const [loaded,setLoaded] = useState(false);

  async function load() {
    setError("");
    try {
      const r = await fetch("/api/internal/bank-orders", {cache:"no-store",credentials:"same-origin"});
      const j: {orders?:BankOrder[];error?:string} = await r.json();
      if(!r.ok || !j.orders) throw new Error(j.error || "Bankdaten derzeit nicht verfügbar");
      setOrders(j.orders);
    } catch(e) { setError(e instanceof Error?e.message:"Verbindung fehlgeschlagen"); }
    finally {setLoaded(true);}
  }
  useEffect(()=>{void load()},[]);

  async function action(orderId:string, type:string, payload:Record<string,unknown>={}) {
    if (busy) return;
    setBusy(orderId);setError("");setMessage("");
    try {
      const r = await fetch("/api/internal/bank-orders",{
        method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({action:type,orderId,...payload}),
      });
      const j:Record<string,unknown> = await r.json();
      if (!r.ok) throw new Error(typeof j.error==="string"?j.error:"Aktion nicht erfolgreich");
      if(type==="preview_reminder") {
        setPreview({orderId,data:j as Preview});
      }else{
        setPreview(null);
        setMessage(type==="confirm"?"Bankzahlung wurde als geprüft und bezahlt erfasst.":type==="deliver"?"Lieferung und Rechnung verarbeitet.":"Die vorbereitete Zahlungserinnerung wurde an die Kundenadresse versandt.");
        await load();
      }
    }catch(e){setError(e instanceof Error?e.message:"Vorgang fehlgeschlagen");}
    finally{setBusy(null);}
  }
  async function paid(event:FormEvent<HTMLFormElement>,id:string) {
    event.preventDefault();
    const fd=new FormData(event.currentTarget);
    const reference=String(fd.get("bankReference")||"").trim();
    const date=String(fd.get("paidAt")||"");
    if (!reference || !date || fd.get("confirmed")!=="on") {setError("Zahlung erst nach Abgleich mit Kontoauszug bestätigen.");return;}
    if (!window.confirm("Ist diese Zahlung mit dem tatsächlichen Bankkontoauszug abgeglichen? Dieser Schritt wird protokolliert."))return;
    await action(id,"confirm", {bankReference:reference,paidAt:new Date(date+"T12:00:00").toISOString(),acknowledgedBankMatch:true});
  }
  const unpaid=orders.filter(x=>x.payment_status==="pending");
  const paidOrders=orders.filter(x=>x.payment_status==="paid");
  return (
    <section className="mt-10 rounded-2xl border border-pulse/25 bg-white/[0.045] p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-pulse">Zahlungseingänge prüfen</p>
          <h2 className="mt-3 text-2xl font-bold">Banküberweisungen</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Offene Vorkassebestellungen, Rechnungsreferenzen und tatsächliche Zahlungseingänge. Nur ein überprüfter Kontoauszug berechtigt zur Zahlungsbestätigung.
          </p>
        </div>
        <button type="button" onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm hover:bg-white/10">
          <RefreshCw className="size-4"/> Aktualisieren
        </button>
      </div>
      {message && <p role="status" className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">{error}</p>}
      {!loaded && <p className="mt-6 text-slate-400">Bankaufträge werden geladen …</p>}
      {loaded && !error && <p className="mt-5 text-sm text-slate-300">{unpaid.length} offen · {paidOrders.length} bezahlt · {orders.length} insgesamt (letzte 200)</p>}
      <div className="mt-6 space-y-4">
        {unpaid.map(order=>(
          <article key={order.id} className="rounded-xl border border-white/10 bg-[#090f1f] p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">{order.invoice_number} <span className="ml-2 rounded-md bg-amber-400/10 px-2 py-1 text-xs font-normal text-amber-200">Offen</span></p>
                <p className="mt-2 text-sm text-slate-300">{order.customer_company} · {order.customer_contact}</p>
                <p className="mt-1 break-all text-sm text-slate-400">{order.customer_email}</p>
                <p className="mt-1 text-xs text-slate-400">Zahlungsinformation: {order.payment_mail_status==="sent"?"gesendet":order.payment_mail_status}</p>
              </div>
              <p className="text-xl font-bold text-pulse">{euro(order.gross_cents)}</p>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <form onSubmit={e=>void paid(e,order.id)} className="space-y-3 rounded-xl border border-white/10 p-4">
                <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-pulse" />Zahlungseingang bestätigen</p>
                <label className="block text-xs text-slate-300">Bank-Buchungsreferenz (Kontoauszug)
                  <input name="bankReference" className={control+" mt-1"} minLength={5} maxLength={120} required placeholder="Bankreferenz / Buchung-ID" />
                </label>
                <label className="block text-xs text-slate-300">Datum der Gutschrift
                  <input name="paidAt" type="date" className={control+" mt-1"} required max={new Date().toISOString().slice(0,10)} />
                </label>
                <label className="flex items-start gap-2 text-xs leading-5 text-slate-300">
                  <input name="confirmed" type="checkbox" className="mt-1 size-4 accent-cyan-400" required />
                  Betrag {euro(order.gross_cents)}, Zahlungsempfänger und Verwendungszweck {order.invoice_number} auf dem echten Bankkontoauszug geprüft.
                </label>
                <button disabled={busy!==null || order.payment_mail_status!=="sent"} type="submit" className="w-full rounded-lg bg-pulse px-3 py-3 font-semibold text-obsidian disabled:opacity-40">Zahlung bestätigen</button>
              </form>
              <div className="space-y-3 rounded-xl border border-white/10 p-4">
                <p className="flex items-center gap-2 font-semibold"><MailCheck className="size-4 text-pulse" />Zahlungserinnerung</p>
                <p className="text-xs leading-6 text-slate-300">E-Mail wird aus dem gespeicherten Auftrag erstellt: Kunde, offener Gesamtbetrag, Bankdaten und exakter Verwendungszweck.</p>
                <p className="text-xs text-slate-400">Bisherige Erinnerungen: {order.reminder_count}</p>
                <button disabled={busy!==null || order.payment_mail_status!=="sent"} type="button" onClick={()=>void action(order.id,"preview_reminder")}
                  className="w-full rounded-lg border border-pulse/50 px-4 py-3 text-sm text-pulse disabled:opacity-40">
                  Fertige E-Mail ansehen
                </button>
                {preview?.orderId===order.id && (
                  <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-slate-300">An: {preview.data.to}</p>
                    <p className="text-xs font-semibold">{preview.data.subject}</p>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-sans text-xs leading-5 text-slate-300">{preview.data.text}</pre>
                    <button disabled={busy!==null} type="button" onClick={()=>{
                      if(window.confirm("Diese Zahlungserinnerung jetzt per E-Mail versenden?")) void action(order.id,"remind");
                    }} className="w-full rounded-lg bg-pulse px-3 py-3 font-semibold text-obsidian disabled:opacity-40">
                      Erinnerung an Kunden senden
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
        {loaded && !error && unpaid.length===0 && <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">Keine offenen Banküberweisungsbestellungen.</p>}
      </div>
      {paidOrders.length>0 && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Banknote className="size-5 text-pulse" />Bezahlte Überweisungen</h3>
          <table className="min-w-[700px] w-full text-left text-sm">
            <thead className="border-b border-white/15 text-slate-300"><tr><th className="p-3">Referenz</th><th className="p-3">Kunde</th><th className="p-3">Betrag</th><th className="p-3">Zahlungseingang</th><th className="p-3">Rechnung</th></tr></thead>
            <tbody>{paidOrders.map(o=>(
              <tr key={o.id} className="border-b border-white/10">
                <td className="p-3 font-semibold">{o.invoice_number}</td>
                <td className="p-3">{o.customer_company}</td>
                <td className="p-3">{euro(o.gross_cents)}</td>
                <td className="p-3">{o.paid_at ? new Date(o.paid_at).toLocaleDateString("de-DE") : "–"}</td>
                <td className="p-3"><span className="text-xs text-amber-200">Nach Lieferung ausstellen</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="mt-7 text-xs leading-6 text-slate-400">
        Keine automatische Bankabfrage: Überweisungen werden ausschließlich manuell anhand des tatsächlichen Zahlungseingangs bestätigt.
        Vorsteuer/USt auf Anzahlungen und spätere Endrechnungen steuerlich prüfen. Erinnerungen sind auf einen Versuch pro 24 Stunden begrenzt.
      </p>
    </section>
  );
}
