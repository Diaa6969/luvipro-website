import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/legal-page";
import Link from "next/link";
import { agbIntro, agbSections } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen | LUVIPRO",
  description: "Allgemeine Geschäftsbedingungen für die Nutzung der LUVIPRO Dienste.",
};

export default function AgbPage() {
  return (
    <>
      <div className="section-shell pt-28"><p className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-5 text-sm text-slate-200">Für gewerbliche Werbe- und Affiliate-Partner gelten ergänzend die <Link href="/affiliate/agb" className="font-semibold text-pulse underline">Affiliate-Teilnahmebedingungen (AGB)</Link>.</p></div>
      <LegalPage title="Allgemeine Geschäftsbedingungen" intro={agbIntro} sections={agbSections} />
    </>
  );
}
