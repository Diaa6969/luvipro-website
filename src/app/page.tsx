import { languageAlternates } from "@/lib/site-locales";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://luvipro.de/",
    languages: languageAlternates,
  },
};

import { CinemaEnding, CinemaStory } from "@/components/sections/cinema-story";
import { Footer } from "@/components/sections/footer";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Navbar } from "@/components/sections/navbar";
import { PartnerMap } from "@/components/sections/partner-map";
import { Pricing } from "@/components/sections/pricing";
import { SecurityTrust } from "@/components/sections/security-trust";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";

export default function Home() {
  return (
    <main className="cinematic-page min-h-screen overflow-x-clip bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />
      <CinemaStory />
      <HowItWorks />
      <Pricing />
      <PartnerMap />
      <SecurityTrust />
      <CinemaEnding />
      <Footer />
    </main>
  );
}
