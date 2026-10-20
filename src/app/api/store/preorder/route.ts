import { NextRequest, NextResponse } from "next/server";
import { DEVICE, formatEuro, isPreorderBackendReady, parseInquiry } from "@/lib/store";
import { sendHostingerMail } from "@/lib/hostinger-smtp";

export const runtime = "nodejs";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function POST(request: NextRequest) {
  if (!isPreorderBackendReady()) {
    return NextResponse.json({ error: "Der automatische Anfrageversand ist noch nicht aktiviert. Bitte kontaktieren Sie customerservice@luvipro.de." }, { status: 503 });
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

  const d = parsed.data;
  const reference = `LUV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const emailText = [
    "LUVIPRO – UNVERBINDLICHE PRODUKTANFRAGE",
    "WICHTIG: Kein Kaufvertrag, keine Zahlung, keine bestätigte Lieferzusage.",
    "",
    `Referenz: ${reference}`,
    `Produkt: ${DEVICE.title}`,
    `SKU: ${DEVICE.sku}`,
    `Menge: ${d.quantity}`,
    `Geräte-Zwischensumme netto: ${formatEuro(DEVICE.unitPriceNetCents * d.quantity)}`,
    `Versand Deutschland netto (einmalig): ${formatEuro(DEVICE.shippingNetCentsGermany)}`,
    `Gesamtsumme netto: ${formatEuro(DEVICE.unitPriceNetCents * d.quantity + DEVICE.shippingNetCentsGermany)} (zzgl. anwendbarer Umsatzsteuer)`,
    "",
    `Firma: ${d.company}`,
    `Ansprechpartner: ${d.contact}`,
    `E-Mail: ${d.email}`,
    `Telefon: ${d.phone || "Nicht angegeben"}`,
    `Anschrift: ${d.street || "-"}, ${d.postalCode || "-"} ${d.city || "-"}, Deutschland`,
    `USt-IdNr.: ${d.vatId || "Nicht angegeben"}`,
    `Nachricht: ${d.note || "-"}`,
    "",
    "Bitte persönlich auf diese Anfrage antworten.",
  ].join("\n");

  try {
    await sendHostingerMail({
      to: process.env.STORE_ORDER_EMAIL!,
      replyTo: d.email,
      subject: `Unverbindliche Produktanfrage ${DEVICE.sku} · ${reference}`,
      text: emailText,
    });
    return NextResponse.json(
      { reference },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Never expose SMTP errors, credentials, or server responses to visitors.
    console.error("LUVIPRO Hostinger SMTP delivery failed");
    return NextResponse.json({
      error: "Übermittlung zurzeit nicht möglich. Bitte kontaktieren Sie customerservice@luvipro.de.",
    }, { status: 502 });
  }
}
