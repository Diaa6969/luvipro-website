import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BatteryCharging, Building2, CheckCircle2, ChevronRight,
  CircleHelp, CreditCard, FileCheck2, Headphones, Package, ScanLine, ShieldCheck, Truck,
} from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";
import { Reveal } from "@/components/ui/reveal";
import { CtaLink } from "@/components/ui/cta-link";
import { IncludedItem, ProductShowcase } from "@/components/shop/product-showcase";
import { Pricing } from "@/components/sections/pricing";
import { BUNDLE_ITEMS, DEVICE, formatEuro, isStripeCheckoutReady } from "@/lib/store";

export const metadata: Metadata = {
  title: "LUVIPRO LU3656060 kaufen & vorbestellen | UV-Prüfgerät für Werkstätten",
  description: "LUVIPRO LU3656060: professionelles UV-Prüfgerät mit 365 nm, zwei Akkus, Ladegerät, Koffer und Schutzbrille. Jetzt unverbindlich anfragen. Direktkauf in Vorbereitung.",
  alternates: { canonical: "https://luvipro.de/products" },
};

const benefits = [
  { icon: ScanLine, title: "UV-Inspektion mit 365 nm", body: "Unterstützt Werkstätten bei der Untersuchung von Lackoberflächen und der Dokumentation auffälliger Stellen." },
  { icon: FileCheck2, title: "Digitaler Prüfablauf", body: "Vorbereitet für die strukturierte Fahrzeugprüfung und spätere Zuordnung digitaler Berichte über die FIN/VIN." },
  { icon: BatteryCharging, title: "Mobiler Einsatz", body: "Das geplante Lieferpaket enthält zwei Akkus, ein Ladegerät und einen Transportkoffer." },
];

const steps = [
  { icon: Building2, title: "1. Unternehmen angeben", body: "Kontaktdaten Ihrer Werkstatt oder Ihres Unternehmens eintragen." },
  { icon: Package, title: "2. Menge wählen", body: "Gewünschte Anzahl der Geräte und Lieferinformationen hinterlegen." },
  { icon: Headphones, title: "3. Nächster Schritt", body: "Unverbindliche Anfrage versenden oder später den sicheren Direktkauf verwenden." },
];

const faqs = [
  { q: "Kann ich das Gerät bereits direkt kaufen?", a: "Die Kaufstrecke ist technisch vorbereitet, aber noch nicht freigeschaltet. Bis zum Verkaufsstart können Sie eine unverbindliche Anfrage vorbereiten." },
  { q: "Ist eine Vorbestellung verbindlich?", a: "Nein. Eine unverbindliche Voranfrage stellt keine Bestellung und keinen Kaufvertrag dar. Wir kontaktieren Sie zu Verfügbarkeit und Konditionen." },
  { q: "Welche Lieferzeit gilt?", a: "Liefertermine und Versandkosten werden vor einem verbindlichen Kauf ausgewiesen beziehungsweise individuell bestätigt." },
  { q: "Ist der Preis inklusive Mehrwertsteuer?", a: "Der angegebene Preis von 3.000 € versteht sich netto. Die gesetzlich anwendbaren Steuern und gegebenenfalls Versandkosten werden vor dem Kauf berechnet." },
  { q: "Für wen ist das Gerät gedacht?", a: "Das Angebot richtet sich an gewerbliche Käufer, insbesondere Werkstätten, Händler und Prüfunternehmen (B2B)." },
];

