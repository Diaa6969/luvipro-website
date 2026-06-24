import { AlertTriangle, FileWarning, Gauge, ShieldAlert } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const problems = [
  {
    icon: Gauge,
    title: "Manipulierte Kilometerstände",
    text: "Tacho-Betrug und unklare Servicehistorien zerstören Vertrauen vor dem Kauf.",
  },
  {
    icon: FileWarning,
    title: "Gefährdete Dokumente",
    text: "Fahrzeugscheine, Bilder und Inserate lassen sich ohne Systemprüfung schwer einordnen.",
  },
  {
    icon: ShieldAlert,
    title: "Fehlende Kette",
    text: "Werkstatt, Verkäufer und Käufer arbeiten oft mit getrennten Daten und Nachweisen.",
  },
];

export function Problem() {
  return (
    <section className="bg-midnight py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Problem"
            title="Gebrauchtwagen-Betrug ist ein Vertrauensproblem."
            description="Der Markt braucht nachvollziehbare Prüfung, klare Herkunftsdaten und Reports, die Käufer wirklich verstehen."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {problems.map((problem, index) => (
            <Reveal key={problem.title} delay={index * 0.08}>
              <div className="glass-panel h-full rounded-lg p-6">
                <problem.icon className="h-9 w-9 text-pulse" />
                <h3 className="mt-6 font-[var(--font-space-grotesk)] text-xl font-semibold">
                  {problem.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-300">{problem.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-ultraviolet/25 bg-ultraviolet/10 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <AlertTriangle className="h-10 w-10 text-ultraviolet" />
            <p className="max-w-4xl text-lg leading-8 text-slate-200">
              LUVIPRO setzt an der Schnittstelle zwischen physischer Fahrzeugprüfung,
              digitaler Dokumentenverifikation und marktplatzfähigem Vertrauensnachweis an.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
