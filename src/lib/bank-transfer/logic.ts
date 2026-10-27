import { calculateInvoicePricing, moneyEUR } from "@/lib/invoicing/prices";

export type BankOrder = {
  id: string; request_key: string; invoice_id: string; invoice_number: string;
  customer_company: string; customer_contact: string; customer_email: string;
  customer_address: string; customer_postal_code: string; customer_city: string;
  customer_phone: string; quantity: number;
  net_cents: number; vat_cents: number; gross_cents: number;
  payment_status: "pending" | "paid" | "cancelled";
  payment_mail_status: "pending" | "sending" | "sent" | "failed";
  payment_mail_sent_at: string | null; paid_at: string | null;
  bank_transaction_reference: string | null; reminder_count: number;
  reminder_claimed_at: string | null; last_reminded_at: string | null;
  created_at: string; updated_at: string;
};

export type BankDetails = { iban: string; holder: string; bic?: string };
export function assertBankOrder(order: BankOrder) {
  const totals = calculateInvoicePricing("device", order.quantity);
  if (order.net_cents !== totals.netCents || order.vat_cents !== totals.vatCents ||
      order.gross_cents !== totals.grossCents ||
      !/^LUV-\d{4}-\d{7,}$/.test(order.invoice_number)) {
    throw new Error("Bank order financial snapshot invalid - manual review");
  }
  return totals;
}
export function germanDay(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.valueOf())) return "–";
  return new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
export function bankPaymentRequest(order: BankOrder, bank: BankDetails) {
  assertBankOrder(order);
  return {
    subject: `LUVIPRO – Zahlungsinformationen ${order.invoice_number}`,
    text: [
      `Guten Tag ${order.customer_contact},`,
      "",
      "vielen Dank für Ihre Bestellung bei LUVIPRO.",
      "Sie haben Banküberweisung (Vorkasse) gewählt. Die Bestellung wird",
      "erst nach Eingang und Prüfung der Zahlung für die Bearbeitung freigegeben.",
      "",
      `Bestell- und Rechnungsreferenz: ${order.invoice_number}`,
      `Artikel: LUVIPRO LU3656060 · Anzahl: ${order.quantity}`,
      `Betrag netto inkl. Versand: ${moneyEUR(order.net_cents)}`,
      `Umsatzsteuer (19 %): ${moneyEUR(order.vat_cents)}`,
      `Gesamtbetrag: ${moneyEUR(order.gross_cents)}`,
      "",
      "Bitte überweisen Sie den Gesamtbetrag mit folgenden Angaben:",
      `Empfänger: ${bank.holder}`,
      `IBAN: ${bank.iban}`,
      ...(bank.bic ? [`BIC: ${bank.bic}`] : []),
      `Verwendungszweck: ${order.invoice_number}`,
      "",
      "Wichtig: Bitte geben Sie den Verwendungszweck exakt an, damit wir",
      "Ihre Zahlung eindeutig zuordnen können.",
      "",
      "Dies ist eine Zahlungsaufforderung für Vorkasse, keine endgültige",
      "steuerliche Rechnung. Eine ordnungsgemäße Rechnung folgt entsprechend",
      "dem tatsächlichen Zahlungs- und Lieferablauf.",
      "",
      "Falls Sie Fragen haben, antworten Sie bitte auf diese E-Mail.",
      "Mit freundlichen Grüßen",
      "Ihr LUVIPRO-Team",
    ].join("\n"),
  };
}

export function bankPaymentReminder(order: BankOrder, bank: BankDetails) {
  assertBankOrder(order);
  if (order.payment_status !== "pending") throw new Error("Do not remind paid or cancelled bank orders");
  return {
    subject: `LUVIPRO – Freundliche Zahlungserinnerung ${order.invoice_number}`,
    text: [
      `Guten Tag ${order.customer_contact},`,
      "",
      `zu Ihrer LUVIPRO-Bestellung vom ${germanDay(order.created_at)}`,
      "konnten wir bislang noch keinen Zahlungseingang zuordnen.",
      "Möglicherweise hat sich die Überweisung mit dieser Nachricht überschnitten.",
      "",
      `Bestell- und Rechnungsreferenz: ${order.invoice_number}`,
      `Artikel: LUVIPRO LU3656060 · Anzahl: ${order.quantity}`,
      `Offener Betrag: ${moneyEUR(order.gross_cents)}`,
      "",
      "Bankverbindung:",
      `Kontoinhaber: ${bank.holder}`,
      `IBAN: ${bank.iban}`,
      ...(bank.bic ? [`BIC: ${bank.bic}`] : []),
      `Verwendungszweck: ${order.invoice_number}`,
      "",
      "Falls Sie bereits überwiesen haben, betrachten Sie diese Nachricht",
      "bitte als gegenstandslos. Gern können Sie uns den Überweisungsbeleg",
      "unter Angabe der Referenz zusenden.",
      "",
      "Vielen Dank und freundliche Grüße",
      "Ihr LUVIPRO-Team",
    ].join("\n"),
  };
}