export default function ProductsPage() {
  const directPurchaseEnabled = isStripeCheckoutReady();
  return (
    <main className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />

      <section className="section-shell relative pb-16 pt-32 sm:pb-24 sm:pt-40">
        <nav aria-label="Brotkrumennavigation" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-pulse">Startseite</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Produkte</span>
        </nav>
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <Reveal><ProductShowcase /></Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-pulse/30 bg-pulse/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-pulse">LUVIPRO Hardware</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">Marktstart in Vorbereitung</span>
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-pulse">Professional UV Inspection</p>
            <h1 className="mt-3 max-w-xl font-[var(--font-space-grotesk)] text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              LUVIPRO <span className="text-pulse">LU3656060</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Das professionelle 365-nm-UV-Prüfgerät für die strukturierte Fahrzeuginspektion. Entwickelt für Werkstätten, die Befunde nachvollziehbar dokumentieren möchten.
            </p>
            <div className="mt-7 flex flex-wrap items-end gap-3 border-b border-white/10 pb-7">
              <span className="font-[var(--font-space-grotesk)] text-4xl font-bold text-white">{formatEuro(DEVICE.unitPriceNetCents)}</span>
              <span className="pb-1 text-sm text-slate-300">netto / Gerät</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">Zzgl. anwendbarer Umsatzsteuer und ggf. Versandkosten. Preisangabe für Geschäftskunden (B2B).</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <CtaLink href="/order?mode=preorder" className="gap-2">Unverbindlich voranfragen <ArrowRight className="h-4 w-4" /></CtaLink>
              <CtaLink href="/order?mode=buy" variant="secondary" className="gap-2">
                <CreditCard className="h-4 w-4" /> Direktkauf {directPurchaseEnabled ? "starten" : "ansehen"}
              </CtaLink>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="h-5 w-5 shrink-0 text-pulse" /> Gewerblicher Verkauf</p>
              <p className="flex items-center gap-2 text-sm text-slate-300"><Truck className="h-5 w-5 shrink-0 text-pulse" /> Versanddetails vor Kaufabschluss</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-midnight py-20 sm:py-24">
        <div className="section-shell">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-pulse">Technologie für Ihren Betrieb</p>
            <h2 className="max-w-4xl font-[var(--font-space-grotesk)] text-3xl font-semibold sm:text-5xl">UV-Inspektion, die sich in Ihren Werkstattalltag einfügt.</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="glass-panel h-full rounded-2xl p-7">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pulse/10"><Icon className="h-6 w-6 text-pulse" /></div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-obsidian py-20 sm:py-24">
        <div className="section-shell grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-pulse">Lieferumfang</p>
            <h2 className="font-[var(--font-space-grotesk)] text-3xl font-semibold sm:text-4xl">Ein Gerät. Ein durchdachtes Set.</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-300">Der geplante Lieferumfang des LUVIPRO LU3656060 für den mobilen Werkstatteinsatz:</p>
            <div className="mt-8 grid gap-4">
              {BUNDLE_ITEMS.map(item => <IncludedItem key={item} label={item} />)}
            </div>
            <p className="mt-6 text-xs leading-6 text-slate-500">Abbildungen dienen der Visualisierung. Die finale Ausstattung wird vor Vertragsabschluss bestätigt.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="glass-panel rounded-2xl p-7 sm:p-9">
              <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-pulse">Produktinformationen</p>
              {[
                ["Modell", DEVICE.sku],
                ["Wellenlänge", DEVICE.wavelength],
                ["Einsatz", "Professionelle Fahrzeug-UV-Inspektion"],
                ["Zielgruppe", "Werkstätten und gewerbliche Kunden"],
                ["Verfügbarkeit", "Verkaufsstart in Vorbereitung"],
                ["Liefergebiet", "Deutschland (Erstphase)"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-b border-white/10 py-4">
                  <span className="text-sm text-slate-400">{label}</span><span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
              <div className="mt-7 rounded-xl border border-pulse/20 bg-pulse/10 p-4 text-sm leading-6 text-slate-200">
                Das Produkt befindet sich noch in Vorbereitung. Es erfolgt aktuell keine Zahlungsannahme über diese Website.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-midnight py-20 sm:py-24">
        <div className="section-shell">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-pulse">Bestellprozess</p>
            <h2 className="font-[var(--font-space-grotesk)] text-3xl font-semibold sm:text-4xl">So einfach funktioniert es.</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="glass-panel h-full rounded-2xl p-7">
                  <Icon className="h-8 w-8 text-pulse" />
                  <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Pricing id="preise" embedded />

      <section className="bg-obsidian py-20 sm:py-24">
        <div className="section-shell">
          <div className="mb-8 flex items-center gap-3"><CircleHelp className="h-7 w-7 text-pulse" /><h2 className="font-[var(--font-space-grotesk)] text-3xl font-semibold">Häufige Fragen</h2></div>
          <div className="grid gap-3 lg:grid-cols-2">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 open:border-pulse/30">
                <summary className="cursor-pointer list-none font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse">{q} <span className="float-right text-pulse">+</span></summary>
                <p className="mt-4 text-sm leading-7 text-slate-300">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-pulse/20 bg-pulse/10 p-7 sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div><p className="mb-3 text-sm font-bold uppercase tracking-widest text-pulse">LUVIPRO LU3656060</p><h2 className="text-2xl font-semibold sm:text-3xl">Bereit, mehr zu erfahren?</h2><p className="mt-3 text-slate-300">Fragen Sie das professionelle UV-Prüfgerät unverbindlich an.</p></div>
              <CtaLink href="/order?mode=preorder" className="gap-2">Zur Produktanfrage <ArrowRight className="h-4 w-4" /></CtaLink>
            </div>
          </div>
          <p className="mt-6 flex items-start gap-2 text-sm text-slate-400"><CheckCircle2 className="h-5 w-5 shrink-0 text-pulse" />Keine Zahlung im Anfragemodus. Die direkte Zahlung wird erst zum Verkaufsstart aktiviert.</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
