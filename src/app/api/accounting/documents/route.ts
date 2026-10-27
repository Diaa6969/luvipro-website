import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized } from "@/lib/accounting/admin-auth";
import { dbRequest, readInvoicePDF, readPrivateExpenseFile } from "@/lib/accounting/database";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  if (!isAccountingRequestAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const kind = req.nextUrl.searchParams.get("kind");
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Invalid document reference" }, { status: 400 });
  try {
    let body: Buffer;
    let type = "application/pdf";
    if (kind === "out") {
      const pdf = await readInvoicePDF(id);
      if (!pdf || pdf.subarray(0, 5).toString("utf8") !== "%PDF-") throw new Error("No issued invoice PDF");
      body = pdf;
    } else if (kind === "in") {
      const r = await dbRequest("luvipro_billing_expenses?select=file_path&id=eq." + encodeURIComponent(id) + "&limit=1");
      const rows = await r.json() as { file_path?: string }[];
      if (!rows[0]?.file_path) throw new Error("No incoming receipt");
      const receipt = await readPrivateExpenseFile(rows[0].file_path);
      body = receipt.content;
      type = receipt.type;
    } else {
      return NextResponse.json({ error: "Invalid document kind" }, { status: 400 });
    }
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="Beleg-${id}.${type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : "jpg"}"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Beleg nicht verfügbar" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
