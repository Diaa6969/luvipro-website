import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EuropeanInner } from "@/components/international/european-home";
import { isSiteLocale, siteLocales } from "@/lib/site-locales";
import { siteTranslation } from "@/lib/site-translation";

const sections=["products","reports","workshops","contact","app"] as const;
type Section = (typeof sections)[number];
function isSection(value:string):value is Section {return (sections as readonly string[]).includes(value);}
export const dynamicParams=false;
export function generateStaticParams(){
  return siteLocales.filter(([locale])=>locale!=="de").flatMap(([locale])=>sections.map(section=>({locale,section})));
}
export async function generateMetadata({params}:{params:Promise<{locale:string;section:string}>}):Promise<Metadata>{
  const {locale,section}=await params;
  if(!isSiteLocale(locale)||locale==="de"||!isSection(section))return {};
  const t=siteTranslation(locale);
  const title=section==="products"?"LUVIPRO LU3656060":section==="reports"?t.reportTitle:
    section==="workshops"?t.partnerTitle:section==="contact"?t.navContact:t.app;
  const url=`https://luvipro.de/${locale}/${section}`;
  return {title:`${title} | LUVIPRO`,description: t.intro,
    alternates:{canonical:url},robots:{index:section!=="app",follow:true},
    openGraph:{title:`${title} | LUVIPRO`,description:t.intro,url,type:"website"}};
}
export default async function LocalizedInformationPage({params}:{params:Promise<{locale:string;section:string}>}){
  const {locale,section}=await params;
  if(!isSiteLocale(locale)||locale==="de"||!isSection(section)) notFound();
  return <EuropeanInner locale={locale} section={section}/>;
}
