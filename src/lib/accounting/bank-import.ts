import { createHash } from "node:crypto";

export function parseBankStatement(source: string) {
  if (source.length > 500_000) throw new Error("Kontoauszug zu groß.");
  const lines = source.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  if (lines.shift() !== "Datum;Betrag;Währung;Transaktions-ID;Verwendungszweck") {
    throw new Error("CSV-Kopfzeile entspricht nicht der Importvorlage.");
  }
  if (!lines.length || lines.length > 2000) throw new Error("Ungültige Anzahl von Transaktionen.");
  const seen = new Set<string>();
  return lines.map((line, index) => {
    const match = /^(\d{4}-\d{2}-\d{2});(-?)(\d{1,9})[,.](\d{2});EUR;([\w.-]{1,120});(?:"((?:[^"]|"")*)"|([^";]*))$/.exec(line);
    if (!match) throw new Error("Ungültige CSV-Zeile " + (index + 2));
    const [, date, negative, whole, fraction, transactionId, quoted, plain] = match;
    const iso = new Date(date + "T00:00:00Z");
    if (!Number.isFinite(iso.valueOf()) || iso.toISOString().slice(0, 10) !== date) throw new Error("Ungültiges Buchungsdatum.");
    if (seen.has(transactionId)) throw new Error("Doppelte Transaktions-ID in der CSV.");
    seen.add(transactionId);
    const amountCents = (Number(whole) * 100 + Number(fraction)) * (negative ? -1 : 1);
    const reference = quoted?.replace(/""/g, '"') ?? plain;
    if (amountCents === 0 || reference.length > 500) throw new Error("Ungültiger Betrag oder Verwendungszweck.");
    return { date, transactionId, amountCents, reference, fingerprint: createHash("sha256").update(transactionId).digest("hex") };
  });
}
