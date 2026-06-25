import type { Metadata } from "next";
import { PreparationPage } from "@/components/ui/preparation-page";

export const metadata: Metadata = {
  title: "LUVIPRO App | In Vorbereitung",
  description: "Die LUVIPRO App befindet sich in Vorbereitung.",
};

export default function AppPage() {
  return (
    <PreparationPage
      eyebrow="LUVIPRO App"
      headline="Die LUVIPRO App befindet sich in Vorbereitung."
      text="Die LUVIPRO App wird künftig VIN-Suche, Fahrzeugverifizierung, Fahrzeugschein-OCR, UV-Prüfdokumentation, QR-Reports und Partnerwerkstatt-Funktionen in einem digitalen System verbinden."
      note="Die Web-App wird später unter app.luvipro.de bereitgestellt."
      cards={[
        { title: "VIN-Suche", text: "in Vorbereitung" },
        { title: "Fahrzeugschein-OCR", text: "in Vorbereitung" },
        { title: "UV-Prüfdokumentation", text: "in Vorbereitung" },
        { title: "QR-Reports", text: "in Vorbereitung" },
        { title: "Partnerwerkstatt-Zugang", text: "in Vorbereitung" },
        { title: "Marketplace-Anbindung", text: "in Vorbereitung" },
      ]}
      actions={[{ label: "Kontakt aufnehmen", href: "/contact", variant: "primary" }]}
    />
  );
}
