import type { Metadata } from "next";
import { PreparationPage } from "@/components/ui/preparation-page";

export const metadata: Metadata = {
  title: "Marktplatz | LUVIPRO",
  description: "Der LUVIPRO Marktplatz befindet sich in Vorbereitung.",
};

export default function MarketplacePage() {
  return (
    <PreparationPage
      eyebrow="Marktplatz"
      headline="Marketplace in Vorbereitung"
      text="Der LUVIPRO Marketplace wird künftig verifizierte Fahrzeugdaten, QR-Reports und strukturierte Inserate miteinander verbinden."
      cards={[
        { title: "Verifizierte Fahrzeugdaten", text: "in Vorbereitung" },
        { title: "QR-Reports", text: "in Vorbereitung" },
        { title: "Strukturierte Inserate", text: "in Vorbereitung" },
      ]}
      actions={[
        { label: "Interesse anmelden", href: "/contact", variant: "primary" },
        { label: "Fahrzeugverifizierung ansehen", href: "/verify" },
      ]}
    />
  );
}
