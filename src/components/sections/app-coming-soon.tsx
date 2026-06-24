import { Bell, Smartphone, Zap } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function AppComingSoon() {
  return (
    <section className="bg-midnight py-24">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <Reveal>
          <SectionHeading
            eyebrow="App"
            title="LUVIPRO App kommt als mobile Schaltzentrale."
            description="Für QR-Scan, Fahrzeugstatus, Reportzugriff und Frühzugang ist die App bereits als Produktlinie sichtbar."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/app">Frühzugang</CtaLink>
            <CtaLink href="/contact" variant="secondary">
              Kontakt aufnehmen
            </CtaLink>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="glass-panel mx-auto max-w-sm rounded-lg p-4">
            <div className="rounded-lg border border-white/10 bg-black/45 p-5">
              <div className="mx-auto mb-5 h-1 w-20 rounded-full bg-white/20" />
              <div className="rounded-lg bg-pulse/10 p-4">
                <Smartphone className="h-8 w-8 text-pulse" />
                <p className="mt-6 font-[var(--font-space-grotesk)] text-2xl font-semibold">
                  Fahrzeugpass
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  QR-Scan, VIN-Prüfung und Reportstatus in einer mobilen Ansicht.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 p-4">
                  <Bell className="h-5 w-5 text-pulse" />
                  <p className="mt-3 text-sm">Aktualisierungen</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <Zap className="h-5 w-5 text-pulse" />
                  <p className="mt-3 text-sm">Schnellscan</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
