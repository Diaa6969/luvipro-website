import { NextRequest, NextResponse } from "next/server";
import { DEVICE, isStripeCheckoutReady, parseInquiry } from "@/lib/store";

export const runtime = "nodejs";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function POST(request: NextRequest) {
  if (!isStripeCheckoutReady()) {
    return NextResponse.json({ error: "Der Direktkauf ist aktuell nicht freigeschaltet." }, { status: 503 });
  }
  if (!sameOrigin(request) || !request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || "0") > 12000) {
    return NextResponse.json({ error: "Die Anfrage ist zu groß." }, { status: 413 });
  }
  let payload: unknown;
  try { payload = await request.json(); } catch {
    return NextResponse.json({ error: "Ungültige Formulardaten." }, { status: 400 });
  }
  const parsed = parseInquiry(payload);
  if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 });
  if (!parsed.data.termsAccepted) {
    return NextResponse.json({ error: "Bitte bestätigen Sie die Vertragsbedingungen." }, { status: 400 });
  }

  // Account configuration must match the server-trusted 3,000 EUR net price.
  const stripeKey = process.env.STRIPE_SECRET_KEY!;
  const priceId = process.env.STRIPE_PRICE_ID!;
  const authorization = { Authorization: `Bearer ${stripeKey}` };
  try {
    const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: authorization,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!priceResponse.ok) {
      console.error("LUVIPRO Stripe price lookup failed", priceResponse.status);
      return NextResponse.json({ error: "Zahlungskonfiguration vorübergehend nicht verfügbar." }, { status: 503 });
    }
    const price: { active?: boolean; currency?: string; unit_amount?: number; tax_behavior?: string; type?: string } = await priceResponse.json();
    if (
      !price.active || price.currency !== "eur" || price.unit_amount !== DEVICE.unitPriceNetCents ||
      price.type !== "one_time" || price.tax_behavior !== "exclusive"
    ) {
      console.error("LUVIPRO Stripe price does not match approved net pricing");
      return NextResponse.json({ error: "Die Preisangaben konnten nicht bestätigt werden. Bitte kontaktieren Sie uns." }, { status: 503 });
    }

    const d = parsed.data;
    const successUrl = new URL("/order/success", request.nextUrl.origin);
    successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
    const cancelUrl = new URL("/order", request.nextUrl.origin);
    cancelUrl.searchParams.set("mode", "buy");
    cancelUrl.searchParams.set("cancelled", "1");

    const form = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": String(d.quantity),
      "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]": String(DEVICE.shippingNetCentsGermany),
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "eur",
      "shipping_options[0][shipping_rate_data][display_name]": "Versand innerhalb Deutschlands",
      "shipping_options[0][shipping_rate_data][tax_behavior]": "exclusive",
      "shipping_address_collection[allowed_countries][0]": "DE",
      billing_address_collection: "required",
      "tax_id_collection[enabled]": "true",
      "automatic_tax[enabled]": "true",
      // Formal invoice is generated only after verified fulfillment by our
      // numbered invoice engine. Stripe handles the payment receipt.
      "invoice_creation[enabled]": "false",
      customer_email: d.email,
      customer_creation: "always",
      locale: "de",
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      client_reference_id: crypto.randomUUID(),
      "metadata[sku]": DEVICE.sku,
      "metadata[company]": d.company,
      "metadata[contact]": d.contact,
      "metadata[phone]": d.phone,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        ...authorization,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error("LUVIPRO Stripe Checkout error", response.status);
      return NextResponse.json({ error: "Der sichere Checkout konnte nicht gestartet werden. Bitte versuchen Sie es später." }, { status: 502 });
    }
    const session: { url?: string } = await response.json();
    if (typeof session.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/")) {
      return NextResponse.json({ error: "Die Bezahlseite ist nicht verfügbar." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("LUVIPRO checkout connection error");
    return NextResponse.json({ error: "Der Zahlungsdienst ist derzeit nicht erreichbar." }, { status: 502 });
  }
}
