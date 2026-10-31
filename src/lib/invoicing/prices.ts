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

/** Validates an immutable SERVER/DATABASE price snapshot; never accept one from a browser. */
export function promoInvoicePricing(raw:Record<string,unknown>):InvoicePricing {
 const kind=raw.product_kind;
 if(kind!=="device"&&kind!=="inspection_standard"&&kind!=="inspection_premium")throw Error("Invalid snapshot product");
 const integer=(key:string)=>{const v=raw[key];if(typeof v!=="string"||!/^\d{1,13}$/.test(v))throw Error("Invalid snapshot amount");const n=Number(v);if(!Number.isSafeInteger(n))throw Error("Unsafe snapshot amount");return n;};
 const quantity=raw.quantity;
 if(!Number.isInteger(quantity)||Number(quantity)<1||Number(quantity)>10||(kind!=="device"&&quantity!==1)||raw.vat_bps!==1900||raw.currency!=="EUR")throw Error("Unsupported snapshot tax/quantity");
 const before=integer("goods_net_before_discount_cents"),discount=integer("discount_net_cents"),after=integer("goods_net_after_discount_cents"),unit=integer("unit_net_cents"),shipping=integer("shipping_net_cents");
 const net=integer("net_cents"),vat=integer("vat_cents"),gross=integer("gross_cents");
 const tax=(n:number)=>Number((BigInt(n)*BigInt(1900)+BigInt(5000))/BigInt(10000));
 if(before!==unit*Number(quantity)||unit<=0||after<=0||discount>before||after!==before-discount||net!==after+shipping||vat!==tax(after)+tax(shipping)||gross!==net+vat||(kind!=="device"&&shipping!==0))throw Error("Snapshot totals do not reconcile");
 const line=(description:string,n:number,q=1)=>({description,quantity:q,taxRatePercent:19 as const,netCents:n,vatCents:tax(n),grossCents:n+tax(n)});
 const description=kind==="device"?"LUVIPRO LU3656060 - UV-Pruefgeraet":kind==="inspection_standard"?"Fahrzeugpruefung Standard":"Fahrzeugpruefung Premium";
 const lines=[line(description+(discount?" (Rabatt bereits beruecksichtigt)":""),after,Number(quantity)),...(shipping?[line("Versand innerhalb Deutschlands (je Bestellung)",shipping)]:[])];
 return {kind,lines,netCents:net,vatCents:vat,grossCents:gross};
}
