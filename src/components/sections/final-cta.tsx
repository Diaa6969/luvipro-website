import { ArrowRight, ShieldCheck } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";

export function FinalCta() {
  return (
    <section className="bg-midnight py-24">
      <div className="section-shell">
        <Reveal>
          <div className="glass-panel rounded-lg p-8 text-center sm:p-12">
            <ShieldCheck className="mx-auto h-12 w-12 text-pulse" />
            <h2 className="mx-auto mt-6 max-w-4xl font-[var(--font-space-grotesk)] text-3xl font-semibold text-white sm:text-5xl">
              Baue mit LUVIPRO die nächste Vertrauensschicht für Gebrauchtwagen.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Starte als Partnerwerkstatt, verifiziere ein Fahrzeug oder sichere dir App-Frühzugang.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <CtaLink href="/partner-workshops" className="gap-2">
                Partnerwerkstatt werden <ArrowRight className="h-4 w-4" />
              </CtaLink>
              <CtaLink href="/verify" variant="secondary">
                Fahrzeug prüfen
              </CtaLink>
              <CtaLink href="/app" variant="secondary">
                App-Frühzugang
              </CtaLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
