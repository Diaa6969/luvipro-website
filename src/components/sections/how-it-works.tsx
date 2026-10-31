import { BadgeEuro, Car, UserCheck, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const flows = [
  { icon: UserCheck, title: "Für Autokäufer", steps: ["Partnerwerkstatt finden", "Fahrzeugcheck anfragen", "Ergebnisse und vorhandene Berichte prüfen"] },
  { icon: BadgeEuro, title: "Für Verkäufer", steps: ["Fahrzeugprüfung vereinbaren", "Befunde dokumentieren lassen", "Prüfbericht beim Verkauf nutzen"] },
  { icon: Wrench, title: "So prüft die Werkstatt", steps: ["Fahrzeug und Lackoberflächen untersuchen", "Auffälligkeiten strukturiert dokumentieren", "Digitalen Fahrzeugbericht erstellen"] },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-midnight py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Ablauf"
            title="So funktioniert Ihr Fahrzeugcheck."
            description="Ob Sie ein Auto kaufen oder verkaufen: Finden Sie eine Partnerwerkstatt und erhalten Sie eine nachvollziehbare Dokumentation des vereinbarten Prüfumfangs."
            align="center"
          />
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {flows.map((flow, index) => (
            <Reveal key={flow.title} delay={index * 0.08}>
              <div className="glass-panel cinematic-card h-full rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <flow.icon className="h-9 w-9 text-pulse" />
                  <Car className="h-6 w-6 text-white/30" />
                </div>
                <h3 className="mt-7 font-[var(--font-space-grotesk)] text-2xl font-semibold">
                  {flow.title}
                </h3>
                <ol className="mt-6 space-y-4">
                  {flow.steps.map((step, stepIndex) => (
                    <li key={step} className="flex items-center gap-3 text-slate-200">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pulse/10 text-sm font-semibold text-pulse">
                        {stepIndex + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
