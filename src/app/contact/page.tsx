import type { Metadata } from "next";
import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { CtaLink } from "@/components/ui/cta-link";

export const metadata: Metadata = {
  title: "Kontakt | LUVIPRO",
  description: "Kontaktinformationen für LUVIPRO.",
};

const contactItems = [
  {
    icon: UserRound,
    label: "Projektverantwortlicher / Ansprechpartner",
    value: "Diaa Alameen",
  },
  {
    icon: MapPin,
    label: "Standort",
    value: "Hannover, Deutschland",
  },
  {
    icon: Phone,
    label: "Telefon",
    value: "+49 177 7969259",
  },
  {
    icon: Mail,
    label: "Allgemeine Informationen",
    value: "info@luvipro.de",
  },
  {
    icon: Mail,
    label: "Kundenservice, Beschwerden und Datenschutzanfragen",
    value: "customerservice@luvipro.de",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-radial-grid text-white">
      <Navbar />
      <section className="section-shell flex min-h-[72vh] items-center pt-28 sm:pt-32">
        <div className="glass-panel w-full rounded-lg p-6 sm:p-10">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase text-pulse">Kontakt</p>
            <h1 className="font-[var(--font-space-grotesk)] text-4xl font-semibold sm:text-5xl">
              Kontakt
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Sie möchten Partnerwerkstatt werden, ein Fahrzeug verifizieren oder mehr über LUVIPRO erfahren? Kontaktieren Sie uns über die passende Kontaktmöglichkeit.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {contactItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                <item.icon className="h-6 w-6 text-pulse" />
                <p className="mt-4 text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 break-words font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaLink href="mailto:info@luvipro.de">E-Mail an info@luvipro.de</CtaLink>
            <CtaLink href="mailto:customerservice@luvipro.de" variant="secondary">
              Kundenservice kontaktieren
            </CtaLink>
            <CtaLink href="tel:+491777969259" variant="secondary">
              Anrufen
            </CtaLink>
            <CtaLink href="/" variant="secondary">
              Zurück zur Startseite
            </CtaLink>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
