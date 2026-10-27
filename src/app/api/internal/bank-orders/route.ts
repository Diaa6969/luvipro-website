import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized, isSameOrigin } from "@/lib/accounting/admin-auth";
import {
  confirmBankPayment, deliverBankOrder, getBankOrder, listBankOrders, sendBankReminder,
} from "@/lib/bank-transfer/service";
import { bankPaymentReminder } from "@/lib/bank-transfer/logic";
import { bankDetails } from "@/lib/bank-transfer/service";

export const runtime = "nodejs";
const uuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

function safeEquals(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}
async function authorized(req: NextRequest): Promise<{ actor: string; mode: "bridge" | "web" } | null> {
  const expected = process.env.BANK_ADMIN_BRIDGE_TOKEN || "";
  const actual = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const actor = req.headers.get("x-luvipro-admin-user") || "";
  if (expected.length >= 32 && actual && uuid(actor) && safeEquals(expected, actual)) {
    return { actor, mode: "bridge" };
  }
  if (isAccountingRequestAuthorized(req)) {
    const webActor = process.env.BANK_ACCOUNTING_OPERATOR_ID || "";
    return { actor: uuid(webActor) ? webActor : "", mode: "web" };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const auth = await authorized(req);
  if (!auth) return NextResponse.json({error:"Unauthorized"}, {status:401});
  try {
    const list = await listBankOrders();
    return NextResponse.json({ orders:list },{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Bank orders backend unavailable"},{status:503});
  }
}
export async function POST(req: NextRequest) {
  const auth = await authorized(req);
  if (!auth) return NextResponse.json({error:"Unauthorized"}, {status:401});
  if (auth.mode === "web" && !isSameOrigin(req)) {
    return NextResponse.json({error:"Origin mismatch"},{status:403});
  }
  if (Number(req.headers.get("content-length") || "0") > 3000 ||
      !req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({error:"Invalid payload"},{status:400});
  }
  try {
    const payload: unknown = await req.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid request");
    const { action, orderId, bankReference, paidAt, deliveredAt, acknowledgedBankMatch } =
      payload as Record<string, unknown>;
    if (typeof orderId !== "string" || !uuid(orderId) || typeof action !== "string") throw new Error("Invalid order");
    if (action === "preview_reminder") {
      const order = await getBankOrder(orderId);
      if (order.payment_status !== "pending") throw new Error("Only unpaid orders can be reminded");
      const msg = bankPaymentReminder(order, bankDetails());
      return NextResponse.json({to:order.customer_email,subject:msg.subject,text:msg.text},{headers:{"Cache-Control":"no-store"}});
    }
    if (!uuid(auth.actor)) throw new Error("Admin actor identity must be configured");
    if (action === "confirm") {
      if (acknowledgedBankMatch !== true || typeof bankReference !== "string" || typeof paidAt !== "string") {
        throw new Error("Verifizierter Kontoauszug und Buchungsreferenz nötig");
      }
      return NextResponse.json(await confirmBankPayment(orderId,auth.actor,bankReference,paidAt));
    }
    if (action === "remind") return NextResponse.json(await sendBankReminder(orderId,auth.actor));
    if (action === "deliver") {
      if (typeof deliveredAt !== "string") throw new Error("Real delivery date required");
      return NextResponse.json(await deliverBankOrder(orderId,deliveredAt));
    }
    return NextResponse.json({error:"Unknown operation"},{status:400});
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // Domain errors are safe; never return secret configuration or customer details.
    const allowed = /already|pending|paid|cancelled|remind|evidence|configured|date|invoice|review|payment|amount|delivery|status|order|expired|actor|claim/i.test(msg);
    return NextResponse.json({error:allowed?msg:"Vorgang konnte nicht ausgeführt werden. Protokoll prüfen."},{status:409});
  }
}
