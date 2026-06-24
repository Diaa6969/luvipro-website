import { ArrowRight, BadgeCheck, CarFront } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const vehicles = [
  { name: "Audi A6 Avant", meta: "2021 · Diesel · 68.000 km", price: "32.900 €" },
  { name: "Mercedes C 300", meta: "2020 · Hybrid · 54.000 km", price: "35.400 €" },
  { name: "BMW i4 eDrive", meta: "2023 · Elektro · 19.000 km", price: "44.800 €" },
];

export function MarketplacePreview() {
  return (
    <section id="marketplace" className="bg-obsidian py-24">
      <div className="section-shell">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <Reveal>
            <SectionHeading
              eyebrow="Marktplatz"
              title="Verifizierte Fahrzeuge als eigene Premium-Kategorie."
              description="Der Marktplatz bleibt in dieser Version eine Vorschau. Die Struktur ist bereit für echte Inserate, Filter und Fahrzeugdetailseiten."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <CtaLink href="/marketplace" variant="secondary" className="gap-2">
              Marktplatz ansehen <ArrowRight className="h-4 w-4" />
            </CtaLink>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {vehicles.map((vehicle, index) => (
            <Reveal key={vehicle.name} delay={index * 0.08}>
              <article className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]">
                <div className="flex aspect-[16/10] items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(32,214,255,0.22),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(0,0,0,0.5))]">
                  <CarFront className="h-20 w-20 text-white/75" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-pulse">
                    <BadgeCheck className="h-4 w-4" />
                    LUVIPRO verifiziert
                  </div>
                  <h3 className="mt-4 font-[var(--font-space-grotesk)] text-xl font-semibold">
                    {vehicle.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{vehicle.meta}</p>
                  <p className="mt-4 text-lg font-semibold text-white">{vehicle.price}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
