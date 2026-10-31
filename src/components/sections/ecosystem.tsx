import { CarFront, FileCheck2, MapPinned, ScanSearch, Search, ShieldCheck, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { SemanticFilm } from "@/components/ui/semantic-film";

const ecosystemItems = [
  { icon: ScanSearch, title: "Lack & Karosserie", text: "Partnerwerkstätten prüfen Lackoberflächen und halten auffällige Stellen nachvollziehbar fest." },
  { icon: Search, title: "VIN-/FIN-Suche", text: "Fahrzeugberichte werden über die Fahrzeug-Identifizierungsnummer zugeordnet und gefunden." },
  { icon: CarFront, title: "Fahrzeugprüfung", text: "Strukturierte Prüfabläufe dokumentieren Ergebnisse aus UV-Prüfung und Sichtkontrolle." },
  { icon: FileCheck2, title: "PDF-Reports", text: "Strukturierte Fahrzeugreports für Verkauf, Ankauf und Dokumentation." },
  { icon: MapPinned, title: "Partnerwerkstätten", text: "Über die Werkstattsuche lassen sich verfügbare Partnerstandorte in der eigenen Region prüfen." },
  { icon: ShieldCheck, title: "Nachvollziehbarkeit", text: "Prüfberichte halten den dokumentierten Untersuchungsumfang und seine Ergebnisse fest." },
];

export function Ecosystem() {
  return (
    <section id="ecosystem" className="bg-obsidian py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Ökosystem"
            title="Mehr wissen, bevor Sie einen Gebrauchtwagen kaufen."
            description="Fahrzeug untersuchen lassen, Ergebnisse verstehen und einen passenden Prüfbericht finden – mit LUVIPRO und teilnehmenden Partnerwerkstätten."
            align="center"
          />
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ecosystemItems.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <div className="semantic-card group h-full p-6 transition">
                <SemanticFilm scene={(["ecoPaint","ecoVIN","ecoInspection","ecoPDF","ecoPartner","ecoTrust"] as const)[index]} />
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pulse/10 text-pulse">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-[var(--font-space-grotesk)] text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-center gap-3 text-sm text-slate-400">
          <Wrench className="h-4 w-4 text-pulse" />
          Klar dokumentierte Fahrzeugprüfungen: von der Werkstatt bis zum digitalen Bericht.
        </div>
      </div>
    </section>
  );
}
