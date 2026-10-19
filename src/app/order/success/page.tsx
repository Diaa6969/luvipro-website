import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, Mail } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { CtaLink } from "@/components/ui/cta-link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zahlungsstatus | LUVIPRO",
  robots: { index: false, follow: false },
};

type Status = "paid" | "processing" | "unverified";

async function verifyCheckout(sessionId: string): Promise<Status> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !/^cs_(?:live|test)_[A-Za-z0-9]{10,}$/.test(sessionId)) return "unverified";
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return "unverified";
    const session: { payment_status?: string; mode?: string; metadata?: { sku?: string } } = await response.json();
    if (session.mode !== "payment" || session.metadata?.sku !== "LU3656060") return "unverified";
    if (session.payment_status === "paid") return "paid";
    return "processing";
  } catch {
    return "unverified";
  }
}

export default async function OrderSuccessPage({ searchParams }: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const query = await searchParams;
  const state = await verifyCheckout(query.session_id || "");
  const isPaid = state === "paid";
  const isProcessing = state === "processing";
  const Icon = isPaid ? CheckCircle2 : isProcessing ? Clock3 : AlertCircle;
  const title = isPaid ? "Zahlung bestätigt." : isProcessing ? "Zahlungsstatus wird geprüft." : "Zahlung konnte nicht bestätigt werden.";
  const body = isPaid
    ? "Die Zahlung wurde über Stripe bestätigt. Die weitere Bestellbearbeitung erfolgt anschließend durch LUVIPRO. Bewahren Sie die Zahlungsbestätigung von Stripe auf."
    : isProcessing
      ? "Der Zahlungsdienst meldet noch keine abgeschlossene Zahlung. Bitte kontrollieren Sie die Bestätigung von Stripe und wenden Sie sich bei Fragen an uns."
      : "Wir können zu diesem Aufruf keine erfolgreiche Zahlung nachweisen. Bitte schließen Sie daraus nicht, dass eine Bestellung bezahlt wurde. Kontrollieren Sie Ihren Zahlungsbeleg oder kontaktieren Sie uns.";

  return (
    <main className="min-h-screen overflow-x-hidden bg-radial-grid text-white">
      <Navbar />
      <section className="section-shell flex min-h-[75vh] items-center justify-center pb-16 pt-32">
        <div className="glass-panel w-full max-w-3xl rounded-2xl p-8 text-center sm:p-12">
          <Icon className={`mx-auto h-16 w-16 ${isPaid ? "text-emerald-300" : "text-pulse"}`} />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-pulse">LUVIPRO · Zahlungsstatus</p>
          <h1 className="mt-4 font-[var(--font-space-grotesk)] text-3xl font-semibold sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300">{body}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <CtaLink href="/products" variant="secondary">Zum Produkt</CtaLink>
            <CtaLink href="/contact" className="gap-2"><Mail className="h-4 w-4" /> Kontakt aufnehmen</CtaLink>
          </div>
          <p className="mt-8 text-xs text-slate-500">Ein Zahlungsbeleg oder der interne Bestellstatus ist maßgeblich; diese Seite ersetzt keine Rechnung.</p>
          <Link href="/" className="mt-5 inline-flex text-sm text-slate-400 underline underline-offset-4 hover:text-pulse">Zurück zur Startseite</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
