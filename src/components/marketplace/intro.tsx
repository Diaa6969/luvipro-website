"use client";
import Link from 'next/link';
import {useSiteLocale} from '@/components/ui/site-locale-bridge';
import {marketCopy} from '@/lib/marketplace/market-copy';

/** Visitor-facing marketplace information is translated. Report data is not. */
export function MarketplaceIntro(){
 const locale=useSiteLocale();const t=marketCopy(locale);
 return <>
  <nav className="mb-10 flex flex-wrap gap-5 text-cyan-300" aria-label={t.heading}>
   <Link href="/">{locale==='ar'?'الرئيسية':locale==='de'?'Startseite':'Home'}</Link>
   <Link href="/marketplace/mine">{t.myListings}</Link>
   <Link href="/marketplace/favorites">{t.favorites}</Link>
   <Link href="/marketplace/inquiries">{t.inquiries}</Link>
  </nav>
  <p className="text-sm uppercase tracking-[.3em] text-cyan-300">LUVIPRO Marketplace</p>
  <h1 className="my-5 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">{t.heading}</h1>
  <p className="mb-7 max-w-2xl text-slate-300">{locale==='de'
    ? 'Jedes veröffentlichte Fahrzeug ist mit einem passenden LUVIPRO Prüfbericht verknüpft. Der Prüfbericht beschreibt den Zustand zum Prüfzeitpunkt und ist keine Mängelfreiheitsgarantie.'
    : locale==='ar'
    ? 'كل سيارة منشورة مرتبطة بتقرير فحص LUVIPRO. يصف التقرير حالة السيارة وقت الفحص، ولا يضمن خلوها من العيوب.'
    : 'Every published vehicle is linked to a LUVIPRO inspection report. The report documents the inspection date and does not guarantee a defect-free vehicle.'}</p>
  <Link href="/marketplace/create" className="mb-10 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold">{t.insert}</Link>
 </>;
}
