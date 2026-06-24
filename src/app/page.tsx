import { AppComingSoon } from "@/components/sections/app-coming-soon";
import { Ecosystem } from "@/components/sections/ecosystem";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { MarketplacePreview } from "@/components/sections/marketplace-preview";
import { Navbar } from "@/components/sections/navbar";
import { OcrVerification } from "@/components/sections/ocr-verification";
import { PartnerMap } from "@/components/sections/partner-map";
import { Pricing } from "@/components/sections/pricing";
import { Problem } from "@/components/sections/problem";
import { SecurityTrust } from "@/components/sections/security-trust";
import { UvScanner } from "@/components/sections/uv-scanner";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";

export default function Home() {
  return (
    <main className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />
      <Hero />
      <Problem />
      <Ecosystem />
      <UvScanner />
      <OcrVerification />
      <HowItWorks />
      <Pricing />
      <PartnerMap />
      <MarketplacePreview />
      <AppComingSoon />
      <SecurityTrust />
      <FinalCta />
      <Footer />
    </main>
  );
}
