import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { issueDeviceInvoiceAfterFulfillment } from "@/lib/invoicing/issue-device-invoice";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const expected = process.env.INVOICE_INTERNAL_TOKEN || "";
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (expected.length < 32 || !actual) return false;
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(actual).digest();
  return timingSafeEqual(a, b);
}

/**
 * An internal fulfillment event, NOT a customer endpoint.
 * The handler verifies actual Stripe payment/line items server-side,
 * requires a recorded delivery date, and uses atomic DB invoice numbers.
 */
export async function POST(request: NextRequest) {
  if (process.env.INVOICE_ISSUANCE_ENABLED !== "true") {
    return NextResponse.json({ error: "Invoice issuance not enabled" }, { status: 503 });
  }
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!request.headers.get("content-type")?.includes("application/json") ||
      Number(request.headers.get("content-length") || "0") > 2000) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid payload");
    const body = payload as Record<string, unknown>;
    if (typeof body.sessionId !== "string" || typeof body.deliveredAt !== "string") {
      throw new Error("Missing event details");
    }
    const result = await issueDeviceInvoiceAfterFulfillment(body.sessionId, body.deliveredAt);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Do not disclose PII, invoice numbers or internal account configuration.
    console.error("LUVIPRO invoice issuance requires operator review");
    return NextResponse.json({ error: "Invoice could not be issued; check billing logs" }, { status: 422 });
  }
}
