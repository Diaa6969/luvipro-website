import { ArrowRight, Check, ScanLine } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { DEVICE, formatEuro } from "@/lib/store";
import { INSPECTION_SERVICES, INSPECTION_PRICING_NOTE } from "@/lib/inspection-pricing";

type PricingProps = { id?: string; embedded?: boolean };

export function Pricing({ id = "pricing", embedded = false }: PricingProps) {
  return (
    <section id={id} className={`scroll-mt-24 ${embedded ? "bg-midnight py-20 sm:py-24" : "bg-obsidian py-24"}`}>
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Leistungen & Preise"
            title="Ein Prüfgerät. Zwei Inspektionspakete."
            description="Unsere Angebote für professionelle UV-Prüftechnik und strukturierte Fahrzeugchecks im LUVIPRO Partnernetzwerk."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {INSPECTION_SERVICES.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.08}>
              <div className={`glass-panel flex h-full flex-col rounded-2xl p-6 sm:p-7 ${plan.id === "premium" ? "border-pulse/40" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">{plan.name}</p>
                  {plan.id === "premium" && <span className="rounded-full bg-pulse/15 px-3 py-1 text-xs font-semibold text-pulse">Erweitert</span>}
                </div>
                <p className="mt-5 font-[var(--font-space-grotesk)] text-4xl font-bold text-white">
                  {formatEuro(plan.priceCents)}
                </p>
                <p className="mt-2 text-sm text-slate-400">pro Fahrzeugprüfung</p>
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
          <Reveal delay={0.16}>
            <div className="glass-panel flex h-full flex-col rounded-2xl p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <ScanLine className="h-7 w-7 text-pulse" />
                <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">LU3656060</p>
              </div>
              <p className="mt-5 font-[var(--font-space-grotesk)] text-4xl font-bold text-white">
                {formatEuro(DEVICE.unitPriceNetCents)}
              </p>
              <p className="mt-2 text-sm text-slate-400">netto / Gerät · B2B</p>
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
              <CtaLink href="/products" variant="secondary" className="mt-8 gap-2">
                Gerät & Bestellung ansehen <ArrowRight className="h-4 w-4" />
              </CtaLink>
            </div>
          </Reveal>
        </div>
        <p className="mt-7 text-sm leading-7 text-slate-400">{INSPECTION_PRICING_NOTE}</p>
      </div>
    </section>
  );
}
