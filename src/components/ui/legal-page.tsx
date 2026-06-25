import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { CtaLink } from "@/components/ui/cta-link";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

type LegalPageProps = {
  title: string;
  intro: string[];
  sections: LegalSection[];
};

function anchorFor(title: string) {
  return title
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-radial-grid text-white">
      <Navbar />
      <section className="section-shell pt-28 sm:pt-32">
        <div className="glass-panel rounded-lg p-6 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase text-pulse">
                <ShieldCheck className="h-4 w-4" />
                LUVIPRO Rechtliches
              </p>
              <h1 className="font-[var(--font-space-grotesk)] text-4xl font-semibold sm:text-5xl">
                {title}
              </h1>
              <div className="mt-6 space-y-4 text-base leading-8 text-slate-300">
                {intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <CtaLink href="/" variant="secondary" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </CtaLink>
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-8 py-12 lg:grid-cols-[280px_1fr] lg:py-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass-panel rounded-lg p-5">
            <p className="mb-4 text-sm font-semibold uppercase text-pulse">Inhalt</p>
            <nav className="space-y-2">
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${anchorFor(section.title)}`}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="glass-panel rounded-lg p-6 sm:p-10">
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title} id={anchorFor(section.title)} className="scroll-mt-28">
                <h2 className="font-[var(--font-space-grotesk)] text-2xl font-semibold text-white">
                  {section.title}
                </h2>
                {section.paragraphs ? (
                  <div className="mt-4 space-y-4 text-base leading-8 text-slate-300">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
                {section.list ? (
                  <ul className="mt-5 space-y-3 text-base leading-7 text-slate-300">
                    {section.list.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>
      </section>
      <Footer />
    </main>
  );
}
