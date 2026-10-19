import { Check, ExternalLink } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const plans = [
  {
    name: "Partnerwerkstatt",
    price: "Einrichtung + Nutzung",
    features: ["UV-Inspektionsgeräte", "Report-Aktivierung", "Werkstattprofil", "Partneranfragen"],
    cta: "Partner werden",
    href: "/contact",
  },
  {
    name: "Fahrzeugverifizierung",
    price: "Pro Fahrzeug",
    features: ["VIN-Suche", "QR-Nachweis", "PDF-Report", "Marktplatz-Siegel"],
    cta: "Fahrzeug prüfen",
    href: "/verify",
  },
  {
    name: "UV-Prüfgerät LU3656060",
    price: "3.000 € netto / Gerät",
    features: ["Ein professionelles 365-nm-UV-Gerät", "2 Akkus und Ladegerät", "Transportkoffer und Schutzbrille", "Unverbindliche Voranfrage möglich"],
    cta: "Gerät ansehen",
    href: "/products",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-obsidian py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Geschäftsmodell"
            title="Mehrere Erlöspfade, ein klares Vertrauensprodukt."
            description="Die finale Preislogik kann später angebunden werden. Diese Version bereitet die wichtigsten Produktlinien visuell vor."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.08}>
              <div className="glass-panel flex h-full flex-col rounded-lg p-6">
                <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">{plan.name}</p>
                <p className="mt-3 text-lg text-pulse">{plan.price}</p>
                <div className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-slate-300">
                      <Check className="h-5 w-5 text-pulse" />
                      {feature}
                    </div>
                  ))}
                </div>
                <CtaLink
                  href={plan.href}
                  variant={index === 0 ? "primary" : "secondary"}
                  className="mt-8 gap-2"
                  target={plan.href.startsWith("http") ? "_blank" : undefined}
                  rel={plan.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {plan.cta}
                  {plan.href.startsWith("http") ? <ExternalLink className="h-4 w-4" /> : null}
                </CtaLink>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
