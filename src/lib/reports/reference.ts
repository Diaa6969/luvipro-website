export type ReportSearchMode = "vin" | "report";

/** Search identifiers; never use them as proof of report ownership or payment. */
export function normalizeReportReference(value: string): string {
  return value.trim().toUpperCase().replace(/\s/g, "");
}
export function validReportReference(mode: ReportSearchMode, value: string): boolean {
  if (mode === "vin") return /^[A-HJ-NPR-Z0-9]{17}$/.test(value);
  if (mode === "report") return /^[A-Z0-9][A-Z0-9-]{5,63}$/.test(value);
  return false;
}
