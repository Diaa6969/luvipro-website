import "server-only";
import type { IncomingInvoice, OutgoingInvoice } from "./monthly";

const PROJECT_URL = () => {
  const url = process.env.SUPABASE_URL || "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) throw new Error("Buchhaltungs-Datenbank nicht eingerichtet.");
  return url;
};
const headers = () => {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Privater Datenbankzugriff nicht eingerichtet.");
  return { apikey: secret, Authorization: `Bearer ${secret}` };
};
function ensureAvailable() {
  if (process.env.ACCOUNTING_PANEL_ENABLED !== "true") throw new Error("Buchhaltung deaktiviert.");
}
export async function dbRequest(path: string, init: RequestInit = {}) {
  ensureAvailable();
  const response = await fetch(PROJECT_URL() + "/rest/v1/" + path, {
    ...init,
    headers: { ...headers(), "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Accounting database operation failed (status ${response.status})`);
  return response;
}

async function readAll<T>(table: string, fields: string, query: string): Promise<T[]> {
  const PAGE = 500;
  const MAX = 10000;
  const results: T[] = [];
  for (let offset = 0; offset < MAX; offset += PAGE) {
    const url = `${table}?select=${fields}&${query}&order=created_at.asc&limit=${PAGE}&offset=${offset}`;
    const response = await dbRequest(url);
    const chunk = await response.json() as T[];
    if (!Array.isArray(chunk)) throw new Error("Malformed accounting response");
    results.push(...chunk);
    if (chunk.length < PAGE) return results;
  }
  throw new Error("Mehr als 10.000 Datensätze; Export/Paginierung erforderlich.");
}

export async function readAccountingYear(year: number) {
  const from = `${year}-01-01`;
  const to = `${year + 1}-01-01`;
  const filter = `invoice_date=gte.${from}&invoice_date=lt.${to}`;
  const [outgoing, incoming] = await Promise.all([
    readAll<OutgoingInvoice>("luvipro_billing_invoices",
      "id,invoice_number,invoice_date,created_at,delivery_state,net_cents,vat_cents,gross_cents,invoice_snapshot", filter),
    readAll<IncomingInvoice>("luvipro_billing_expenses",
      "id,supplier,supplier_invoice_number,invoice_date,category,description,net_cents,vat_cents,gross_cents,vat_rate,vorsteuer_confirmed,paid,file_path,created_at", filter),
  ]);
  return { outgoing, incoming };
}

export async function insertExpense(payload: Omit<IncomingInvoice, "id" | "created_at">) {
  const response = await dbRequest("luvipro_billing_expenses?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const rows = await response.json() as { id: string }[];
  if (!rows[0]?.id) throw new Error("Incoming invoice could not be stored");
  return rows[0].id;
}

export async function readInvoicePDF(id: string): Promise<Buffer | null> {
  const response = await dbRequest(
    "luvipro_billing_invoices?select=pdf_base64,delivery_state&id=eq." + encodeURIComponent(id) + "&limit=1",
  );
  const rows = await response.json() as { pdf_base64: string | null; delivery_state: string }[];
  if (rows[0]?.delivery_state !== "sent" || !rows[0].pdf_base64) return null;
  return Buffer.from(rows[0].pdf_base64, "base64");
}

const BUCKET = "luvipro-accounting";
export async function storePrivateExpenseFile(path: string, body: Buffer, type: string) {
  ensureAvailable();
  const r = await fetch(PROJECT_URL() + "/storage/v1/object/" + BUCKET + "/" + path, {
    method: "POST",
    headers: { ...headers(), "Content-Type": type, "x-upsert": "false" },
    body: new Uint8Array(body),
    cache: "no-store",
    signal: AbortSignal.timeout(18000),
  });
  if (!r.ok) throw new Error("Private receipt upload failed");
}
export async function readPrivateExpenseFile(path: string) {
  if (!/^[0-9a-f-]{36}\.(pdf|png|jpg)$/.test(path)) throw new Error("Invalid receipt path");
  ensureAvailable();
  const response = await fetch(PROJECT_URL() + "/storage/v1/object/authenticated/" + BUCKET + "/" + path, {
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("Private receipt unavailable");
  const content = Buffer.from(await response.arrayBuffer());
  if (content.length > 5 * 1024 * 1024) throw new Error("Receipt exceeds limit");
  const type = path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".png") ? "image/png" : "image/jpeg";
  return { content, type };
}
