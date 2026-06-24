import { BadgeEuro, Car, UserCheck, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const flows = [
  { icon: Wrench, title: "Werkstätten", steps: ["UV-Inspektionsgerät nutzen", "Fahrzeug prüfen", "Report aktivieren"] },
  { icon: BadgeEuro, title: "Verkäufer", steps: ["Nachweis erhalten", "Inserat veredeln", "Vertrauen schaffen"] },
  { icon: UserCheck, title: "Käufer", steps: ["QR scannen", "VIN suchen", "Report verstehen"] },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-midnight py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Ablauf"
            title="Ein Ablauf für alle Marktteilnehmer."
            description="Jede Rolle sieht nur das, was sie braucht. Das System bleibt einheitlich, der Einstieg bleibt einfach."
            align="center"
          />
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {flows.map((flow, index) => (
            <Reveal key={flow.title} delay={index * 0.08}>
              <div className="glass-panel h-full rounded-lg p-6">
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
