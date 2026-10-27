import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized, isSameOrigin } from "@/lib/accounting/admin-auth";
import { insertExpense, storePrivateExpenseFile } from "@/lib/accounting/database";
import { EXPENSE_CATEGORIES, monthOf, safeVatSplit, type ExpenseCategory } from "@/lib/accounting/monthly";

export const runtime = "nodejs";

function field(data: FormData, key: string, max: number) {
  const value = data.get(key);
  if (typeof value !== "string") throw new Error("Pflichtfeld fehlt: " + key);
  const text = value.trim();
  if (!text || text.length > max || /[\r\n]/.test(text)) throw new Error("Ungültige Angabe: " + key);
  return text;
}
function cents(value: string) {
  const input = value.trim().replace(",", ".");
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(input)) throw new Error("Ungültiger Betrag");
  const [euros, decimal = ""] = input.split(".");
  const amount = Number(euros) * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000000000) throw new Error("Betrag außerhalb des zulässigen Bereichs");
  return amount;
}

export async function POST(req: NextRequest) {
  if (!isAccountingRequestAuthorized(req)) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  if (!isSameOrigin(req) || Number(req.headers.get("content-length") || "0") > 6000000) {
    return NextResponse.json({ error: "Ungültige Datei oder Herkunft" }, { status: 403 });
  }
  try {
    const form = await req.formData();
    const supplier = field(form, "supplier", 150);
    const supplier_invoice_number = field(form, "invoiceNumber", 100);
    const invoice_date = field(form, "invoiceDate", 10);
    if (!monthOf(invoice_date) || invoice_date > new Date().toISOString().slice(0, 10)) throw new Error("Ungültiges Belegdatum");
    const category = field(form, "category", 30) as ExpenseCategory;
    if (!EXPENSE_CATEGORIES.includes(category)) throw new Error("Unbekannte Kategorie");
    const description = String(form.get("description") || "").trim();
    if (description.length > 500 || /[\r\n]/.test(description)) throw new Error("Ungültige Beschreibung");
    const rate = Number(field(form, "vatRate", 2));
    if (rate !== 0 && rate !== 7 && rate !== 19) throw new Error("Nicht unterstützter Umsatzsteuersatz");
    const total = cents(field(form, "gross", 16));
    const split = safeVatSplit(total, rate);
    const upload = form.get("receipt");
    if (!(upload instanceof File) || upload.size < 32 || upload.size > 5 * 1024 * 1024) {
      throw new Error("Bitte Rechnungsbeleg (max. 5 MB) auswählen.");
    }
    const bytes = Buffer.from(await upload.arrayBuffer());
    const pdf = upload.type === "application/pdf" && bytes.subarray(0, 5).toString("utf8") === "%PDF-";
    const png = upload.type === "image/png" && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
    const jpg = upload.type === "image/jpeg" && bytes.subarray(0, 3).toString("hex") === "ffd8ff";
    if (!pdf && !png && !jpg) throw new Error("Nur echte PDF-, PNG- oder JPEG-Belege erlaubt.");
    const ext = pdf ? "pdf" : png ? "png" : "jpg";
    const type = pdf ? "application/pdf" : png ? "image/png" : "image/jpeg";
    const file_path = randomUUID() + "." + ext;
    // VAT recognition is a manually reviewed status; no automatic right to
    // Vorsteuer is inferred merely by selecting a tax rate.
    const vorsteuer_confirmed = form.get("vatConfirmed") === "on";
    const paid = form.get("paid") === "on";
    await storePrivateExpenseFile(file_path, bytes, type);
    await insertExpense({
      supplier, supplier_invoice_number, invoice_date, category, description,
      net_cents: split.netCents, vat_cents: split.vatCents,
      gross_cents: split.grossCents, vat_rate: rate,
      vorsteuer_confirmed, paid, file_path,
    });
    return NextResponse.json({ saved: true, year: Number(invoice_date.slice(0, 4)) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // No user PII or receipt bytes in logs; avoid displaying raw DB errors.
    return NextResponse.json({
      error: "Der Beleg konnte nicht gespeichert werden. Bitte Daten, Dubletten, Dateityp und private Datenbankkonfiguration prüfen.",
    }, { status: 422 });
  }
}
