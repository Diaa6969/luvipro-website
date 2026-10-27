"use client";

import { useEffect } from "react";
import type { SiteLocale } from "@/lib/site-locales";

/** Align the document language/direction with the selected localized route.
 * Root HTML is server-rendered in German by the original single-root layout.
 */
export function DocumentLanguage({locale}:{locale:SiteLocale}) {
  useEffect(()=>{
    const html=document.documentElement;
    const previousLang=html.lang;
    const previousDir=html.dir;
    html.lang=locale;
    html.dir=locale==="ar"?"rtl":"ltr";
    return ()=>{html.lang=previousLang;html.dir=previousDir};
  },[locale]);
  return null;
}
