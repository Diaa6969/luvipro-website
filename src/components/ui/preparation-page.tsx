import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { CtaLink } from "@/components/ui/cta-link";

type PreparationCard = {
  title: string;
  text: string;
};

type PreparationAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
};

type PreparationPageProps = {
  eyebrow: string;
  headline: string;
  text: string;
  cards: PreparationCard[];
  actions: PreparationAction[];
  note?: string;
};

export function PreparationPage({
  eyebrow,
  headline,
  text,
  cards,
  actions,
  note,
}: PreparationPageProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-radial-grid text-white">
      <Navbar />
      <section className="section-shell pt-28 sm:pt-32">
        <div className="glass-panel rounded-lg p-6 sm:p-10">
          <p className="mb-4 text-sm font-semibold uppercase text-pulse">{eyebrow}</p>
          <h1 className="max-w-4xl font-[var(--font-space-grotesk)] text-4xl font-semibold sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{text}</p>
          {note ? (
            <p className="mt-5 max-w-3xl rounded-lg border border-pulse/20 bg-pulse/10 p-4 text-sm leading-6 text-slate-200">
              {note}
            </p>
          ) : null}

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div key={card.title} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                <CheckCircle2 className="h-6 w-6 text-pulse" />
                <h2 className="mt-4 font-[var(--font-space-grotesk)] text-xl font-semibold">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {actions.map((action) => (
              <CtaLink key={`${action.href}-${action.label}`} href={action.href} variant={action.variant ?? "secondary"}>
                {action.label}
              </CtaLink>
            ))}
            <CtaLink href="/" variant="secondary" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zur Startseite
            </CtaLink>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
