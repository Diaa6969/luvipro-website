import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardList, CreditCard, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";
import { OrderForm } from "@/components/shop/order-form";
import { isPreorderBackendReady, isStripeCheckoutReady } from "@/lib/store";
import { isBankTransferReady } from "@/lib/bank-transfer/service";

export const metadata: Metadata = {
  title: "Gerät anfragen oder kaufen | LUVIPRO LU3656060",
  description: "Unverbindliche Anfrage für das LUVIPRO LU3656060 UV-Prüfgerät. Sichere Direktzahlung über Stripe bei aktivierter Zahlungsfunktion.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://luvipro.de/order" },
};

type SearchParams = Promise<{ mode?: string; cancelled?: string }>;

export default async function OrderPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialMode = params.mode === "bank" ? "bank" : params.mode === "buy" ? "buy" : "preorder";
  return (
    <main className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <AnimatedAtmosphere />
      <Navbar />
      <section className="section-shell pb-20 pt-32 sm:pt-40">
        <nav aria-label="Brotkrumennavigation" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-pulse">Startseite</Link><ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-pulse">Produkte</Link><ChevronRight className="h-4 w-4" />
          <span className="text-white">Produktanfrage & Kauf</span>
        </nav>
        <div className="mb-12 max-w-4xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-pulse">LUVIPRO · B2B Hardware</p>
          <h1 className="font-[var(--font-space-grotesk)] text-4xl font-semibold leading-tight sm:text-5xl">
            Ihr Weg zum <span className="text-pulse">LU3656060.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Fragen Sie Ihr professionelles UV-Prüfgerät unverbindlich an oder nutzen Sie den integrierten Direktkauf, sobald die sichere Zahlung aktiviert ist.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-pulse" /> Unverbindliche Anfrage</span>
            <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-pulse" /> Stripe Checkout</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-pulse" /> Für Unternehmen</span>
          </div>
        </div>
        {params.cancelled === "1" ? (
          <div className="mb-7 rounded-xl border border-pulse/30 bg-pulse/10 p-4 text-sm text-slate-200" role="status">
            Sie haben den Bezahlvorgang abgebrochen. Es wurde durch diesen Vorgang keine Bestellung abgeschlossen.
          </div>
        ) : null}
        <OrderForm
          initialMode={initialMode}
          paymentsReady={isStripeCheckoutReady()}
          preorderReady={isPreorderBackendReady()}
          bankReady={isBankTransferReady()}
        />
      </section>
      <Footer />
    </main>
  );
}
