import type { Metadata } from "next";
import Link from 'next/link';
import {AnimatedAtmosphere} from '@/components/ui/animated-atmosphere';
import {MarketBrowse} from '@/components/marketplace/browse';

export const metadata: Metadata = {
  title: "LUVIPRO Marketplace | Geprüfte Fahrzeuge",
  robots: { index: false, follow: true },
};

export default function MarketplacePage() {
  return <main className="relative min-h-screen bg-[#050611] px-5 py-14 text-white"><AnimatedAtmosphere/><div className="relative mx-auto max-w-7xl"><nav className="mb-10 flex flex-wrap gap-5 text-cyan-300"><Link href="/">LUVIPRO</Link><Link href="/marketplace/mine">Meine Inserate</Link><Link href="/marketplace/favorites">Merkliste</Link><Link href="/marketplace/inquiries">Anfragen</Link></nav><p className="text-sm uppercase tracking-[.3em] text-cyan-300">LUVIPRO Marketplace</p><h1 className="my-5 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">Geprüfte Fahrzeuge.<br/><span className="text-violet-300">Transparente Informationen.</span><br/>Bessere Entscheidungen.</h1><p className="mb-7 max-w-2xl text-slate-300">Jedes veröffentlichte Fahrzeug ist mit einem passenden LUVIPRO Prüfbericht verknüpft. Ein Bericht beschreibt den Prüfzeitpunkt und garantiert weder den vollständigen Zustand noch rechtliches Eigentum.</p><Link href="/marketplace/create" className="mb-10 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold">Fahrzeug inserieren</Link><MarketBrowse/></div></main>;
}
