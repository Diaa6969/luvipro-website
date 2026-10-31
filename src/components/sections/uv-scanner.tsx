import { CarFront, ScanLine, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { CtaLink } from "@/components/ui/cta-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { SemanticFilm } from "@/components/ui/semantic-film";

export function UvScanner() {
  return (
    <section id="scanner" className="bg-midnight py-24">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="semantic-card relative flex aspect-[4/3] flex-col justify-between overflow-hidden p-6 sm:p-8">
            <SemanticFilm scene="bodywork" mode="section" />
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-pulse/30 bg-[#0b0d20]/80 px-4 py-2 text-sm font-semibold text-white">
                Fahrzeugoberflächen
              </span>
              <CarFront className="h-8 w-8 text-pulse" aria-hidden="true" />
            </div>
            <div>
              <ScanLine className="mb-4 h-12 w-12 text-pulse" aria-hidden="true" />
              <h3 className="max-w-sm font-[var(--font-space-grotesk)] text-2xl font-semibold text-white sm:text-3xl">
                Jede Oberfläche erzählt etwas.
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-100">
                Echte Aufnahme einer Lackoberfläche. Der UV-Lichteffekt ist rein gestalterisch und kein tatsächlicher Prüfbefund.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <SectionHeading
            eyebrow="Was wird geprüft?"
            title="Auffälligkeiten erkennen, bevor Sie sich entscheiden."
            description="Bei einem LUVIPRO Fahrzeugcheck untersucht eine Partnerwerkstatt Lackoberflächen und Karosserie, dokumentiert erkennbare Auffälligkeiten und hält die Ergebnisse für Sie in einem strukturierten Bericht fest."
          />
          <div className="mt-8 space-y-4">
            {[
              "Prüfung von Lackoberflächen auf mögliche Nachlackierungen und Reparaturspuren",
              "Sichtprüfung der Karosserie und strukturierte Dokumentation",
              "Fahrzeugbezogener Bericht über die FIN/VIN – mit geregeltem Zugriff",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-200">
                <Sparkles className="h-5 w-5 shrink-0 text-pulse" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
          <CtaLink href="/verify#partner-map" className="mt-8">
            Fahrzeugcheck bei einer Partnerwerkstatt anfragen
          </CtaLink>
        </Reveal>
      </div>
    </section>
  );
}
