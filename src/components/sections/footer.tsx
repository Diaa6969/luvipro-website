'use client';
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import {useSiteLocale} from "@/components/ui/site-locale-bridge";
import {siteTranslation} from "@/lib/site-translation";
import {marketCopy} from "@/lib/marketplace/market-copy";

const links = [
  { label: "Marketplace · Geprüfte Fahrzeuge", href: "/marketplace" },
  { label: "Partnerwerkstatt finden", href: "/partner-workshops" },
  { label: "Affiliate-Partner werden", href: "/affiliate" },
  { label: "Affiliate-Konto & Einnahmen", href: "/affiliate/login" },
  { label: "Affiliate AGB & Teilnahmebedingungen", href: "/affiliate/agb" },
  { label: "Prüfbericht per VIN / Nummer", href: "/reports" },
  { label: "Fahrzeug checken lassen", href: "/verify#partner-map" },
  { label: "Für Werkstätten: Gerät & Konditionen", href: "/products" },
  { label: "Kontakt", href: "/contact" },
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Konto löschen", href: "/konto-loeschen" },
  { label: "AGB", href: "/agb" },
];

export function Footer() {
  const locale=useSiteLocale();const t=siteTranslation(locale);const mc=marketCopy(locale);
  const label=(href:string,original:string):string=>{
   if(locale==='de')return original;
   if(href==='/marketplace')return 'Marketplace · '+mc.heading;
   if(href==='/partner-workshops'||href.startsWith('/verify'))return t.partnerCta;
   if(href==='/reports')return t.navReports;
   if(href==='/products')return t.navDevice;
   if(href==='/contact')return t.navContact;
   if(href==='/agb')return locale==='ar'?'الشروط والأحكام':'Terms & conditions';
   if(href==='/datenschutz')return locale==='ar'?'الخصوصية':'Privacy policy';
   if(href==='/impressum')return locale==='ar'?'البيانات القانونية':'Legal notice';
   if(href==='/affiliate')return locale==='ar'?'برنامج المسوّقين':'Affiliate program';
   if(href==='/affiliate/login')return locale==='ar'?'حساب المسوّق':'Affiliate account';
   return original;
  };

  return (
    <footer className="border-t border-white/10 bg-obsidian py-12">
      <div className="section-shell">
        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <BrandLogo size="footer" />
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">
              Automobil-Verifizierungs-Ökosystem für den deutschen Gebrauchtwagenmarkt.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
              >
                {label(link.href,link.label)}
                {link.href.startsWith("http") ? <ExternalLink className="h-3.5 w-3.5" /> : null}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 LUVIPRO. Alle Rechte vorbehalten.</p>
          <p>LUVIPRO · Professionelle UV-Fahrzeugprüfung und digitale Dokumentation.</p>
        </div>
      </div>
    </footer>
  );
}
