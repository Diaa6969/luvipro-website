/** Central pricing reference for LUVIPRO workshop inspection services. */
export const INSPECTION_SERVICES = [
  {
    id: "standard",
    name: "Standard",
    priceCents: 5999,
    features: [
      "UV-gestützte Lackprüfung",
      "Sichtprüfung der Karosserie",
      "Innenraumkontrolle",
      "Strukturierte Dokumentation",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceCents: 11999,
    features: [
      "Alle Leistungen des Standard-Checks",
      "Auslesen der Fehlercodes",
      "Lackschichtdickenmessung",
      "Erweiterte Dokumentation",
    ],
  },
] as const;

/** Only confirmed workshop locations appear in availability search. */
export const INSPECTION_PRICING_NOTE =
  "Verfügbarkeit abhängig vom Standort der Partnerwerkstatt. Über die Werkstattsuche finden Sie bestätigte Partner; Leistungsumfang und Termin werden von der Werkstatt vereinbart.";
