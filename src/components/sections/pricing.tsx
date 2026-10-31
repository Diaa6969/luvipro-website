import { ArrowRight, Check, ScanLine } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { RealCarFootage } from "@/components/ui/real-car-footage";
import { DEVICE, formatEuro } from "@/lib/store";
import { INSPECTION_SERVICES, INSPECTION_PRICING_NOTE } from "@/lib/inspection-pricing";
import { calculateInvoicePricing, moneyEUR } from "@/lib/invoicing/prices";

type PricingProps = { id?: string; embedded?: boolean; audience?: "customer" | "partner" };

export function Pricing({ id = "pricing", embedded = false, audience = "customer" }: PricingProps) {
  if (audience === "partner") return <section id={id} className={`scroll-mt-24 ${embedded ? "bg-midnight py-20 sm:py-24" : "bg-obsidian py-24"}`}><div className="section-shell">
    <Reveal><SectionHeading eyebrow="Für Werkstätten & Unternehmen" title="LU3656060: Gerät und Konditionen für Profis." description="Gerätepreis, Ausstattung und Bestellanfrage für gewerbliche LUVIPRO Partner. Die Geräteinformationen sind bewusst von den Fahrzeugcheck-Angeboten für Privatkunden getrennt." /></Reveal>
    <div className="mt-10 max-w-xl"><Reveal delay={0.16}>
            <div className="glass-panel cinematic-card flex h-full flex-col rounded-2xl p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <ScanLine className="h-7 w-7 text-pulse" />
                <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">LU3656060</p>
              </div>
              <p className="mt-5 font-[var(--font-space-grotesk)] text-4xl font-bold text-white">
                {formatEuro(DEVICE.unitPriceNetCents)}
              </p>
              <p className="mt-2 text-sm text-slate-400">netto / Gerät · B2B</p>
              <p className="mt-2 text-xs text-slate-400">Gerät inkl. 19 % USt.: {moneyEUR(calculateInvoicePricing("device").lines[0].grossCents)} · Versand separat</p>
              <div className="mt-7 flex-1 space-y-4">
                {[
                  "365-nm-UV-Prüfgerät für Werkstätten",
                  "Zwei Akkus und Ladegerät",
                  "Transportkoffer und UV-Schutzbrille",
                  "Unverbindliche Produktanfrage möglich",
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-pulse" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <CtaLink href="/order?mode=preorder" variant="secondary" className="mt-8 gap-2">
                Gerät unverbindlich anfragen <ArrowRight className="h-4 w-4" />
              </CtaLink>
            </div>
          </Reveal></div>
  </div></section>;

  return (
    <section id={id} className={`scroll-mt-24 ${embedded ? "bg-midnight py-20 sm:py-24" : "bg-obsidian py-24"}`}>
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Leistungen & Preise"
            title="Fahrzeugcheck wählen: Standard oder Premium."
            description="Sie möchten einen Gebrauchtwagen prüfen lassen? Vergleichen Sie die beiden Fahrzeugchecks und suchen Sie eine Partnerwerkstatt in Ihrer Nähe."
          />
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          {INSPECTION_SERVICES.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.08}>
              <div className={`glass-panel cinematic-card flex h-full flex-col rounded-2xl p-6 sm:p-7 ${plan.id === "premium" ? "border-pulse/40" : ""}`}>
                <div className="relative -mx-1 mb-6 overflow-hidden rounded-xl border border-white/10">
                  <RealCarFootage
                    clip={plan.id === "standard" ? "detail" : "engine"}
                    variant="card"
                    label={plan.id === "standard" ? "Reale Autoaufnahmen im nächtlichen Straßenverkehr" : "Reales Video von Fahrzeugen im Straßenverkehr"}
                    uvOverlay
                  />
                  <span className="absolute bottom-3 left-4 z-10 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
                    {plan.id === "standard" ? "LACK & KAROSSERIE" : "FAHRZEUG & DOKUMENTATION"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">{plan.name}</p>
                  {plan.id === "premium" && <span className="rounded-full bg-pulse/15 px-3 py-1 text-xs font-semibold text-pulse">Erweitert</span>}
                </div>
                <p className="mt-5 font-[var(--font-space-grotesk)] text-4xl font-bold text-white">
                  {formatEuro(plan.priceCents)}
                </p>
                <p className="mt-2 text-sm text-slate-400">pro Fahrzeugprüfung · inkl. 19 % USt.</p>
                <p className="mt-2 text-xs text-slate-400">Netto: {moneyEUR(calculateInvoicePricing(plan.id === "standard" ? "inspection_standard" : "inspection_premium").netCents)} · USt.: {moneyEUR(calculateInvoicePricing(plan.id === "standard" ? "inspection_standard" : "inspection_premium").vatCents)}</p>
                <div className="mt-7 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-pulse" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <CtaLink href="/#partner-map" variant={plan.id === "premium" ? "primary" : "secondary"} className="mt-8 gap-2">
                  Verfügbarkeit prüfen <ArrowRight className="h-4 w-4" />
                </CtaLink>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-7 text-sm leading-7 text-slate-400">{INSPECTION_PRICING_NOTE}</p>
      </div>
    </section>
  );
}
