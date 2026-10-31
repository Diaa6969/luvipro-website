import { DatabaseZap, FileLock2, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { SemanticFilm } from "@/components/ui/semantic-film";

const items = [
  { icon: FileLock2, title: "Kontrollierter Reportzugriff", text: "Die FIN identifiziert das Fahrzeug, ist allein aber kein Berechtigungsnachweis für sensible Berichtsdaten." },
  { icon: DatabaseZap, title: "Dokumentation der Befunde", text: "Ein Prüfbericht beschreibt die durchgeführten Kontrollen und ihre Ergebnisse nachvollziehbar." },
  { icon: UserRoundCheck, title: "Verantwortliche Partner", text: "Geprüfte Werkstattprofile helfen, die Herkunft der jeweiligen Fahrzeugprüfung einzuordnen." },
];

export function SecurityTrust() {
  return (
    <section className="bg-obsidian py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Sicherheit"
            title="Vertrauen entsteht durch prüfbare Signale."
            description="Klare Prüfmethoden, nachvollziehbare Dokumentation und ein bewusster Umgang mit Fahrzeug- und Kundendaten stärken Vertrauen."
            align="center"
          />
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <div className="semantic-card h-full p-6">
                <SemanticFilm scene={(["trustPrivacy","trustIntegrity","trustPartner"] as const)[index]} />
                <item.icon className="h-8 w-8 text-pulse" />
                <h3 className="mt-6 font-[var(--font-space-grotesk)] text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.12}>
          <div className="mt-10 rounded-lg border border-pulse/25 bg-pulse/10 p-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-pulse" />
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-200">
              Ein dokumentierter Prüfbericht kann Kaufentscheidungen unterstützen, garantiert jedoch keine vollständige Mängelfreiheit des Fahrzeugs.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
