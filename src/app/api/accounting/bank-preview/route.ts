import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized, isSameOrigin } from "@/lib/accounting/admin-auth";
import { parseBankStatement } from "@/lib/accounting/bank-import";

export async function POST(request: NextRequest) {
  if (!isAccountingRequestAuthorized(request) || !isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse(null, { status: 400 });
  try {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 500_000) {
        await reader.cancel();
        return new NextResponse(null, { status: 413 });
      }
      chunks.push(value);
    }
    const source = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    return NextResponse.json({ transactions: parseBankStatement(source) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CSV ungültig. Bitte Importvorlage, Buchungsdaten und eindeutige Transaktions-IDs prüfen." }, { status: 422 });
  } finally {
    reader.releaseLock();
  }
}
