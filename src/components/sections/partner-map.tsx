import { MapPin, Navigation } from "lucide-react";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function PartnerMap() {
  return (
    <section className="bg-midnight py-24">
      <div className="section-shell grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Partnernetzwerk"
            title="Werkstattkarte als vorbereiteter Platzhalter."
            description="Die echte Kartenintegration kommt später. Der Bereich zeigt schon jetzt, wie Partnerwerkstätten regional sichtbar werden."
          />
          <CtaLink href="/contact" className="mt-8">
            Werkstatt eintragen
          </CtaLink>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="glass-panel relative min-h-[420px] overflow-hidden rounded-lg p-6">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(217,247,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(217,247,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm uppercase text-pulse">Deutschland</p>
                <p className="mt-2 font-[var(--font-space-grotesk)] text-2xl font-semibold">Partnerkarte</p>
              </div>
              <Navigation className="h-8 w-8 text-pulse" />
            </div>
            {[
              "left-[18%] top-[42%]",
              "left-[45%] top-[30%]",
              "left-[62%] top-[58%]",
              "left-[75%] top-[38%]",
            ].map((position) => (
              <span
                key={position}
                className={`absolute ${position} flex h-12 w-12 items-center justify-center rounded-full border border-pulse/40 bg-pulse/15 shadow-glow`}
              >
                <MapPin className="h-6 w-6 text-pulse" />
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
