/** All values in cents. Informational bookkeeping overview, NOT an official tax return. */
export type OutgoingInvoice = {
  id: string;
  invoice_number: string;
  invoice_date: string | null;
  created_at: string;
  delivery_state: string;
  net_cents: number | null;
  vat_cents: number | null;
  gross_cents: number | null;
  invoice_snapshot?: {
    kind?: string;
    customer?: { name?: string; email?: string };
    issuer?: { name?: string };
    paid?: boolean;
  } | null;
  pdf_base64?: string | null;
};
export const EXPENSE_CATEGORIES = ["waren", "software", "marketing", "miete", "buero", "personal", "transport", "sonstiges"] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomingInvoice = {
  id: string;
  supplier: string;
  supplier_invoice_number: string;
  invoice_date: string;
  category: ExpenseCategory;
  description: string;
  net_cents: number;
  vat_cents: number;
  gross_cents: number;
  vat_rate: number;
  vorsteuer_confirmed: boolean;
  paid: boolean;
  file_path: string;
  created_at: string;
};
export type MonthlyRow = {
  month: string;
  outgoingCount: number;
  incomingCount: number;
  revenueNet: number;
  revenueVat: number;
  revenueGross: number;
  costsNet: number;
  costsGross: number;
  inputVatConfirmed: number;
  vatBalance: number;
  netDifference: number;
  paidRevenueGross: number;
  unpaidCostGross: number;
};

const isSafeCents = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

export function safeVatSplit(grossCents: number, rate: 0 | 7 | 19) {
  if (!isSafeCents(grossCents) || grossCents > 100000000000) throw new Error("Invalid gross amount");
  const netCents = Math.round(grossCents * 100 / (100 + rate));
  return { netCents, vatCents: grossCents - netCents, grossCents };
}

export function validYear(year: number) {
  return Number.isInteger(year) && year >= 2020 && year <= 2100;
}
export function monthOf(date: string) {
  if (!/^\d{4}-(0[1-9]|1[012])-[0-3]\d$/.test(date)) return "";
  const d = new Date(date + "T00:00:00Z");
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === date ? date.slice(0, 7) : "";
}

/** Caller supplies only invoices issued by LUVIPRO (never workshops' own turnover).
 * Reserved drafts without an invoice are excluded; fully generated invoices\n * appear even if email delivery is pending. Monthly VAT is indicative; Soll-/Ist-
 * Versteuerung, corrections, import VAT and §19 UStG require tax review.
 */
export function buildMonthlyTable(year: number, outgoing: OutgoingInvoice[], incoming: IncomingInvoice[]): MonthlyRow[] {
  if (!validYear(year)) throw new Error("Invalid year");
  const rows: MonthlyRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    outgoingCount: 0, incomingCount: 0, revenueNet: 0, revenueVat: 0, revenueGross: 0,
    costsNet: 0, costsGross: 0, inputVatConfirmed: 0, vatBalance: 0,
    netDifference: 0, paidRevenueGross: 0, unpaidCostGross: 0,
  }));
  const byMonth = new Map(rows.map(row => [row.month, row]));

  for (const invoice of outgoing) {
    if (!["prepared", "sending", "sent", "failed"].includes(invoice.delivery_state) || !invoice.invoice_date) continue;
    const row = byMonth.get(monthOf(invoice.invoice_date));
    if (!row || !isSafeCents(invoice.net_cents) || !isSafeCents(invoice.vat_cents) || !isSafeCents(invoice.gross_cents)) continue;
    row.outgoingCount++;
    row.revenueNet += invoice.net_cents;
    row.revenueVat += invoice.vat_cents;
    row.revenueGross += invoice.gross_cents;
    if (invoice.invoice_snapshot?.paid) row.paidRevenueGross += invoice.gross_cents;
  }
  for (const expense of incoming) {
    const row = byMonth.get(monthOf(expense.invoice_date));
    if (!row || !isSafeCents(expense.net_cents) || !isSafeCents(expense.vat_cents) || !isSafeCents(expense.gross_cents)) continue;
    row.incomingCount++;
    row.costsGross += expense.gross_cents;
    const deductibleVat = expense.vorsteuer_confirmed ? expense.vat_cents : 0;
    row.inputVatConfirmed += deductibleVat;
    // Non-deductible VAT remains a business cash cost in this simplified view.
    row.costsNet += expense.gross_cents - deductibleVat;
    if (!expense.paid) row.unpaidCostGross += expense.gross_cents;
  }
  for (const row of rows) {
    row.vatBalance = row.revenueVat - row.inputVatConfirmed;
    row.netDifference = row.revenueNet - row.costsNet;
  }
  return rows;
}
export function sumMonths(rows: MonthlyRow[]) {
  return rows.reduce((sum, row) => {
    for (const key of Object.keys(row) as (keyof MonthlyRow)[]) {
      if (key !== "month") (sum[key] as number) += row[key] as number;
    }
    return sum;
  }, {
    month: "Gesamt", outgoingCount: 0, incomingCount: 0,
    revenueNet: 0, revenueVat: 0, revenueGross: 0, costsNet: 0,
    costsGross: 0, inputVatConfirmed: 0, vatBalance: 0, netDifference: 0,
    paidRevenueGross: 0, unpaidCostGross: 0,
  } as MonthlyRow);
}
