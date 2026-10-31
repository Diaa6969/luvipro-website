import { ArrowRight, BadgeCheck, CheckCircle2, FileSearch, ScanLine, ShieldCheck } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SemanticFilm } from "@/components/ui/semantic-film";

const stats = [
  { value: "UV", label: "Lack- & Karosseriecheck" },
  { value: "VIN", label: "Fahrzeugsuche über FIN / VIN" },
  { value: "PDF", label: "Digitale Fahrzeugberichte" },
];

export function Hero() {
  return (
    <section className="semantic-hero relative min-h-screen overflow-hidden pt-24 sm:pt-32">
      <SemanticFilm scene="hero" mode="hero" />
      <div className="section-shell relative grid min-w-0 items-center gap-10 pb-20 sm:gap-12 sm:pb-24 lg:grid-cols-[1.06fr_0.94fr]">
        <Reveal>
          <div className="min-w-0 max-w-full">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-pulse/30 bg-[#0a0e23]/70 px-4 py-2 text-sm font-medium text-frost">
              <BadgeCheck className="h-4 w-4 shrink-0 text-pulse" />
              <span className="min-w-0 break-words">Jedes Fahrzeug hat eine Geschichte. Wir bringen die Wahrheit ans Licht.</span>
            </div>
            <h1 className="text-balance max-w-full font-[var(--font-space-grotesk)] text-[clamp(2.55rem,11vw,4.5rem)] font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
              Gebrauchtwagen checken lassen. Mit mehr Klarheit entscheiden.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Lassen Sie Ihr Wunschfahrzeug bei einer LUVIPRO Partnerwerkstatt untersuchen. Mit UV-gestützter Lackprüfung, Sichtkontrolle und verständlicher digitaler Dokumentation.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/verify#partner-map" className="gap-2">
                Fahrzeug checken lassen <ArrowRight className="h-4 w-4" />
              </CtaLink>
              <CtaLink href="/reports" variant="secondary">Prüfbericht suchen</CtaLink>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="semantic-hero-panel relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-ultraviolet/25 blur-3xl" />
            <p className="relative text-xs font-bold uppercase tracking-[0.23em] text-pulse">LUVIPRO · Der Fahrzeugcheck</p>
            <h2 className="relative mt-4 font-[var(--font-space-grotesk)] text-2xl font-semibold text-white sm:text-3xl">Prüfung statt bloßer Vermutung.</h2>
            <p className="relative mt-3 text-sm leading-7 text-slate-200">Eine unabhängige Partnerwerkstatt hält erkennbare Auffälligkeiten strukturiert fest.</p>
            <div className="relative mt-8 space-y-5">
              {[
                { icon: ScanLine, name: "Lack & Karosserie", desc: "Oberflächen und mögliche Reparaturspuren" },
                { icon: ShieldCheck, name: "Sichtprüfung", desc: "Umfang gemäß gewählter Inspektionsleistung" },
                { icon: FileSearch, name: "Digitaler Bericht", desc: "Dokumentierte Erkenntnisse zur Fahrzeug-FIN" },
              ].map(({ icon: Icon, name, desc }) => (
                <div key={name} className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/25 p-3">
                  <Icon className="mt-1 h-6 w-6 shrink-0 text-pulse" aria-hidden="true" />
                  <div><p className="font-semibold text-white">{name}</p><p className="mt-1 text-sm text-slate-300">{desc}</p></div>
                </div>
              ))}
            </div>
            <p className="relative mt-5 text-xs leading-5 text-slate-400">Hintergrund: reale Aufnahme eines Fahrzeugs als Illustration, kein LUVIPRO-Prüfvideo.</p>
          </div>
        </Reveal>
      </div>
      <div className="section-shell relative -mt-7 grid gap-4 pb-16 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={stat.value} className="semantic-card min-h-[135px] p-5">
            <SemanticFilm scene={(["statUV","statVIN","statPDF"] as const)[index]} />
            <CheckCircle2 className="h-5 w-5 text-pulse" aria-hidden="true" />
            <p className="mt-2 font-[var(--font-space-grotesk)] text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-200">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
