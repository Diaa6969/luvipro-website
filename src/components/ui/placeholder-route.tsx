import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { CtaLink } from "@/components/ui/cta-link";

type PlaceholderRouteProps = {
  title: string;
  text: string;
};

export function PlaceholderRoute({ title, text }: PlaceholderRouteProps) {
  return (
    <main className="min-h-screen bg-radial-grid text-white">
      <Navbar />
      <section className="section-shell flex min-h-[72vh] items-center pt-28">
        <div className="glass-panel max-w-2xl rounded-lg p-8 sm:p-10">
          <p className="mb-4 text-sm font-semibold uppercase text-pulse">LUVIPRO</p>
          <h1 className="font-[var(--font-space-grotesk)] text-4xl font-semibold sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">{text}</p>
          <CtaLink href="/" variant="secondary" className="mt-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zur Startseite
          </CtaLink>
        </div>
      </section>
      <Footer />
    </main>
  );
}
