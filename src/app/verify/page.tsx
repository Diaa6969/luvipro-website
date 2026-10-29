import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileCheck2, Fingerprint, ShieldCheck, Wrench } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";
import { WorkshopFinder } from "@/components/sections/workshop-finder";
import { ReportLookup } from "@/components/reports/report-lookup";

export const metadata: Metadata = {
  title: "Fahrzeug checken lassen – Werkstatt suchen | LUVIPRO",
  description: "Lassen Sie Ihr Fahrzeug mit LUVIPRO prüfen: Partnerwerkstatt nach PLZ oder Ort suchen, UV-gestützte Prüfung anfragen und digitalen Bericht über FIN/VIN zuordnen.",
  alternates: { canonical: "https://luvipro.de/verify" },
};

const stages = [
  { icon: ClipboardCheck, title: "Prüfung vor Ort", text: "Eine qualifizierte Werkstatt führt die vereinbarte Untersuchung des Fahrzeugs durch." },
  { icon: Fingerprint, title: "Zuordnung per FIN/VIN", text: "Die Fahrzeug-Identifizierungsnummer verbindet das untersuchte Fahrzeug mit dem Bericht." },
  { icon: FileCheck2, title: "Dokumentierter Bericht", text: "Der Bericht beschreibt Art, Umfang und Ergebnisse der durchgeführten Fahrzeugprüfung." },
];

export default function VerifyPage() {
  return (
    <main className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />

      <section className="section-shell pb-10 pt-28 sm:pb-12 sm:pt-36">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-pulse">LUVIPRO Fahrzeugcheck</p>
          <h1 className="mt-4 font-[var(--font-space-grotesk)] text-4xl font-semibold leading-tight text-white sm:text-6xl">
            Fahrzeug checken lassen
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Sie möchten ein Fahrzeug vor dem Kauf oder Verkauf überprüfen lassen? Suchen Sie hier eine LUVIPRO Partnerwerkstatt nach Ort oder Postleitzahl und fragen Sie die Verfügbarkeit einer Prüfung an.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#partner-map" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-pulse px-6 py-3 font-semibold text-obsidian transition hover:bg-frost">
              <Wrench className="size-4" /> Werkstatt suchen <ArrowRight className="size-4" />
            </Link>
            <Link href="#report-lookup" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-[#101b32] px-6 py-3 font-semibold text-white transition hover:border-pulse/60">
              Bereits geprüft? Bericht suchen
            </Link>
          </div>
        </div>
      </section>

      {/* Put workshop search first: visitors requesting an inspection should
          not have to scroll past the report lookup to find the search input. */}
      <section id="partner-map" className="scroll-mt-24 bg-midnight py-10 sm:py-14">
        <div className="section-shell">
          <WorkshopFinder locale="de" />
        </div>
      </section>

      <section className="section-shell py-14 sm:py-16">
        <h2 className="max-w-4xl font-[var(--font-space-grotesk)] text-2xl font-semibold sm:text-3xl">
          So läuft der LUVIPRO Fahrzeugcheck ab
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {stages.map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass-panel rounded-2xl p-6">
              <Icon className="h-8 w-8 text-pulse" />
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="report-lookup" className="scroll-mt-24 bg-obsidian pb-16 sm:pb-20">
        <div className="section-shell max-w-5xl"><ReportLookup /></div>
      </section>
      <section className="section-shell pb-20 pt-4">
        <p className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-300">
          <ShieldCheck className="mt-1 size-5 shrink-0 text-pulse" />
          Eine LUVIPRO Prüfung unterstützt fundierte Entscheidungen, ist jedoch keine Garantie für die Mängelfreiheit eines Fahrzeugs.
        </p>
      </section>
      <Footer />
    </main>
  );
}
