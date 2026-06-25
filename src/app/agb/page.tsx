import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/legal-page";
import { agbIntro, agbSections } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen | LUVIPRO",
  description: "Allgemeine Geschäftsbedingungen für die Nutzung der LUVIPRO Dienste.",
};

export default function AgbPage() {
  return (
    <LegalPage
      title="Allgemeine Geschäftsbedingungen"
      intro={agbIntro}
      sections={agbSections}
    />
  );
}
