"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, Mail, Minus, Plus, ShieldCheck } from "lucide-react";
import { DEVICE, formatEuro, type ShopInquiry } from "@/lib/store";
import { calculateInvoicePricing, moneyEUR } from "@/lib/invoicing/prices";

type Mode = "preorder" | "buy";
type Props = { initialMode: Mode; paymentsReady: boolean; preorderReady: boolean };

const controlClass = "mt-2 block min-h-12 w-full rounded-xl border border-white/15 bg-[#0b1221] px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-pulse/65 focus:ring-2 focus:ring-pulse/20";
const labelClass = "block text-sm font-medium text-slate-200";

function textValue(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export function OrderForm({ initialMode, paymentsReady, preorderReady }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);
  const [reference, setReference] = useState("");
  const deviceTotals = calculateInvoicePricing("device", quantity);

  function selectMode(next: Mode) {
    setMode(next);
    setNotice(null);
    setReference("");
  }

  function changeQuantity(amount: number) {
    setQuantity((current) => Math.min(DEVICE.maxQuantity, Math.max(DEVICE.minQuantity, current + amount)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (pending || (mode === "buy" && !paymentsReady) || (mode === "preorder" && !preorderReady)) return;
    const form = new FormData(formElement);
    const inquiry: ShopInquiry = {
      sku: DEVICE.sku,
      quantity,
      company: textValue(form, "company"),
      contact: textValue(form, "contact"),
      email: textValue(form, "email"),
      phone: textValue(form, "phone"),
      street: textValue(form, "street"),
      postalCode: textValue(form, "postalCode"),
      city: textValue(form, "city"),
      country: "DE",
      vatId: textValue(form, "vatId"),
      note: textValue(form, "note"),
      privacyAccepted: form.get("privacyAccepted") === "on",
      termsAccepted: form.get("termsAccepted") === "on",
      website: textValue(form, "website"),
    };

    if (!inquiry.privacyAccepted || (mode === "buy" && !inquiry.termsAccepted)) {
      setNotice({ type: "error", text: "Bitte prüfen und bestätigen Sie die notwendigen Hinweise." });
      return;
    }
    setPending(true);
    setNotice(null);
    try {
      const endpoint = mode === "preorder" ? "/api/store/preorder" : "/api/store/checkout";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      const result: { error?: string; url?: string; reference?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Die Anfrage konnte nicht verarbeitet werden.");

      if (mode === "buy") {
        if (!result.url || !result.url.startsWith("https://checkout.stripe.com/")) {
          throw new Error("Die sichere Bezahlseite ist derzeit nicht verfügbar. Bitte kontaktieren Sie uns.");
        }
        window.location.assign(result.url);
        return;
      }

      setReference(result.reference ?? "");
      setNotice({ type: "success", text: "Vielen Dank! Ihre unverbindliche Produktanfrage wurde vom E-Mail-Dienst zur Zustellung an LUVIPRO angenommen. Wir melden uns bei Ihnen." });
      formElement.reset();
      setQuantity(1);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_15px_60px_rgba(0,0,0,.22)] sm:p-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2" role="group" aria-label="Bestellart wählen">
          <button type="button" onClick={() => selectMode("preorder")} aria-pressed={mode === "preorder"}
            className={`rounded-xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse ${mode === "preorder" ? "border-pulse/70 bg-pulse/10" : "border-white/10 bg-white/[0.025] hover:border-pulse/30"}`}>
            <Mail className="h-6 w-6 text-pulse" />
            <span className="mt-3 block text-lg font-bold text-white">Unverbindlich anfragen</span>
            <span className="mt-1 block text-sm leading-6 text-slate-300">Ohne Zahlung und ohne Kaufverpflichtung.</span>
          </button>
          <button type="button" onClick={() => selectMode("buy")} aria-pressed={mode === "buy"}
            className={`rounded-xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse ${mode === "buy" ? "border-pulse/70 bg-pulse/10" : "border-white/10 bg-white/[0.025] hover:border-pulse/30"}`}>
            <CreditCard className="h-6 w-6 text-pulse" />
            <span className="mt-3 block text-lg font-bold text-white">Direkt kaufen</span>
            <span className="mt-1 block text-sm leading-6 text-slate-300">{paymentsReady ? "Sichere Zahlung über Stripe." : "Sichere Zahlung derzeit nicht aktiviert."}</span>
          </button>
        </div>

        {mode === "buy" && !paymentsReady && (
          <div className="mb-7 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100" role="status">
            <strong>Direktzahlung aktuell deaktiviert.</strong> Die Zahlungsfunktion kann nur mit aktivierter Stripe-Kasse genutzt werden. Es wird keine Zahlung ausgelöst und keine Bestellung angenommen. Für eine unverbindliche Anfrage wechseln Sie zum ersten Reiter.
          </div>
        )}

        {mode === "preorder" && (
          <div className="mb-7 rounded-xl border border-pulse/20 bg-pulse/10 p-4 text-sm leading-7 text-slate-200">
            <strong>Keine verbindliche Bestellung.</strong> Die Anfrage ist unverbindlich. Deutschlandweiter Versand: {formatEuro(DEVICE.shippingNetCentsGermany)} netto pro Bestellung; zzgl. anwendbarer Steuer. Der Liefertermin wird separat bestätigt.
          </div>
        )}

        {mode === "preorder" && !preorderReady && (
          <div role="status" className="mb-7 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            <strong>Automatischer Anfrageversand ist derzeit deaktiviert.</strong> Die Anfrage kann erst versendet werden, sobald die E-Mail-Anbindung aktiviert ist.
            Bis zur Freischaltung erreichen Sie uns unter{" "}
            <a className="font-semibold underline underline-offset-2" href="mailto:customerservice@luvipro.de">customerservice@luvipro.de</a>.
          </div>
        )}

        <form onSubmit={submit} className="space-y-7">
          <input className="hidden" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <section>
            <h2 className="mb-5 text-xl font-bold text-white">1. Unternehmen & Kontakt</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>Firma / Werkstatt <span className="text-pulse">*</span><input className={controlClass} name="company" autoComplete="organization" maxLength={120} required placeholder="Firmenname" /></label>
              <label className={labelClass}>Ansprechpartner <span className="text-pulse">*</span><input className={controlClass} name="contact" autoComplete="name" maxLength={120} required placeholder="Vor- und Nachname" /></label>
              <label className={labelClass}>Geschäftliche E-Mail <span className="text-pulse">*</span><input className={controlClass} name="email" type="email" autoComplete="email" maxLength={160} required placeholder="name@unternehmen.de" /></label>
              <label className={labelClass}>Telefon (optional)<input className={controlClass} name="phone" type="tel" autoComplete="tel" maxLength={60} placeholder="+49 ..." /></label>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-bold text-white">2. Lieferanschrift</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>Straße & Hausnummer<input className={controlClass} name="street" autoComplete="street-address" maxLength={180} placeholder="Musterstraße 10" /></label>
              <label className={labelClass}>PLZ<input className={controlClass} name="postalCode" autoComplete="postal-code" maxLength={12} placeholder="30159" /></label>
              <label className={labelClass}>Ort<input className={controlClass} name="city" autoComplete="address-level2" maxLength={120} placeholder="Hannover" /></label>
              <label className={labelClass}>Land<input className={controlClass} value="Deutschland" readOnly aria-readonly="true" /></label>
              <label className={labelClass}>USt-IdNr. (optional)<input className={controlClass} name="vatId" maxLength={40} placeholder="DE..." /></label>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-400">Lieferung innerhalb Deutschlands. Beim Direktkauf bestätigt Stripe die Liefer- und Rechnungsadresse.</p>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-bold text-white">3. Gewünschte Anzahl & Nachricht</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-white/15 bg-[#0b1221]">
                <button type="button" onClick={() => changeQuantity(-1)} disabled={quantity <= DEVICE.minQuantity} aria-label="Anzahl verringern" className="flex h-12 w-12 items-center justify-center text-white hover:bg-pulse/10 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                <output className="flex w-10 items-center justify-center font-semibold" aria-live="polite">{quantity}</output>
                <button type="button" onClick={() => changeQuantity(1)} disabled={quantity >= DEVICE.maxQuantity} aria-label="Anzahl erhöhen" className="flex h-12 w-12 items-center justify-center text-white hover:bg-pulse/10 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
              </div>
              <span className="text-sm text-slate-300">Gerät{quantity === 1 ? "" : "e"} (max. {DEVICE.maxQuantity} pro Anfrage)</span>
            </div>
            <label className={`${labelClass} mt-5`}>Ihre Nachricht (optional)<textarea className={controlClass} name="note" rows={4} maxLength={1000} placeholder="Fragen, Lieferwunsch oder weitere Informationen" /></label>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-6">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-300">
              <input name="privacyAccepted" type="checkbox" required className="mt-1 h-4 w-4 accent-cyan-400" />
              <span>Ich habe die <Link href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-pulse underline underline-offset-2">Datenschutzhinweise</Link> zur Kenntnis genommen. <span className="text-pulse">*</span></span>
            </label>
            {mode === "buy" && (
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-300">
                <input name="termsAccepted" type="checkbox" required={paymentsReady} className="mt-1 h-4 w-4 accent-cyan-400" />
                <span>Ich akzeptiere die <Link href="/agb" target="_blank" rel="noopener noreferrer" className="text-pulse underline underline-offset-2">AGB</Link> für einen späteren verbindlichen Kauf. <span className="text-pulse">*</span></span>
              </label>
            )}
            <p className="text-xs leading-6 text-slate-500">{mode === "preorder"
              ? "Unser Angebot richtet sich an Unternehmen und gewerbliche Kunden. Ihre Angaben werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet."
              : "Unser Angebot richtet sich an Unternehmen und gewerbliche Kunden. Ihre Angaben verwenden wir zur Bestell- und Zahlungsabwicklung gemäß unserer Datenschutzerklärung."}</p>
          </section>

          {notice && (
            <div role={notice.type === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm leading-7 ${
              notice.type === "error" ? "border-rose-400/40 bg-rose-400/10 text-rose-100"
                : notice.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-pulse/30 bg-pulse/10 text-slate-200"
            }`}>
              {notice.type === "success" && <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-300" />}
              {notice.text}
              {reference ? <p className="mt-2 font-semibold">Referenz: {reference}</p> : null}
            </div>
          )}

          <button type="submit" disabled={pending || (mode === "buy" && !paymentsReady) || (mode === "preorder" && !preorderReady)}
            className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-pulse px-6 py-4 text-base font-bold text-obsidian shadow-glow transition hover:bg-frost focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse disabled:cursor-not-allowed disabled:opacity-45">
            {pending ? "Bitte warten ..." : mode === "preorder"
              ? (preorderReady ? "Unverbindliche Anfrage automatisch senden" : "Anfrageversand derzeit deaktiviert")
              : (paymentsReady ? "Weiter zur sicheren Zahlung" : "Direktkauf noch nicht verfügbar")}
            {!pending && mode === "preorder" && <ArrowRight className="h-5 w-5" />}
          </button>

          <p className="flex items-start gap-2 text-xs leading-6 text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-pulse" />
            {mode === "preorder" ? (preorderReady
              ? "Nach erfolgreicher Annahme durch den E-Mail-Dienst erscheint Ihre Referenznummer; es erfolgt keine Buchung oder Abbuchung."
              : "Bei deaktiviertem E-Mail-Dienst ist keine automatische Anfrage möglich. Sie erreichen uns direkt über die angegebene Kontaktadresse.")
              : "Nach Freischaltung erfolgt die Zahlung über eine sichere Stripe-Checkout-Seite. Zahlungsdaten werden nicht in dieser Website gespeichert."}
          </p>
        </form>
      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pulse">Ihre Auswahl</p>
          <h2 className="mt-3 font-[var(--font-space-grotesk)] text-xl font-bold">LUVIPRO LU3656060</h2>
          <p className="mt-2 text-sm text-slate-300">Professionelles UV-Prüfgerät · 365 nm</p>
          <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-300">Einzelpreis netto</span><span>{formatEuro(DEVICE.unitPriceNetCents)}</span></div>
            <div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-300">Anzahl</span><span>{quantity}</span></div>
            <div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-300">Versand innerhalb Deutschlands (einmalig, netto)</span><span className="shrink-0 font-semibold">{formatEuro(DEVICE.shippingNetCentsGermany)}</span></div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4"><span className="font-semibold">Gesamtsumme netto</span><span className="font-[var(--font-space-grotesk)] text-2xl font-bold text-pulse">{moneyEUR(deviceTotals.netCents)}</span></div>
          </div>
          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-300"><span>Umsatzsteuer 19 %</span><span>{moneyEUR(deviceTotals.vatCents)}</span></div>
            <div className="flex items-center justify-between gap-3 font-semibold text-white"><span>Gesamtbetrag inkl. USt.</span><span className="text-xl text-pulse">{moneyEUR(deviceTotals.grossCents)}</span></div>
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-slate-400">
            Berechnung für eine Lieferung innerhalb Deutschlands mit 19 % USt. Bei Sonderregelungen muss der steuerliche Endbetrag vor dem Kauf gesondert bestätigt werden.
          </div>
          <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-pulse hover:text-white">← Zurück zum Gerät</Link>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Ein Produkt · Klare Konditionen · Direkt bei LUVIPRO</p>
      </aside>
    </div>
  );
}
