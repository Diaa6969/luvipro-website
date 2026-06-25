import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

const links = [
  { label: "Partnerwerkstatt", href: "/partner-workshops" },
  { label: "Fahrzeug verifizieren", href: "/verify" },
  { label: "Marktplatz", href: "/marketplace" },
  { label: "App-Frühzugang", href: "/app" },
  { label: "Unser Shop", href: "https://luvipro.shop" },
  { label: "Kontakt", href: "/contact" },
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
];

export function Footer() {
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
                className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
              >
                {link.label}
                {link.href.startsWith("http") ? <ExternalLink className="h-3.5 w-3.5" /> : null}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 LUVIPRO. Alle Rechte vorbehalten.</p>
          <p>Oberflächen-MVP. Platzhalter-Links und Platzhaltergrafiken.</p>
        </div>
      </div>
    </footer>
  );
}
