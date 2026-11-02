import "server-only";
import { randomUUID } from "node:crypto";
import { sendHostingerMail } from "@/lib/hostinger-smtp";
import { configuredDeviceIssuer, renderInvoicePDF, type InvoiceData } from "@/lib/invoicing/document";
import { bankPaymentReminder, bankPaymentRequest, assertBankOrder, isValidGermanIban, type BankOrder, type BankDetails } from "./logic";
import type { ShopInquiry } from "@/lib/store";

function base() {
  const host = process.env.SUPABASE_URL || "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(host) || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Private order database not configured");
  return host + "/rest/v1/";
}
function headers(extra?: Record<string, string>) {
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { apikey: token, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...extra };
}
async function db<T>(path: string, body?: object, options?: { method?: string; prefer?: string }): Promise<T> {
  const response = await fetch(base() + path, {
    method: options?.method || (body ? "POST" : "GET"),
    headers: headers(options?.prefer ? { Prefer: options.prefer } : undefined),
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Private bank order database error " + response.status);
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}
export function bankDetails(): BankDetails {
  const iban = (process.env.BANK_TRANSFER_IBAN || "").replace(/\s/g, "").toUpperCase();
  const holder = process.env.BANK_TRANSFER_HOLDER || "";
  const bic = process.env.BANK_TRANSFER_BIC || "";
  if (!isValidGermanIban(iban) || holder.length < 3 || !configuredDeviceIssuer()) {
    throw new Error("Bank recipient / registered legal invoice issuer incomplete");
  }
  return { iban, holder, bic };
}
export function isBankTransferReady() {
  if (process.env.STORE_BANK_TRANSFER_ENABLED !== "true" ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL ||
      !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.BANK_TRANSFER_HOLDER ||
      (process.env.BANK_ORDER_RATE_SECRET || "").length < 32) return false;
  try { bankDetails(); return true; } catch { return false; }
}
export async function getBankOrder(id: string): Promise<BankOrder> {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid order ID");
  const rows = await db<BankOrder[]>(`luvipro_bank_orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!rows?.[0]) throw new Error("Bank order not found");
  return rows[0];
}
export async function listBankOrders(): Promise<BankOrder[]> {
  const rows = await db<BankOrder[]>("luvipro_bank_orders?select=*&order=created_at.desc&limit=200");
  return rows;
}
async function patchOrder(id: string, status: BankOrder["payment_mail_status"], changes: Record<string, unknown>) {
  const rows = await db<{ id: string }[]>(
    `luvipro_bank_orders?id=eq.${id}&payment_mail_status=eq.${status}&select=id`,
    { ...changes, updated_at: new Date().toISOString() },
    { method: "PATCH", prefer: "return=representation" },
  );
  return rows.length === 1;
}
async function audit(id: string, kind: string, actor?: string) {
  await db("luvipro_bank_order_events", { order_id: id, event_kind: kind, actor_id: actor || null });
}
export async function createBankOrder(d: ShopInquiry, requestKey: string, ipHash: string) {
  if (!isBankTransferReady()) throw new Error("Bank transfer currently disabled");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey))
    throw new Error("Invalid request reference");
  if (!d.termsAccepted || !d.privacyAccepted || !d.street || !d.postalCode || !d.city) {
    throw new Error("Bank orders require complete billing details and accepted terms");
  }
  const entries = await db<{ order_id: string; invoice_no: string; payment_state: string; mail_state: string }[]>(
    "rpc/luvipro_bank_order_create", {
      p_request_key: requestKey,
      p_company: d.company, p_contact: d.contact, p_email: d.email,
      p_address: d.street, p_postal_code: d.postalCode, p_city: d.city,
      p_phone: d.phone, p_quantity: d.quantity, p_ip_hash: ipHash,
    });
  const info = entries?.[0];
  if (!info?.order_id) throw new Error("Order registration failed");
  const order = await getBankOrder(info.order_id);
  assertBankOrder(order);

  return sendBankOrderInstructions(order);
}
async function sendBankOrderInstructions(order:BankOrder){
  if (order.payment_mail_status === "pending") {
    const claimed = await patchOrder(order.id, "pending", { payment_mail_status: "sending" });
    if (claimed) {
      await audit(order.id, "payment_mail_claimed");
      try {
        const msg = bankPaymentRequest(order, bankDetails());
        await sendHostingerMail({
          to: order.customer_email, replyTo: process.env.SMTP_USER!,
          subject: msg.subject, text: msg.text,
        });
        await patchOrder(order.id, "sending", { payment_mail_status: "sent", payment_mail_sent_at: new Date().toISOString() });
        await audit(order.id, "payment_mail_sent");
      } catch {
        await patchOrder(order.id, "sending", { payment_mail_status: "failed" }).catch(() => {});
        await audit(order.id, "payment_mail_failed").catch(() => {});
        throw new Error("Order reserved, but payment instructions could not be sent; operator review needed");
      }
    }
  }
  // Frontend must not imply instruction mail succeeded if it did not.
  const current = await getBankOrder(order.id);
  if (current.payment_mail_status !== "sent") {
    throw new Error("Bank order requires manual email delivery check");
  }
  return { reference: order.invoice_number, status: "instructions_sent" as const };
}

export async function createPromoBankOrder(d:ShopInquiry,requestKey:string,ipHash:string,actor:string,quoteId:string){
 if(!isBankTransferReady())throw Error("Payments disabled");
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(actor)||!uuid.test(quoteId)||!uuid.test(requestKey))throw Error("Invalid quote/session");
 // The order route is a DEVICE checkout. Never silently purchase a different product.
 const quotes=await db<{product_kind:string;customer_uid:string}[]>(`luvipro_promo_quotes?id=eq.${quoteId}&select=product_kind,customer_uid&limit=1`);
 if(quotes[0]?.product_kind!=="device"||quotes[0].customer_uid!==actor)throw Error("Own device quote required");
 const result=await db<{order_id:string}>("rpc/luvipro_promo_order_create_v1",{p_actor:actor,p_quote:quoteId,p_request_key:requestKey,p_ip_hash:ipHash,p_billing:{company:d.company,contact:d.contact,address:d.street,postal_code:d.postalCode,city:d.city,phone:d.phone,terms_accepted:d.termsAccepted,privacy_accepted:d.privacyAccepted}});
 const order=await getBankOrder(result.order_id);assertBankOrder(order);return sendBankOrderInstructions(order);
}

export async function confirmBankPayment(id: string, actorId: string, bankReference: string, paidAt: string) {
  if (!/^[0-9a-f-]{36}$/.test(actorId) ||
      bankReference.trim().length < 5 || bankReference.trim().length > 120 ||
      Number.isNaN(Date.parse(paidAt))) throw new Error("Bank evidence and real actor required");
  const order = await getBankOrder(id);
  if (order.payment_status !== "pending") throw new Error("Only pending payments can be confirmed");
  if (order.payment_mail_status !== "sent") throw new Error("Payment request delivery must be verified");
  const result = await db<boolean>("rpc/luvipro_bank_order_mark_paid", {
    p_order_id: id, p_actor_id: actorId, p_bank_reference: bankReference.trim(),
    p_paid_at: paidAt,
  });
  if (result !== true) throw new Error("Payment already processed or order cancelled");
  return { status: "paid", reference: order.invoice_number };
}
export async function sendBankReminder(id: string, actorId: string) {
  const order = await getBankOrder(id);
  const details = bankDetails();
  const msg = bankPaymentReminder(order, details);
  if (order.payment_mail_status !== "sent") throw new Error("Original payment instructions not delivered");
  const claimed = await db<boolean>("rpc/luvipro_bank_order_claim_reminder", {
    p_order_id: id, p_actor_id: actorId,
  });
  if (!claimed) throw new Error("Order paid/cancelled or reminder limit reached");
  try {
    await sendHostingerMail({
      to: order.customer_email, replyTo: process.env.SMTP_USER!, subject: msg.subject, text: msg.text,
    });
    await db<unknown>(`luvipro_bank_orders?id=eq.${id}`, {
      reminder_count: order.reminder_count + 1,
      last_reminded_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { method: "PATCH" });
    await audit(id, "reminder_sent", actorId);
    return { status: "reminder_sent", reference: order.invoice_number };
  } catch {
    await audit(id, "reminder_failed", actorId).catch(() => {});
    throw new Error("SMTP reminder not confirmed; review audit before any retry");
  }
}

/** Separately triggered AFTER verified payment and real delivery. */
export async function deliverBankOrder(id: string, deliveredAt: string) {
  if (process.env.INVOICE_ISSUANCE_ENABLED !== "true") throw new Error("Legal invoicing not enabled");
  const issuer = configuredDeviceIssuer();
  const order = await getBankOrder(id);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone:"Europe/Berlin", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
  if (!issuer || order.payment_status !== "paid" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deliveredAt) || Number.isNaN(Date.parse(deliveredAt + "T00:00:00Z")) || deliveredAt > today) {
    throw new Error("Legal seller, paid status and actual delivery date mandatory");
  }
  const invoiceRows = await db<{ delivery_state: string; invoice_snapshot: InvoiceData | null }[]>(
    `luvipro_billing_invoices?select=delivery_state,invoice_snapshot&id=eq.${order.invoice_id}`);
  if (invoiceRows[0]?.delivery_state !== "reserved") {
    throw new Error("Invoice previously generated or under manual review");
  }
  const totals = assertBankOrder(order);
  const inv: InvoiceData = {
    invoiceNumber: order.invoice_number, kind: order.product_kind??"device", quantity: order.quantity,
    ...(order.promo_snapshot?{promoSnapshot:order.promo_snapshot}:{}),
    invoiceDate: today, serviceDate: deliveredAt, paid: true, demo: false,
    issuer,
    customer: {
      name: order.customer_company, address1: order.customer_address,
      postalCode: order.customer_postal_code, city: order.customer_city,
      country: "DE", email: order.customer_email,
    },
  };
  const pdf = Buffer.from(await renderInvoicePDF(inv));
  const updated = await db<{id:string}[]>(
    `luvipro_billing_invoices?id=eq.${order.invoice_id}&delivery_state=eq.reserved&select=id`,
    {
      delivery_state: "prepared", invoice_snapshot: inv, pdf_base64: pdf.toString("base64"),
      invoice_date: inv.invoiceDate, net_cents: totals.netCents, vat_cents: totals.vatCents,
      gross_cents: totals.grossCents, updated_at: new Date().toISOString(),
    },
    { method: "PATCH", prefer: "return=representation" },
  );
  if (updated.length !== 1) throw new Error("Invoice already allocated");
  const claim = await db<{id:string}[]>(
    `luvipro_billing_invoices?id=eq.${order.invoice_id}&delivery_state=eq.prepared&select=id`,
    { delivery_state: "sending", updated_at: new Date().toISOString() },
    { method: "PATCH", prefer: "return=representation" },
  );
  if (claim.length !== 1) throw new Error("Invoice mail claimed elsewhere");
  try {
    await sendHostingerMail({
      to: order.customer_email,
      replyTo: process.env.SMTP_USER!,
      subject: `LUVIPRO – Rechnung ${order.invoice_number}`,
      text: [
        `Guten Tag ${order.customer_contact},`, "",
        "anbei erhalten Sie Ihre Rechnung für die gelieferte LUVIPRO-Bestellung.",
        `Rechnungsnummer / Verwendungszweck: ${order.invoice_number}`,
        `Rechnungsbetrag (bereits bezahlt): ${(totals.grossCents / 100).toFixed(2)} EUR`,
        "",
        "Vielen Dank und freundliche Grüße", "Ihr LUVIPRO-Team",
      ].join("\n"),
      attachments: [{ filename:`Rechnung-${order.invoice_number}.pdf`, content:pdf, contentType:"application/pdf" }],
    });
    await db<unknown>(`luvipro_billing_invoices?id=eq.${order.invoice_id}&delivery_state=eq.sending`, {
      delivery_state:"sent",sent_at:new Date().toISOString(),updated_at:new Date().toISOString(),
    }, { method:"PATCH" });
  } catch {
    await db<unknown>(`luvipro_billing_invoices?id=eq.${order.invoice_id}&delivery_state=eq.sending`,
      { delivery_state:"failed", delivery_error:"Bank invoice SMTP unknown; manual review required" }, {method:"PATCH"}).catch(()=>{});
    throw new Error("Invoice generated; delivery requires manual reconciliation");
  }
  return {status:"invoiced",reference:order.invoice_number};
}
