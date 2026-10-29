import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/ui/legal-page";
import { affiliateAgbIntro, affiliateAgbSections } from "@/lib/affiliate/terms";

export const metadata: Metadata = {
  title: "Affiliate-Teilnahmebedingungen & AGB | LUVIPRO",
  description: "Gewerbliche Affiliate-Bedingungen: Provisionsberechnung, Bruttovergütung einschließlich Umsatzsteuer, Steuern, Werbepflichten, Gutschriften und monatliche Abrechnung.",
  alternates: { canonical: "https://luvipro.de/affiliate/agb" },
};

export default function AffiliateAgbPage() {
  return <>
    <LegalPage
      title="Affiliate-Teilnahmebedingungen (AGB)"
      intro={affiliateAgbIntro}
      sections={affiliateAgbSections}
    />
    <div className="section-shell -mt-14 pb-16 text-center">
      <Link href="/affiliate" className="inline-flex rounded-xl border border-violet-400/40 px-6 py-3 font-semibold text-white hover:bg-violet-500/20">
        Zur Affiliate-Bewerbung →
      </Link>
    </div>
  </>;
}
