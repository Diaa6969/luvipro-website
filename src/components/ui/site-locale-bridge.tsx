"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getPreferredSiteLocale, isSiteLocale, setPreferredSiteLocale, type SiteLocale } from "@/lib/site-locales";
import { LanguagePicker } from "@/components/ui/language-picker";

/**
 * Shared locale bridge for German canonical routes and all existing localized routes.
 * No third-party translation services, no user data leaves the browser.
 * German is always the default when no language was explicitly chosen.
 */
export function useSiteLocale(): SiteLocale {
  const path=usePathname();
  const [locale,setLocale]=useState<SiteLocale>("de");
  useEffect(()=>{
    const pathLocale=path.split("/")[1]||"";
    const queryLocale=new URLSearchParams(window.location.search).get("lang")||"";
    const selected=isSiteLocale(pathLocale)&&pathLocale!=="de" ? pathLocale
      : isSiteLocale(queryLocale) ? queryLocale : getPreferredSiteLocale();
    if(isSiteLocale(pathLocale)&&pathLocale!=="de" || isSiteLocale(queryLocale))setPreferredSiteLocale(selected);
    setLocale(selected);
    const update=()=>setLocale(getPreferredSiteLocale());
    window.addEventListener("luvipro:language-changed",update);
    window.addEventListener("storage",update);
    return ()=>{window.removeEventListener("luvipro:language-changed",update);window.removeEventListener("storage",update);};
  },[path]);
  return locale;
}

export function SiteLocaleBridge(){
  const locale=useSiteLocale();
  const path=usePathname();
  useEffect(()=>{
    document.documentElement.lang=locale;
    document.documentElement.dir=locale==="ar"?"rtl":"ltr";
  },[locale]);
  // The pre-existing home and translated section headers already include a picker.
  // On transactional pages, provide a visible picker without replacing navigation.
  const segment=path.split("/").filter(Boolean);
  const translatedHome=segment.length===1&&isSiteLocale(segment[0]);
  const translatedInfo=segment.length===2&&isSiteLocale(segment[0])&&["products","reports","workshops","contact","app"].includes(segment[1]);
  const germanPageWithNavbar=["/","/verify","/products","/reports","/contact","/partner-workshops","/app"].includes(path);
  if(translatedHome||translatedInfo||germanPageWithNavbar)return null;
  return <div className="fixed bottom-4 right-4 z-[100] rounded-full bg-[#101b32] shadow-xl shadow-black/60" dir="ltr"><LanguagePicker current={locale} compact /></div>;
}
