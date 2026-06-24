import { Menu } from "lucide-react";
import Link from "next/link";
import { CtaLink } from "@/components/ui/cta-link";
import { BrandLogo } from "@/components/ui/brand-logo";

const navItems = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "UV-Gerät", href: "#scanner" },
  { label: "Ablauf", href: "#how-it-works" },
  { label: "Preise", href: "#pricing" },
  { label: "Marktplatz", href: "#marketplace" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-obsidian/72 backdrop-blur-xl">
      <nav className="section-shell flex h-20 items-center justify-between">
        <BrandLogo />

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <CtaLink href="/verify" variant="secondary">
            Fahrzeug prüfen
          </CtaLink>
          <CtaLink href="/partner-workshops">Partner werden</CtaLink>
        </div>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white lg:hidden"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </button>
      </nav>
    </header>
  );
}
