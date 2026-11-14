import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized, isSameOrigin } from "@/lib/accounting/admin-auth";
import { parseCompanyDraft } from "@/lib/accounting/company-draft";
import { dbRequest } from "@/lib/accounting/database";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  if (!isAccountingRequestAuthorized(request)) return new NextResponse(null, { status: 403, headers });
  try {
    const result = await dbRequest("luvipro_finance_company_revisions?select=revision,saved_at,details&order=revision.desc&limit=1");
    const [draft] = await result.json();
    return NextResponse.json({ draft: draft ?? null }, { headers });
  } catch {
    return NextResponse.json({ error: "Firmendaten sind derzeit nicht verfügbar." }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest) {
  if (!isAccountingRequestAuthorized(request) || !isSameOrigin(request)) {
    return new NextResponse(null, { status: 403, headers });
  }
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse(null, { status: 400, headers });
  let details;
  try {
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) {
        await reader.cancel();
        return new NextResponse(null, { status: 413, headers });
      }
      chunks.push(value);
    }
    details = parseCompanyDraft(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))));
  } catch {
    return NextResponse.json({ error: "Ungültige Firmendaten." }, { status: 422, headers });
  } finally {
    reader.releaseLock();
  }
  try {
    await dbRequest("luvipro_finance_company_revisions", {
      method: "POST",
      body: JSON.stringify({ details }),
    });
    return NextResponse.json({ saved: true }, { status: 201, headers });
  } catch {
    return NextResponse.json({ error: "Entwurf konnte nicht gespeichert werden." }, { status: 503, headers });
  }
}
