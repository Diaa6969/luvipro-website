import { CircuitBoard, ScanLine, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function UvScanner() {
  return (
    <section id="scanner" className="bg-midnight py-24">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="absolute -inset-3 rounded-lg bg-ultraviolet/15 blur-2xl sm:-inset-8 sm:blur-3xl" />
            <div className="glass-panel relative rounded-lg p-6">
              <div className="aspect-square rounded-lg border border-pulse/20 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.35),transparent_34%),linear-gradient(150deg,rgba(255,255,255,0.08),rgba(0,0,0,0.5))] p-8">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-200">
                      UV-Prüfgerät V1
                    </span>
                    <CircuitBoard className="h-9 w-9 text-pulse" />
                  </div>
                  <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-pulse/50 bg-pulse/10 shadow-glow">
                    <ScanLine className="h-20 w-20 text-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["UV", "VIN", "QR"].map((label) => (
                      <div key={label} className="rounded-lg bg-black/30 p-3 text-center text-sm font-semibold">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <SectionHeading
            eyebrow="Technik"
            title="UV-Inspektionsgerät für Partnerwerkstätten."
            description="Die Gerätetechnik wird als professionelles Prüfwerkzeug für lokale Werkstätten positioniert. Sie schafft den physischen Startpunkt für den digitalen LUVIPRO Nachweis."
          />
          <div className="mt-8 space-y-4">
            {["Prüfung von UV-Sicherheitsmerkmalen", "Vorbereitung für QR-Sticker-Aktivierung", "Dokumentation für digitale Fahrzeugreports"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-200">
                <Sparkles className="h-5 w-5 text-pulse" />
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
