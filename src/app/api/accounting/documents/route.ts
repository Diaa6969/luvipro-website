import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import { PDFDocument } from "pdf-lib";
import { dbRequest, readInvoicePDF, readPrivateExpenseFile } from "@/lib/accounting/database";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  if (!(await isAuthorizedFinanceAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    } else if (kind === "cash") {
      const r = await dbRequest("luvipro_billing_cash_events?select=document_path&id=eq." + encodeURIComponent(id) + "&limit=1");
      const rows = await r.json() as { document_path?: string }[];
      if (!rows[0]?.document_path) throw new Error("No cash receipt");
      const receipt = await readPrivateExpenseFile(rows[0].document_path);
      body = receipt.content;
      type = receipt.type;
    } else {
      return NextResponse.json({ error: "Invalid document kind" }, { status: 400 });
    }
    if (req.nextUrl.searchParams.get("format") === "pdf" && type !== "application/pdf") {
      const doc = await PDFDocument.create();
      const embedded = type === "image/png" ? await doc.embedPng(new Uint8Array(body)) : await doc.embedJpg(new Uint8Array(body));
      const page = doc.addPage([595.28, 841.89]);
      const scale = Math.min(539 / embedded.width, 786 / embedded.height);
      const w = embedded.width * scale, h = embedded.height * scale;
      page.drawImage(embedded, { x: (595.28 - w)/2, y: (841.89 - h)/2, width: w, height: h });
      body = Buffer.from(await doc.save());
      type = "application/pdf";
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
