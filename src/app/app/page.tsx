import type { Metadata } from "next";
import { FileCheck2, Fingerprint, ShieldCheck, Wrench } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { CtaLink } from "@/components/ui/cta-link";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";

export const metadata: Metadata = {
  title: "LUVIPRO App | Prüfberichte & Partnernetzwerk",
  description: "Die digitale LUVIPRO Plattform verbindet Werkstätten, UV-Fahrzeugprüfung, FIN/VIN-Zuordnung und digitale Reports.",
  alternates: { canonical: "https://luvipro.de/app" },
};

const capabilities = [
  { icon: Wrench, title: "Werkstatt", text: "Strukturierte Dokumentation der Fahrzeugprüfung." },
  { icon: Fingerprint, title: "FIN / VIN", text: "Eindeutige Zuordnung von Fahrzeug und Prüfbericht." },
  { icon: FileCheck2, title: "Digitale Reports", text: "Übersichtliche Dokumentation von Befunden und Prüfungsumfang." },
  { icon: ShieldCheck, title: "Berechtigungen", text: "Prüfberichte und personenbezogene Inhalte benötigen angemessene Zugangskontrollen." },
];

export default function AppPage() {
  return (
    <main className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />
      <section className="section-shell pb-20 pt-32 sm:pt-40">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-pulse">LUVIPRO Plattform</p>
          <h1 className="mt-5 font-[var(--font-space-grotesk)] text-4xl font-semibold leading-tight sm:text-6xl">Fahrzeugprüfung digital dokumentieren.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">LUVIPRO verbindet die UV-Prüfung in der Werkstatt mit strukturierten Fahrzeugdaten und der digitalen Zuordnung von Prüfberichten über die FIN/VIN.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass-panel rounded-xl p-6">
              <Icon className="h-8 w-8 text-pulse" />
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <CtaLink href="/verify">Fahrzeugprüfung verstehen</CtaLink>
          <CtaLink href="/contact" variant="secondary">Kontakt aufnehmen</CtaLink>
        </div>
      </section>
      <Footer />
    </main>
  );
}
