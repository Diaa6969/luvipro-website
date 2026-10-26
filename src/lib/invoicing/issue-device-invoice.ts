import "server-only";

import { DEVICE } from "@/lib/store";
import { sendHostingerMail } from "@/lib/hostinger-smtp";
import { calculateInvoicePricing, moneyEUR } from "./prices";
import {
  configuredDeviceIssuer,
  renderInvoicePDF,
  type InvoiceData,
  type InvoiceParty,
} from "./document";

type InvoiceRow = {
  id: string;
  source_key: string;
  invoice_number: string;
  delivery_state: "reserved" | "prepared" | "sending" | "sent" | "failed";
  invoice_snapshot: InvoiceData | null;
  pdf_base64: string | null;
};
type ReserveResult = { invoice_id: string; invoice_no: string; state: InvoiceRow["delivery_state"] };
type StripeSession = {
  id: string;
  mode?: string;
  payment_status?: string;
  currency?: string;
  amount_total?: number;
  created?: number;
  metadata?: { sku?: string; company?: string };
  customer_details?: {
    email?: string;
    name?: string;
    address?: { line1?: string; line2?: string; postal_code?: string; city?: string; country?: string };
  };
};
type StripeLineList = { data?: { price?: { id?: string }; quantity?: number }[] };

function isEnabled() {
  return (
    process.env.INVOICE_ISSUANCE_ENABLED === "true" &&
    Boolean(process.env.INVOICE_INTERNAL_TOKEN) &&
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    Boolean(process.env.SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    Boolean(process.env.SMTP_USER) &&
    Boolean(process.env.SMTP_PASSWORD)
  );
}

function stripeHeaders() {
  return { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` };
}
async function fetchStripeJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: stripeHeaders(), cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("Stripe source validation failed");
  return await response.json() as T;
}

function dbHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}
function dbBase() {
  const url = process.env.SUPABASE_URL || "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) throw new Error("Invalid private DB configuration");
  return url + "/rest/v1";
}

async function reserveInvoice(sourceKey: string): Promise<ReserveResult> {
  const response = await fetch(dbBase() + "/rpc/luvipro_invoice_reserve", {
    method: "POST",
    headers: dbHeaders(),
    body: JSON.stringify({ p_source_key: sourceKey }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Invoice reservation backend unavailable");
  const rows = await response.json() as ReserveResult[];
  const found = rows?.[0];
  if (!found || !found.invoice_id || !found.invoice_no) throw new Error("Invoice reservation response invalid");
  return found;
}

async function getInvoice(id: string): Promise<InvoiceRow> {
  const response = await fetch(dbBase() + "/luvipro_billing_invoices?id=eq." + encodeURIComponent(id) + "&select=*", {
    headers: dbHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Invoice record could not be loaded");
  const items = await response.json() as InvoiceRow[];
  if (!items?.[0]) throw new Error("Invoice record not found");
  return items[0];
}
async function transition(id: string, from: InvoiceRow["delivery_state"], patch: object): Promise<boolean> {
  const url = dbBase() + "/luvipro_billing_invoices?id=eq." + encodeURIComponent(id) +
    "&delivery_state=eq." + encodeURIComponent(from) + "&select=id";
  const response = await fetch(url, {
    method: "PATCH",
    headers: { ...dbHeaders(), Prefer: "return=representation" },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Invoice state could not be updated");
  const items = await response.json() as { id: string }[];
  return items.length === 1;
}

function berlinDate() {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function stripeCustomer(session: StripeSession): InvoiceParty & { email: string } {
  const a = session.customer_details?.address;
  if (!a || a.country !== "DE" || !a.line1 || !a.postal_code || !a.city || !session.customer_details?.email) {
    throw new Error("Stripe customer lacks verified German billing details");
  }
  return {
    name: session.metadata?.company?.trim() || session.customer_details.name || "",
    address1: [a.line1, a.line2].filter(Boolean).join(", "),
    postalCode: a.postal_code,
    city: a.city,
    country: "DE",
    email: session.customer_details.email,
  };
}

export type IssueDeviceInvoiceResult =
  | { status: "emailed"; invoiceNumber: string }
  | { status: "previously_sent"; invoiceNumber: string }
  | { status: "manual_review"; invoiceNumber: string };

/**
 * Manual fulfillment trigger only:
 *   requires trusted internal token, completed domestic German Stripe payment,
 *   a verified supply date, and the legal seller's tax details.
 * No public or unauthenticated endpoint may call this function.
 */
export async function issueDeviceInvoiceAfterFulfillment(stripeSessionId: string, actualDeliveryDate: string): Promise<IssueDeviceInvoiceResult> {
  if (!isEnabled()) throw new Error("Invoice issuance is disabled");
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(stripeSessionId)) throw new Error("Invalid Stripe session");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(actualDeliveryDate)) throw new Error("Invalid actual delivery date");
  const issuer = configuredDeviceIssuer();
  if (!issuer) throw new Error("Legal invoice issuer is not configured");

  const session = await fetchStripeJson<StripeSession>(
    "https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(stripeSessionId),
  );
  if (session.id !== stripeSessionId || session.payment_status !== "paid" ||
      session.currency !== "eur" || session.mode !== "payment" || session.metadata?.sku !== DEVICE.sku) {
    throw new Error("Unverified order/payment - invoice blocked");
  }
  const stripeLines = await fetchStripeJson<StripeLineList>(
    "https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(stripeSessionId) + "/line_items?limit=10",
  );
  const lines = stripeLines.data || [];
  if (lines.length !== 1 || lines[0].price?.id !== process.env.STRIPE_PRICE_ID) {
    throw new Error("Stripe line items differ from the configured LUVIPRO product");
  }
  const quantity = lines[0].quantity;
  if (!Number.isInteger(quantity) || quantity! < 1 || quantity! > DEVICE.maxQuantity) {
    throw new Error("Invalid purchased quantity");
  }
  const pricing = calculateInvoicePricing("device", quantity);
  // For non-domestic/zero/reverse-charge or discounted Stripe results, stop;
  // this domestic 19% template must never silently produce an incorrect tax invoice.
  if (session.amount_total !== pricing.grossCents) {
    throw new Error("Unexpected Stripe tax/total - manual tax review required");
  }
  const customer = stripeCustomer(session);
  const sourceKey = "stripe:" + stripeSessionId;
  const reserved = await reserveInvoice(sourceKey);
  let current = await getInvoice(reserved.invoice_id);
  if (current.delivery_state === "sent") return { status: "previously_sent", invoiceNumber: reserved.invoice_no };
  if (current.delivery_state === "sending" || current.delivery_state === "failed") {
    return { status: "manual_review", invoiceNumber: reserved.invoice_no };
  }

  if (current.delivery_state === "reserved") {
    const document: InvoiceData = {
      invoiceNumber: reserved.invoice_no,
      invoiceDate: berlinDate(),
      serviceDate: actualDeliveryDate,
      kind: "device",
      quantity,
      paid: true,
      demo: false,
      issuer,
      customer,
    };
    const bytes = Buffer.from(await renderInvoicePDF(document));
    const updated = await transition(current.id, "reserved", {
      delivery_state: "prepared",
      invoice_snapshot: document,
      pdf_base64: bytes.toString("base64"),
    });
    if (!updated) current = await getInvoice(current.id);
    else current = { ...current, delivery_state: "prepared", invoice_snapshot: document, pdf_base64: bytes.toString("base64") };
  }
  if (current.delivery_state !== "prepared" || !current.pdf_base64 || !current.invoice_snapshot) {
    return { status: "manual_review", invoiceNumber: reserved.invoice_no };
  }

  // Exclusive claim prevents concurrent webhook workers from mailing twice.
  if (!(await transition(current.id, "prepared", { delivery_state: "sending" }))) {
    return { status: "manual_review", invoiceNumber: reserved.invoice_no };
  }

  const pdf = Buffer.from(current.pdf_base64, "base64");
  try {
    await sendHostingerMail({
      to: current.invoice_snapshot.customer.email,
      replyTo: process.env.STORE_ORDER_EMAIL || process.env.SMTP_USER!,
      subject: `LUVIPRO - Rechnung ${reserved.invoice_no}`,
      text: [
        `Vielen Dank fuer Ihre Bestellung. Ihre Rechnung ${reserved.invoice_no} ist als PDF beigefuegt.`,
        `Rechnungsbetrag inkl. Umsatzsteuer: ${moneyEUR(pricing.grossCents)}`,
        `Ihre Zahlung ist eingegangen.`,
        `Verwendungszweck / Rechnungsreferenz: ${reserved.invoice_no}`,
        "Bei Fragen antworten Sie bitte auf diese E-Mail.",
      ].join("\n"),
      attachments: [{ filename: `Rechnung-${reserved.invoice_no}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    // If persistence fails after SMTP success, DO NOT automatically retry email;
    // an operator must reconcile the 'sending' state to avoid double delivery.
    await transition(current.id, "sending", {
      delivery_state: "sent",
      sent_at: new Date().toISOString(),
      delivery_error: null,
    });
  } catch {
    await transition(current.id, "sending", { delivery_state: "failed", delivery_error: "SMTP or persistence error; manual reconciliation required" }).catch(() => {});
    throw new Error("Invoice email not confirmed - manual reconciliation required");
  }
  return { status: "emailed", invoiceNumber: reserved.invoice_no };
}
