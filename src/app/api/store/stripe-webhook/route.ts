import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { DEVICE } from "@/lib/store";
import { sendHostingerMail } from "@/lib/hostinger-smtp";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: {
      id?: string;
      mode?: string;
      payment_status?: string;
      amount_total?: number;
      currency?: string;
      customer_details?: { email?: string | null };
      metadata?: { sku?: string; company?: string; contact?: string };
    };
  };
};

function verifyStripeSignature(signature: string | null, raw: string, secret: string): boolean {
  if (!signature) return false;
  const parts = signature.split(",").map((p) => p.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1] ?? "";
  const t = Number(timestamp);
  if (!Number.isSafeInteger(t) || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const candidate = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const expected = Buffer.from(candidate, "hex");
  return parts.some(([key, sig]) => {
    if (key !== "v1" || !/^[a-f0-9]{64}$/i.test(sig || "")) return false;
    const input = Buffer.from(sig, "hex");
    return input.length === expected.length && timingSafeEqual(input, expected);
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (Number(request.headers.get("content-length") || "0") > 150000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const raw = await request.text();
  if (!verifyStripeSignature(request.headers.get("stripe-signature"), raw, webhookSecret)) {
    return NextResponse.json({ error: "Signature invalid" }, { status: 400 });
  }

  let event: StripeEvent;
  try { event = JSON.parse(raw) as StripeEvent; } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }
  const session = event.data?.object;
  if (!session || session.mode !== "payment" || session.payment_status !== "paid" || session.metadata?.sku !== DEVICE.sku) {
    return NextResponse.json({ received: true });
  }

  // Stripe Dashboard remains the source of truth for orders and payment status.
  // SMTP has no cross-request idempotency. Do not fulfil an order solely because
  // a notification was received; match the Stripe session ID in the Dashboard.
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.STORE_ORDER_EMAIL) {
    const emailBody = [
      "LUVIPRO – Stripe meldet eine bezahlte Checkout-Session.",
      "Vor Versand unbedingt Zahlung, Kundenadresse und Rechnung im Stripe Dashboard prüfen.",
      `Stripe Session: ${session.id || "-"}`,
      `Gerät: ${DEVICE.sku}`,
      `Kunde/Firma: ${session.metadata?.company || "-"}`,
      `Kontakt: ${session.metadata?.contact || "-"}`,
      `Kunden-E-Mail: ${session.customer_details?.email || "-"}`,
      `Betrag inklusive Steuer und Versand: ${typeof session.amount_total === "number" ? (session.amount_total / 100).toFixed(2) : "-"} ${session.currency || "eur"}`,
    ].join("\n");
    try {
      await sendHostingerMail({
        to: process.env.STORE_ORDER_EMAIL,
        replyTo: process.env.STORE_ORDER_EMAIL,
        subject: `LUVIPRO: Zahlungsmitteilung ${session.id || DEVICE.sku}`,
        text: emailBody,
      });
    } catch {
      console.error("LUVIPRO paid-session SMTP notification failed");
      return NextResponse.json({ error: "Notification unavailable" }, { status: 502 });
    }
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
