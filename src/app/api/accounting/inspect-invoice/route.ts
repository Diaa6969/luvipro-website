import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized, isSameOrigin } from "@/lib/accounting/admin-auth";
import { inspectInvoiceXml } from "@/lib/accounting/invoice-xml";

export async function POST(request: NextRequest) {
  if (!isAccountingRequestAuthorized(request) || !isSameOrigin(request)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "XML fehlt." }, { status: 400 });
  try {
    const parts: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 500_000) {
        await reader.cancel();
        return NextResponse.json({ error: "XML-Datei zu groß." }, { status: 413 });
      }
      parts.push(value);
    }
    const xml = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts));
    const invoice = inspectInvoiceXml(xml);
    return NextResponse.json({ invoice }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Die Datei konnte nicht als UBL- oder CII-Rechnung gelesen werden." }, { status: 422 });
  } finally {
    reader.releaseLock();
  }
}
