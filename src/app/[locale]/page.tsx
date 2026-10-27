import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EuropeanHome } from "@/components/international/european-home";
import { isSiteLocale, siteLocales, localeHome, languageAlternates } from "@/lib/site-locales";
import { siteTranslation } from "@/lib/site-translation";

export const dynamicParams = false;
export function generateStaticParams() {
  // English and Arabic already have full dedicated homepages, German is root.
  return siteLocales.filter(([code])=>!["de","en","ar"].includes(code)).map(([locale])=>({locale}));
}
export async function generateMetadata({params}: {params:Promise<{locale:string}>}):Promise<Metadata> {
  const {locale} = await params;
  if(!isSiteLocale(locale) || ["de","en","ar"].includes(locale)) return {};
  const t=siteTranslation(locale);
  const canonical="https://luvipro.de"+localeHome(locale);
  return {
    title:`LUVIPRO | ${t.headline}`,
    description:t.intro,
    alternates:{canonical,languages:languageAlternates},
    openGraph:{title:`LUVIPRO | ${t.headline}`,description:t.intro,url:canonical,type:"website"},
  };
}
export default async function EuropeanLocalePage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  if (!isSiteLocale(locale)||["de","en","ar"].includes(locale)) notFound();
  return <EuropeanHome locale={locale}/>;
}
