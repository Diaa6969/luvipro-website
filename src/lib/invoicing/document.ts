import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { calculateInvoicePricing, invoiceReference, moneyEUR, type InvoiceKind } from "./prices";

export type InvoiceParty = {
  name: string;
  address1: string;
  postalCode: string;
  city: string;
  country: "DE";
};

export type InvoiceIssuer = InvoiceParty & {
  taxNumberOrVatId: string;
  email: string;
  bankIban?: string;
  bankAccountHolder?: string;
};

export type InvoiceData = {
  invoiceNumber: string;
  kind: InvoiceKind;
  quantity: number;
  invoiceDate: string; // yyyy-mm-dd
  serviceDate: string; // actual supply or performance date
  issuer: InvoiceIssuer;
  customer: InvoiceParty & { email: string };
  paid: boolean;
  /** A preview always carries a non-invoice watermark and must never be sent. */
  demo: boolean;
};

function assertDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value + "T00:00:00Z"))) {
    throw new Error("Missing or invalid invoice/performance date");
  }
}

function requireParty(p: InvoiceParty) {
  if (!p.name.trim() || !p.address1.trim() || !p.postalCode.trim() || !p.city.trim() || p.country !== "DE") {
    throw new Error("Invoice parties need full German billing address");
  }
  if ([p.name, p.address1, p.postalCode, p.city].some(x => x.length > 130 || /[\r\n]/.test(x))) {
    throw new Error("Invalid invoice billing address");
  }
}

export function validateInvoice(d: InvoiceData) {
  invoiceReference(d.invoiceNumber);
  assertDate(d.invoiceDate);
  assertDate(d.serviceDate);
  requireParty(d.issuer);
  requireParty(d.customer);
  if (!d.issuer.taxNumberOrVatId.trim() || !d.issuer.email.trim() || !d.customer.email.trim()) {
    throw new Error("Issuer tax ID and both contact emails are mandatory");
  }
  if (!d.paid && (!d.issuer.bankIban || !d.issuer.bankAccountHolder)) {
    throw new Error("An unpaid invoice needs an approved bank account");
  }
  if (d.kind !== "device" && !d.demo && !d.issuer.taxNumberOrVatId) {
    throw new Error("Inspection must be invoiced by the actual supplying workshop");
  }
  return calculateInvoicePricing(d.kind, d.quantity);
}

