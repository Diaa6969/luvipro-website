import { DEVICE } from "@/lib/store";
import { INSPECTION_SERVICES } from "@/lib/inspection-pricing";

/**
 * All monetary values are integer euro cents. Only standard domestic German
 * VAT (19%) is modeled. EU/international, reduced/exempt and Kleinunternehmer
 * cases must be evaluated separately; never silently classify them as 19%.
 */
export const DOMESTIC_VAT_PERCENT = 19 as const;

export type InvoiceKind = "device" | "inspection_standard" | "inspection_premium";
export type InvoicePricingLine = {
  description: string;
  quantity: number;
  taxRatePercent: 19;
  netCents: number;
  vatCents: number;
  grossCents: number;
};

export type InvoicePricing = {
  kind: InvoiceKind;
  lines: InvoicePricingLine[];
  netCents: number;
  vatCents: number;
  grossCents: number;
};

/** Business hardware price is EXCLUSIVE of VAT. */
export function netLine(description: string, netUnitCents: number, quantity = 1): InvoicePricingLine {
  assertMoney(netUnitCents, quantity);
  const netCents = netUnitCents * quantity;
  const vatCents = Math.round((netCents * DOMESTIC_VAT_PERCENT) / 100);
  return { description, quantity, taxRatePercent: 19, netCents, vatCents, grossCents: netCents + vatCents };
}

/** Standard/Premium public service prices are INCLUSIVE of VAT. */
export function grossLine(description: string, grossCents: number): InvoicePricingLine {
  assertMoney(grossCents, 1);
  const netCents = Math.round((grossCents * 100) / 119);
  return { description, quantity: 1, taxRatePercent: 19, netCents, vatCents: grossCents - netCents, grossCents };
}

function assertMoney(cents: number, quantity: number) {
  if (!Number.isSafeInteger(cents) || cents < 0 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10 || !Number.isSafeInteger(cents * quantity)) {
    throw new Error("Invalid monetary amount or quantity");
  }
}

export function calculateInvoicePricing(kind: InvoiceKind, quantity = 1): InvoicePricing {
  let lines: InvoicePricingLine[];
  if (kind === "device") {
    assertMoney(DEVICE.unitPriceNetCents, quantity);
    lines = [
      netLine("LUVIPRO LU3656060 - UV-Pruefgeraet 365 nm", DEVICE.unitPriceNetCents, quantity),
      netLine("Versand innerhalb Deutschlands (je Bestellung)", DEVICE.shippingNetCentsGermany),
    ];
  } else {
    if (quantity !== 1) throw new Error("Inspection invoices cover one vehicle");
    const plan = INSPECTION_SERVICES.find((s) => s.id === (kind === "inspection_standard" ? "standard" : "premium"));
    if (!plan) throw new Error("Unknown inspection service");
    lines = [grossLine(`Fahrzeugpruefung ${plan.name}`, plan.priceCents)];
  }
  return {
    kind,
    lines,
    netCents: lines.reduce((n, l) => n + l.netCents, 0),
    vatCents: lines.reduce((n, l) => n + l.vatCents, 0),
    grossCents: lines.reduce((n, l) => n + l.grossCents, 0),
  };
}

export const moneyEUR = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

export function invoiceReference(invoiceNumber: string) {
  if (!/^[A-Z0-9][A-Z0-9-]{5,34}$/.test(invoiceNumber)) throw new Error("Invalid invoice number");
  return invoiceNumber; // Unique number is also the bank transfer Verwendungszweck.
}
