import { DatabaseZap, FileLock2, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const items = [
  { icon: FileLock2, title: "Verschlüsselte QR-Logik", text: "QR-Sticker werden als sichere Produktkomponente vorbereitet." },
  { icon: DatabaseZap, title: "Report-Integrität", text: "Digitale Reports können später versioniert und nachvollziehbar gemacht werden." },
  { icon: UserRoundCheck, title: "Partneridentität", text: "Werkstattprofile schaffen später eine klare Herkunft für jede Prüfung." },
];

export function SecurityTrust() {
  return (
    <section className="bg-obsidian py-24">
      <div className="section-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Sicherheit"
            title="Vertrauen entsteht durch prüfbare Signale."
            description="Die Landing Page formuliert die Sicherheitsarchitektur als Produktversprechen, ohne schon Backend- oder Kryptofunktionen zu simulieren."
            align="center"
          />
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <div className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-6">
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
              LUVIPRO ist als vertrauensbildendes System für Werkstätten, private Verkäufer,
              Händler und Käufer konzipiert.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
