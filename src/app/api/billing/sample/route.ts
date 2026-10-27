import { NextRequest, NextResponse } from "next/server";
import { renderInvoicePDF, type InvoiceData } from "@/lib/invoicing/document";
import { type InvoiceKind } from "@/lib/invoicing/prices";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // This is never accessible on Production/Preview deployments. It neither
  // allocates invoice numbers nor sends real mail or stores customer data.
  if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const type = request.nextUrl.searchParams.get("kind");
  if (!["device", "inspection_standard", "inspection_premium"].includes(type || "")) {
    return NextResponse.json({ error: "Use a supported sample kind" }, { status: 400 });
  }
  const kind = type as InvoiceKind;
  const preview: InvoiceData = {
    invoiceNumber: "MUSTER-2026-0001",
    invoiceDate: "2026-10-26",
    serviceDate: "2026-10-26",
    kind,
    quantity: 1,
    demo: true,
    paid: false,
    issuer: {
      name: kind === "device" ? "LUVIPRO (Musterfirma)" : "Beispiel Partnerwerkstatt GmbH",
      address1: "Musterstrasse 1",
      postalCode: "30159",
      city: "Hannover",
      country: "DE",
      taxNumberOrVatId: "DE000000000 (TEST)",
      email: "beispiel@example.invalid",
      bankIban: "DE00 0000 0000 0000 0000 00 (TEST)",
      bankAccountHolder: "Musterfirma",
    },
    customer: {
      name: "Beispielkunde GmbH",
      address1: "Demoweg 2",
      postalCode: "30161",
      city: "Hannover",
      country: "DE",
      email: "kunde@example.invalid",
    },
  };
  const bytes = await renderInvoicePDF(preview);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="MUSTER-${kind}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
