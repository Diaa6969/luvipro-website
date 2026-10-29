import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/legal-page";
import { affiliateAgbIntro, affiliateAgbSections } from "@/lib/affiliate/terms";

export const metadata: Metadata = {
  title: "Affiliate-Teilnahmebedingungen & AGB | LUVIPRO",
  description: "Gewerbliche Affiliate-Bedingungen: Provisionsberechnung, Bruttovergütung einschließlich Umsatzsteuer, Steuern, Werbepflichten, Gutschriften und monatliche Abrechnung.",
  alternates: { canonical: "https://luvipro.de/affiliate/agb" },
};

export default function AffiliateAgbPage() {
  return (
    <LegalPage
      title="Affiliate-Teilnahmebedingungen (AGB)"
      intro={affiliateAgbIntro}
      sections={affiliateAgbSections}
    />
  );
}
