import { Bot, FileCheck2, MapPinned, QrCode, ScanSearch, Store, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const ecosystemItems = [
  { icon: ScanSearch, title: "UV-Inspektionsgerät", text: "Partnerwerkstätten prüfen versteckte Sicherheitsmerkmale direkt am Fahrzeug." },
  { icon: QrCode, title: "Verschlüsselter QR-Sticker", text: "Fahrzeuge erhalten einen scanbaren Nachweis für Reports und Status." },
  { icon: Bot, title: "Fahrzeugschein-OCR & VIN-Abgleich", text: "Fahrzeugschein-Daten werden digital extrahiert und für Plausibilität vorbereitet." },
  { icon: FileCheck2, title: "PDF-Reports", text: "Strukturierte Fahrzeugreports für Verkauf, Ankauf und Dokumentation." },
  { icon: MapPinned, title: "Partnernetzwerk", text: "Werkstattprofile und regionale Abdeckung als spätere Kartenintegration." },
  { icon: Store, title: "Marktplatz", text: "Verifizierte Inserate werden als eigene Vertrauenskategorie sichtbar." },
];

export function Ecosystem() {
  return (
    <section id="ecosystem" className="bg-obsidian py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Ökosystem"
            title="Ein System, das Gerätetechnik, Daten und Marktvertrauen verbindet."
            description="LUVIPRO ist nicht nur ein Report. Es ist eine Infrastruktur für wiederholbare, nachvollziehbare Verifizierung."
            align="center"
          />
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ecosystemItems.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <div className="group h-full rounded-lg border border-white/10 bg-white/[0.045] p-6 transition hover:border-pulse/40 hover:bg-pulse/[0.07]">
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
          Oberflächen-Vorschau. Integrationen folgen in späteren Produktphasen.
        </div>
      </div>
    </section>
  );
}
