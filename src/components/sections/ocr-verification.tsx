import { FileScan, LockKeyhole, ScanText } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function OcrVerification() {
  return (
    <section className="bg-obsidian py-24">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Fahrzeugschein-OCR"
            title="Fahrzeugschein-Verifizierung als digitaler Kontrollpunkt."
            description="Die erste Landing Page zeigt den Produktpfad ohne echte OCR-Integration. Später können Upload, Extraktion und Plausibilitätsprüfung direkt in diesen Bereich wachsen."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: ScanText, title: "Daten extrahieren" },
              { icon: LockKeyhole, title: "Sicher verarbeiten" },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                <item.icon className="h-7 w-7 text-pulse" />
                <p className="mt-4 font-semibold text-white">{item.title}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="glass-panel rounded-lg p-6">
            <div className="rounded-lg border border-white/10 bg-black/35 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Dokumentvorschau</p>
                  <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">
                    Fahrzeugschein
                  </p>
                </div>
                <FileScan className="h-10 w-10 text-pulse" />
              </div>
              <div className="space-y-3">
                {["VIN", "Hersteller", "Typ", "Erstzulassung", "Kennzeichen"].map((field, index) => (
                  <div key={field} className="grid gap-2 rounded-lg bg-white/5 p-3 text-sm sm:grid-cols-[130px_1fr] sm:gap-3">
                    <span className="text-slate-400">{field}</span>
                    <span className={`${index === 0 ? "text-pulse" : "text-slate-100"} min-w-0 break-words`}>
                      {index === 0 ? "WBA5XXXXXX1234567" : "Platzhalter"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
