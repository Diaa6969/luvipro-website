import type { Metadata } from "next";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { WorkshopFinder } from "@/components/sections/workshop-finder";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";

export const metadata: Metadata = {
  title: "Partnerwerkstatt suchen | LUVIPRO",
  description: "LUVIPRO Partnerwerkstatt nach Ort oder PLZ finden und Verfügbarkeit einer Fahrzeugprüfung anfragen.",
  alternates: { canonical: "https://luvipro.de/partner-workshops" },
};

export default function PartnerWorkshopsPage() {
  return (
    <main className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />
      <section id="partner-map" className="section-shell scroll-mt-24 pb-24 pt-32 sm:pt-40">
        <WorkshopFinder locale="de" />
      </section>
      <Footer />
    </main>
  );
}