function short(value: string, max: number) {
  return value.length > max ? value.slice(0, max - 3) + "..." : value;
}
function germanDate(v: string) {
  const [yyyy, mm, dd] = v.split("-");
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * German-language invoice PDF. This is a human-readable PDF (Sonstige Rechnung),
 * NOT a structured EN 16931 / XRechnung / ZUGFeRD e-invoice.
 */
export async function renderInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const pricing = validateInvoice(data);
  const doc = await PDFDocument.create();
  doc.setTitle(`${data.demo ? "MUSTER - " : ""}Rechnung ${data.invoiceNumber}`);
  doc.setProducer("LUVIPRO Billing");
  doc.setAuthor(data.issuer.name);
  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.06, 0.08, 0.14);
  const violet = rgb(0.42, 0.24, 0.83);
  const slate = rgb(0.40, 0.44, 0.51);
  const grey = rgb(0.91, 0.93, 0.96);
  const left = 48;
  const right = 547;
  const text = (value: string, x: number, y: number, opts?: {
    size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>;
  }) => {
    page.drawText(value, { x, y, size: opts?.size ?? 10, font: opts?.font ?? regular, color: opts?.color ?? dark });
  };
  const rightText = (value: string, y: number, opts?: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> }) => {
    const font = opts?.font ?? regular;
    const size = opts?.size ?? 10;
    text(value, right - font.widthOfTextAtSize(value, size), y, opts);
  };
  const line = (y: number) => page.drawLine({
    start: { x: left, y }, end: { x: right, y }, thickness: 0.7, color: grey,
  });

  page.drawRectangle({ x: 0, y: 779, width: 595.28, height: 63, color: dark });
  text("LUVIPRO", left, 802, { size: 23, font: bold, color: rgb(1, 1, 1) });
  rightText(data.demo ? "MUSTER / KEINE RECHNUNG" : "RECHNUNG", 805, { size: 13, font: bold, color: rgb(0.53, 0.76, 1) });

  if (data.demo) {
    page.drawRectangle({ x: 0, y: 713, width: 595, height: 26, color: rgb(0.99, 0.93, 0.77) });
    text("TESTDATEN - NICHT BEZAHLEN - KEIN STEUERDOKUMENT", 91, 721, { font: bold, size: 10 });
  }

  text(short(data.issuer.name, 72), left, 752, { size: 10, font: bold });
  text(short(data.issuer.address1 + ", " + data.issuer.postalCode + " " + data.issuer.city, 85), left, 736, { size: 9, color: slate });

  text("Rechnung an:", left, 684, { font: bold, size: 10, color: violet });
  [data.customer.name, data.customer.address1, data.customer.postalCode + " " + data.customer.city, "Deutschland"].forEach((v, i) => {
    text(short(v, 66), left, 666 - 16 * i, { size: 10 });
  });
  text("Rechnungsnummer:", 345, 683, { font: bold, size: 9 });
  rightText(data.invoiceNumber, 668, { font: bold, size: 11, color: violet });
  text("Rechnungsdatum:", 345, 646, { font: bold, size: 9 });
  rightText(germanDate(data.invoiceDate), 631);
  text("Leistungs-/Lieferdatum:", 345, 611, { font: bold, size: 9 });
  rightText(germanDate(data.serviceDate), 596);

  const headersY = 553;
  page.drawRectangle({ x: left, y: headersY - 5, width: right - left, height: 30, color: grey });
  text("Leistung / Artikel", 58, headersY + 5, { font: bold, size: 10 });
  rightText("Betrag brutto", headersY + 5, { font: bold, size: 10 });

  let y = 524;
  for (const item of pricing.lines) {
    text(short(item.description, 66), 58, y, { size: 9 });
    text(`Menge: ${item.quantity}  |  19 % USt.`, 58, y - 15, { size: 8, color: slate });
    rightText(moneyEUR(item.grossCents), y, { size: 10, font: bold });
    line(y - 27);
    y -= 57;
  }

  const totalsY = y - 20;
  text("Nettobetrag", 344, totalsY, { size: 10 });
  rightText(moneyEUR(pricing.netCents), totalsY, { size: 10 });
  text("Umsatzsteuer 19 %", 344, totalsY - 24, { size: 10 });
  rightText(moneyEUR(pricing.vatCents), totalsY - 24, { size: 10 });
  page.drawRectangle({ x: 336, y: totalsY - 76, width: 211, height: 39, color: grey });
  text("Gesamtbetrag", 344, totalsY - 60, { font: bold, size: 11 });
  rightText(moneyEUR(pricing.grossCents), totalsY - 60, { font: bold, size: 12, color: violet });

  const noteY = Math.min(totalsY - 110, 265);
  text("Zahlungsinformationen", left, noteY, { font: bold, size: 12 });
  text("Verwendungszweck: " + data.invoiceNumber, left, noteY - 23, { font: bold, size: 10 });
  if (data.paid) {
    text("Zahlungsstatus: bezahlt", left, noteY - 43, { size: 10 });
  } else {
    text("Zahlungsstatus: offen", left, noteY - 43, { size: 10 });
    text("Kontoinhaber: " + short(data.issuer.bankAccountHolder || "", 54), left, noteY - 64, { size: 9 });
    text("IBAN: " + short(data.issuer.bankIban || "", 43), left, noteY - 80, { size: 9 });
  }

  line(100);
  text(short(data.issuer.name + " | " + data.issuer.address1 + " | " + data.issuer.postalCode + " " + data.issuer.city, 92), left, 81, { size: 8, color: slate });
  text(short("Steuernummer / USt-IdNr.: " + data.issuer.taxNumberOrVatId, 88), left, 67, { size: 8, color: slate });
  text(short(data.issuer.email, 80), left, 53, { size: 8, color: slate });
  return doc.save();
}

export function configuredDeviceIssuer(): InvoiceIssuer | null {
  const v = {
    name: process.env.INVOICE_SELLER_NAME || "",
    address1: process.env.INVOICE_SELLER_STREET || "",
    postalCode: process.env.INVOICE_SELLER_PLZ || "",
    city: process.env.INVOICE_SELLER_CITY || "",
    country: "DE" as const,
    taxNumberOrVatId: process.env.INVOICE_SELLER_TAX_ID || "",
    email: process.env.SMTP_USER || "",
    bankIban: process.env.INVOICE_SELLER_IBAN || undefined,
    bankAccountHolder: process.env.INVOICE_SELLER_BANK_HOLDER || undefined,
  };
  try {
    requireParty(v);
    if (!v.taxNumberOrVatId || !v.email) return null;
    return v;
  } catch {
    return null;
  }
}
