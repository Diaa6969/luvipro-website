/** Central pricing reference for planned LUVIPRO workshop inspection services. */
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

/** Both plans are prospective. Do not take payment or claim inspections are bookable. */
export const INSPECTION_PRICING_NOTE =
  "Geplante Leistungen über teilnehmende Partnerwerkstätten. Die Verfügbarkeit wird gesondert bekanntgegeben; der konkrete Leistungsumfang wird vor einer Buchung bestätigt.";
