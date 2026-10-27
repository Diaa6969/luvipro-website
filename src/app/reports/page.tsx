import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";
import { ReportLookup } from "@/components/reports/report-lookup";

export const metadata: Metadata = {
  title: "Fahrzeugbericht über VIN oder Berichtsnummer | LUVIPRO",
  description: "LUVIPRO Fahrzeugbericht mit FIN/VIN oder individueller Berichtsnummer suchen. Geschützter Zugriff für berechtigte Nutzer nach Freigabe und Kauf.",
  alternates: { canonical: "https://luvipro.de/reports" },
  robots: { index: true, follow: true },
};

export default function ReportsPage() {
  return (
    <main className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />
      <section className="section-shell pb-20 pt-32 sm:pt-40">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-pulse">Digitale Fahrzeugberichte</p>
          <h1 className="mt-5 max-w-3xl font-[var(--font-space-grotesk)] text-4xl font-semibold leading-tight sm:text-6xl">
            Prüfbericht per VIN oder Nummer.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Die Suche erfolgt über die FIN/VIN oder die individuelle Berichtsnummer,
            ohne Aufkleber oder Scan. Der Download setzt einen autorisierten Zugang zum Bericht voraus.
          </p>
        </div>
        <div className="mt-12 max-w-3xl"><ReportLookup /></div>
        <p className="mt-8 text-sm leading-7 text-slate-400">
          Noch kein Fahrzeugbericht vorhanden? <Link href="/verify#partner-map" className="font-semibold text-pulse underline">Partnerwerkstatt suchen</Link>
        </p>
      </section>
      <Footer />
    </main>
  );
}
