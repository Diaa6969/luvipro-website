import { ArrowRight, BadgeCheck, ScanLine } from "lucide-react";
import { UvCarScene } from "@/components/ui/uv-car-scene";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";

const stats = [
  { value: "UV", label: "Lack- & Karosseriecheck" },
  { value: "VIN", label: "Fahrzeugsuche über FIN / VIN" },
  { value: "PDF", label: "Digitale Fahrzeugberichte" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen bg-radial-grid pt-24 sm:pt-32">
      <div className="section-shell relative grid min-w-0 items-center gap-10 pb-20 sm:gap-12 sm:pb-24 lg:grid-cols-[1.02fr_0.98fr]">
        <Reveal>
          <div className="min-w-0 max-w-full">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 px-4 py-2 text-sm font-medium text-frost">
              <BadgeCheck className="h-4 w-4 text-pulse" />
              <span className="min-w-0 break-words">Jedes Fahrzeug hat eine Geschichte. Wir bringen die Wahrheit ans Licht.</span>
            </div>
            <h1 className="text-balance max-w-full font-[var(--font-space-grotesk)] text-[clamp(2.55rem,11vw,4.5rem)] font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Gebrauchtwagen checken lassen. Mit mehr Klarheit entscheiden.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Lassen Sie Ihr Wunschfahrzeug bei einer LUVIPRO Partnerwerkstatt untersuchen. Mit UV-gestützter Lackprüfung, Sichtkontrolle und verständlicher digitaler Dokumentation.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/verify#partner-map" className="gap-2">
                Fahrzeug checken lassen <ArrowRight className="h-4 w-4" />
              </CtaLink>
              <CtaLink href="/reports" variant="secondary">
                Prüfbericht suchen
              </CtaLink>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative min-w-0 max-w-full">
            <div className="hero-glow-pulse pointer-events-none absolute -inset-3 rounded-3xl bg-ultraviolet/15 blur-2xl sm:-inset-6 sm:blur-3xl" />
            <div className="hero-visual-float glass-panel relative w-full max-w-full overflow-hidden rounded-3xl p-3 sm:p-5">
              <div className="relative rounded-2xl border border-white/10 bg-[#090c1b]/90 p-3 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-pulse sm:text-xs">LUVIPRO · UV Inspection</p>
                    <p className="mt-1 text-sm font-semibold text-white sm:text-base">Fahrzeugoberflächen im Fokus</p>
                  </div>
                  <ScanLine className="h-7 w-7 text-ultraviolet sm:h-9 sm:w-9" aria-hidden="true" />
                </div>
                <UvCarScene />
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300 sm:text-sm">
                  {["Lack", "Karosserie", "Digitaler Bericht"].map((item) => (
                    <span key={item} className="rounded-full border border-pulse/20 bg-pulse/[0.07] px-3 py-1.5">{item}</span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">Illustrative UV-Animation – kein tatsächlicher Fahrzeugprüfbefund.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="section-shell relative -mt-10 grid gap-4 pb-16 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel cinematic-card rounded-2xl p-5">
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
