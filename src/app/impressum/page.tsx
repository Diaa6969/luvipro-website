import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/legal-page";
import { impressumIntro, impressumSections } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Impressum | LUVIPRO",
  description: "Impressum und Kontaktangaben der LUVIPRO Website.",
};

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      intro={impressumIntro}
      sections={impressumSections}
    />
  );
}
