import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/legal-page";
import { datenschutzIntro, datenschutzSections } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | LUVIPRO",
  description: "Datenschutzerklärung der LUVIPRO Website und digitalen Dienste.",
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      intro={datenschutzIntro}
      sections={datenschutzSections}
    />
  );
}
