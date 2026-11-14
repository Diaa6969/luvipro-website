import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized, isSameOrigin } from "@/lib/accounting/admin-auth";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import { dbRequest } from "@/lib/accounting/database";

const noStore = { "Cache-Control": "no-store" };
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedFinanceAdmin(request))) return new NextResponse(null, { status: 403, headers: noStore });
  try {
    const result = await dbRequest("luvipro_finance_journal?select=id,posting_date,reference,memo,reversal_of,luvipro_finance_lines(account,debit_cents,credit_cents,line_number)&order=posting_date.desc,id.desc&limit=100");
    return NextResponse.json(await result.json(), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Journal nicht verfügbar." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  if (!isAccountingRequestAuthorized(request) || !isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  if (process.env.FINANCE_JOURNAL_POSTING_ENABLED !== "true") {
    return NextResponse.json({ error: "Journalbuchungen sind noch nicht freigegeben." }, { status: 503, headers: noStore });
  }
  const length = Number(request.headers.get("content-length"));
  if (!Number.isInteger(length) || length < 2 || length > 32_000) return new NextResponse(null, { status: 413 });
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 32_000) return new NextResponse(null, { status: 413 });
    const { date, reference, memo, lines, reversal } = JSON.parse(raw);
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof reference !== "string" || !reference.trim() || reference.length > 180 ||
        typeof memo !== "string" || !memo.trim() || memo.length > 500 ||
        (reversal != null && (typeof reversal !== "string" || !uuid.test(reversal))) ||
        (reversal == null && (!Array.isArray(lines) || lines.length < 2 || lines.length > 100 ||
          !lines.every(line => line && typeof line.account === "string" && /^\d{4,9}$/.test(line.account) &&
            Number.isSafeInteger(line.debit) && Number.isSafeInteger(line.credit))))) {
      return NextResponse.json({ error: "Ungültige Buchungsdaten." }, { status: 422, headers: noStore });
    }
    const result = await dbRequest("rpc/luvipro_finance_post", {
      method: "POST",
      body: JSON.stringify({ p_date: date, p_reference: reference.trim(), p_memo: memo.trim(), p_lines: reversal ? [] : lines, p_reversal: reversal ?? null }),
    });
    return NextResponse.json({ id: await result.json() }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Buchung abgelehnt. Beträge, Konten und eindeutige Referenz prüfen." }, { status: 422, headers: noStore });
  }
}
