import type { Metadata } from "next";
import { PreparationPage } from "@/components/ui/preparation-page";

export const metadata: Metadata = {
  title: "Fahrzeug verifizieren | LUVIPRO",
  description: "Die digitale Fahrzeugverifizierung über LUVIPRO befindet sich derzeit im Aufbau.",
};

export default function VerifyPage() {
  return (
    <PreparationPage
      eyebrow="Fahrzeug verifizieren"
      headline="Fahrzeugverifizierung in Vorbereitung"
      text="Die digitale Fahrzeugverifizierung über LUVIPRO befindet sich derzeit im Aufbau. Künftig können Fahrzeuge über VIN, UV-Prüfdaten, QR-Sticker und digitale Reports nachvollziehbar dokumentiert werden."
      cards={[
        { title: "Für Käufer", text: "Fahrzeughistorie transparenter prüfen" },
        { title: "Für Verkäufer", text: "geprüfte Fahrzeuge besser präsentieren" },
        { title: "Für Partnerwerkstätten", text: "Prüfungen digital dokumentieren" },
        { title: "Für Marktplatz", text: "verifizierte Inserate vorbereiten" },
      ]}
      actions={[
        { label: "Partnerwerkstatt werden", href: "/contact", variant: "primary" },
        { label: "Mehr über Produkte erfahren", href: "/products" },
      ]}
    />
  );
}
