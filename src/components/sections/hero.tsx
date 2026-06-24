import { ArrowRight, BadgeCheck, CarFront, Fingerprint, ScanLine } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";

const stats = [
  { value: "UV", label: "UV-Inspektionsgeräte" },
  { value: "QR", label: "Verschlüsselte QR-Sticker" },
  { value: "AI", label: "Fahrzeugschein-OCR & VIN-Abgleich" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen bg-radial-grid pt-32">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(217,247,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(217,247,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="section-shell relative grid items-center gap-12 pb-24 lg:grid-cols-[1.02fr_0.98fr]">
        <Reveal>
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 px-4 py-2 text-sm font-medium text-frost">
              <BadgeCheck className="h-4 w-4 text-pulse" />
              Fahrzeugverifizierung für den deutschen Gebrauchtwagenmarkt
            </div>
            <h1 className="text-balance font-[var(--font-space-grotesk)] text-5xl font-semibold text-white sm:text-6xl lg:text-7xl">
              LUVIPRO macht Fahrzeughistorie sichtbar.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Ein vernetztes System aus UV-Inspektionsgeräten, verschlüsselten QR-Stickern, VIN-Suche, Fahrzeugschein-OCR und digitalen PDF-Reports für Werkstätten, Verkäufer und Käufer.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/partner-workshops" className="gap-2">
                Partnerwerkstatt werden <ArrowRight className="h-4 w-4" />
              </CtaLink>
              <CtaLink href="/verify" variant="secondary">
                Fahrzeug verifizieren
              </CtaLink>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative">
            <div className="hero-glow-pulse absolute -inset-6 rounded-lg bg-pulse/10 blur-3xl" />
            <div className="hero-visual-float glass-panel relative overflow-hidden rounded-lg p-5">
              <div className="aspect-[4/3] rounded-lg border border-white/10 bg-[radial-gradient(circle_at_55%_20%,rgba(32,214,255,0.32),transparent_25%),linear-gradient(145deg,rgba(8,17,31,0.35),rgba(0,0,0,0.72))] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase text-pulse">Live-Fahrzeug</p>
                    <p className="mt-2 font-[var(--font-space-grotesk)] text-2xl font-semibold">
                      BMW 530d Touring
                    </p>
                  </div>
                  <ScanLine className="h-10 w-10 text-pulse" />
                </div>
                <div className="mt-10 rounded-lg border border-white/10 bg-black/35 p-4">
                  <div className="mb-4 h-2 w-32 rounded-full bg-pulse/80" />
                  <div className="grid grid-cols-2 gap-3">
                    {["VIN-Abgleich", "UV-/QR-Prüfung", "OCR-Prüfung", "PDF-Report"].map((item) => (
                      <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-sm font-semibold text-white">{item}</p>
                        <p className="mt-1 text-xs text-slate-400">verifiziert</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-7 flex items-center gap-4">
                  <CarFront className="h-12 w-12 text-white" />
                  <div className="h-px flex-1 bg-gradient-to-r from-pulse via-ultraviolet to-transparent" />
                  <Fingerprint className="h-12 w-12 text-ultraviolet" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="section-shell relative -mt-10 grid gap-4 pb-16 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-lg p-5">
            <p className="font-[var(--font-space-grotesk)] text-3xl font-semibold text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-slate-300">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
