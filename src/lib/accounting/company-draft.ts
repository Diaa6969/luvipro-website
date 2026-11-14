export const companyFields = [
  ["name", "Firma"], ["legalForm", "Rechtsform"], ["street", "Straße und Hausnummer"],
  ["postalCode", "Postleitzahl"], ["city", "Ort"], ["seat", "Sitz"],
  ["court", "Registergericht"], ["registration", "Handelsregisternummer"],
  ["director", "Geschäftsführung"], ["email", "Geschäftliche E-Mail"],
  ["taxNumber", "Steuernummer"], ["vatId", "USt-IdNr."], ["vatTreatment", "Umsatzsteuerliche Behandlung"],
  ["bankHolder", "Kontoinhaber"], ["iban", "IBAN"], ["bic", "BIC"],
  ["paymentTerms", "Zahlungsbedingungen"], ["financialYear", "Wirtschaftsjahr"],
  ["accountingStart", "Buchführungsbeginn"], ["chart", "Geprüfter Kontenrahmen"],
] as const;

export function parseCompanyDraft(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Ungültiger Entwurf.");
  const record = input as Record<string, unknown>;
  const details: Record<string, string> = {};
  for (const [key] of companyFields) {
    const value = record[key];
    if (value === undefined) continue;
    if (typeof value !== "string" || value.length > 250 || /[\x00-\x1f\x7f]/.test(value)) {
      throw new Error("Ungültiges Feld.");
    }
    details[key] = value.trim();
  }
  return details;
}
