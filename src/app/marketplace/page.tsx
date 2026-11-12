import { VehicleExperience } from "@/components/cinema/vehicle-experience";
import type { Metadata } from "next";
import {AnimatedAtmosphere} from '@/components/ui/animated-atmosphere';
import {MarketBrowse} from '@/components/marketplace/browse';
import {MarketplaceIntro} from '@/components/marketplace/intro';

export const metadata: Metadata = {
  title: "LUVIPRO Marketplace | Geprüfte Fahrzeuge",
  robots: { index: false, follow: true },
};

export default function MarketplacePage() {
  return <main className="relative min-h-screen bg-[#050611] px-5 py-14 text-white"><AnimatedAtmosphere/><div className="relative mx-auto max-w-7xl"><MarketplaceIntro/><div className="mb-8"><VehicleExperience scene={7} /></div><MarketBrowse/></div></main>;
}
