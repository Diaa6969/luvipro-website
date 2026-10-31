import {
  AlertTriangle, ArrowRight, BadgeCheck, BadgeEuro, Bell, Car, CarFront, Check,
  DatabaseZap, ExternalLink, FileCheck2, FileLock2, FileScan,
  FileWarning, Fingerprint, LockKeyhole, MapPin, MapPinned, Navigation,
  ScanLine, ScanSearch, ScanText, ShieldAlert, ShieldCheck, Smartphone,
  Sparkles, Store, UserCheck, UserRoundCheck, Wrench, Zap,
} from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { AnimatedAtmosphere } from "@/components/ui/animated-atmosphere";
import { SemanticFilm } from "@/components/ui/semantic-film";
import { InternationalNavbar, LocaleDocument } from "./international-navbar";
import { WorkshopFinder } from "@/components/sections/workshop-finder";
import { internationalHomeCopy, type InternationalLocale } from "@/lib/international-home-copy";

const problemIcons = [ScanSearch, FileWarning, ShieldAlert];
const ecosystemIcons = [ScanSearch, CarFront, FileCheck2, FileCheck2, MapPinned, Store];
const flowIcons = [Wrench, BadgeEuro, UserCheck];
const securityIcons = [FileLock2, DatabaseZap, UserRoundCheck];

export function InternationalHome({ locale }: { locale: InternationalLocale }) {
  const t = internationalHomeCopy[locale];
  const s = t.sections;
  const isArabic = locale === "ar";

  return (
    <main
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white"
    >
      <LocaleDocument locale={locale} />
      <AnimatedAtmosphere />
      <InternationalNavbar locale={locale} />

      {/* Hero: identical visual structure to the German homepage. */}
      <section className="semantic-hero relative min-h-screen overflow-hidden pt-24 sm:pt-32">
        <SemanticFilm scene="hero" mode="hero" />
        <div className="section-shell relative grid min-w-0 items-center gap-10 pb-20 sm:gap-12 sm:pb-24 lg:grid-cols-[1.02fr_0.98fr]">
          <Reveal>
            <div className="min-w-0 max-w-full">
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 px-4 py-2 text-sm font-medium text-frost">
                <BadgeCheck className="h-4 w-4 shrink-0 text-pulse" />
                <span className="min-w-0 break-words">{s.hero.badge}</span>
              </div>
              <h1 className="max-w-full break-words font-[var(--font-space-grotesk)] text-[clamp(2.55rem,11vw,4.5rem)] font-semibold leading-[1.15] text-white sm:text-6xl lg:text-7xl">
                {s.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {s.hero.description}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CtaLink href={`/${locale}/workshops`} className="gap-2">
                  {locale === "ar" ? "احجز فحص سيارتك" : "Get your car checked"} <ArrowRight className="h-4 w-4" />
                </CtaLink>
                <CtaLink href={`/${locale}/reports`} variant="secondary">{locale === "ar" ? "البحث عن تقرير" : "Find report"}</CtaLink>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="semantic-hero-panel relative overflow-hidden p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-pulse">LUVIPRO · {s.hero.example}</p>
              <h2 className="mt-4 font-[var(--font-space-grotesk)] text-2xl font-semibold text-white sm:text-3xl">
                {isArabic ? "فحص واضح ونتائج موثّقة" : "Clear checks. Documented findings."}
              </h2>
              <div className="mt-7 space-y-3">
                {s.hero.checks.map((item, i) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                    <ScanLine className="h-5 w-5 shrink-0 text-pulse" />
                    <p className="text-sm font-medium text-white">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-400">
                {isArabic ? "الخلفية تصوير حقيقي لورشة سيارات للتوضيح، وليست فحصاً فعلياً من LUVIPRO." : "Real workshop footage for illustration, not an actual LUVIPRO inspection."}
              </p>
            </div>
          </Reveal>
        </div>
        <div className="section-shell relative -mt-10 grid gap-4 pb-16 sm:grid-cols-3">
          {s.hero.stats.map(([value, label]) => (
            <div key={value} className="semantic-card p-5">
              <SemanticFilm />
              <p className="font-[var(--font-space-grotesk)] text-3xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-sm text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-midnight py-24">
        <div className="section-shell">
          <Reveal><SectionHeading eyebrow={s.problem.eyebrow} title={s.problem.title} description={s.problem.description} /></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {s.problem.items.map(([title, description], index) => {
              const Icon = problemIcons[index];
              return (
                <Reveal key={title} delay={index * 0.08}>
                  <div className="semantic-card h-full p-6">
                    {index === 0 ? <SemanticFilm scene="surface" /> : <SemanticFilm />}
                    <Icon className="h-9 w-9 text-pulse" />
                    <h3 className="mt-6 font-[var(--font-space-grotesk)] text-xl font-semibold">{title}</h3>
                    <p className="mt-3 leading-7 text-slate-300">{description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-10 rounded-lg border border-ultraviolet/25 bg-ultraviolet/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <AlertTriangle className="h-10 w-10 shrink-0 text-ultraviolet" />
              <p className="max-w-4xl text-lg leading-8 text-slate-200">{s.problem.callout}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="ecosystem" className="bg-obsidian py-24">
        <div className="section-shell">
          <Reveal><SectionHeading eyebrow={s.ecosystem.eyebrow} title={s.ecosystem.title} description={s.ecosystem.description} align="center" /></Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {s.ecosystem.items.map(([title, description], index) => {
              const Icon = ecosystemIcons[index];
              return (
                <Reveal key={title} delay={index * 0.05}>
                  <div className="semantic-card group h-full p-6">
                    {index === 0 ? <SemanticFilm scene="gloss" /> : index === 5 ? <SemanticFilm scene="light" /> : <SemanticFilm />}
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pulse/10 text-pulse"><Icon className="h-6 w-6" /></div>
                    <h3 className="mt-6 font-[var(--font-space-grotesk)] text-xl font-semibold">{title}</h3>
                    <p className="mt-3 leading-7 text-slate-300">{description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-slate-400">
            <Wrench className="h-4 w-4 shrink-0 text-pulse" />{s.ecosystem.note}
          </div>
        </div>
      </section>

      <section id="scanner" className="bg-midnight py-24">
        <div className="section-shell grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-3 rounded-lg bg-ultraviolet/15 blur-2xl sm:-inset-8 sm:blur-3xl" />
              <div className="semantic-card relative rounded-lg p-6">
                <SemanticFilm scene="paintwork" mode="section" />
                <div className="aspect-square rounded-lg border border-pulse/20 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.35),transparent_34%),linear-gradient(150deg,rgba(255,255,255,0.08),rgba(0,0,0,0.5))] p-8">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-200">{s.device.badge}</span>
                      <CarFront className="h-9 w-9 shrink-0 text-pulse" />
                    </div>
                    <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-pulse/50 bg-pulse/10 shadow-glow">
                      <ScanLine className="h-20 w-20 text-pulse" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {s.device.labels.map((label) => (
                        <div key={label} className="rounded-lg bg-black/30 p-3 text-center text-sm font-semibold">{label}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <SectionHeading eyebrow={s.device.eyebrow} title={s.device.title} description={s.device.description} />
            <div className="mt-8 space-y-4">
              {s.device.items.map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-200">
                  <Sparkles className="h-5 w-5 shrink-0 text-pulse" />{item}
                </div>
              ))}
            </div>
            <CtaLink href={`/${locale}/workshops`} className="mt-8">{locale === "ar" ? "ابحث عن ورشة لفحص سيارتك" : "Find a workshop for your vehicle check"}</CtaLink>
          </Reveal>
        </div>
      </section>

      <section className="bg-obsidian py-24">
        <div className="section-shell grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <SectionHeading eyebrow={s.document.eyebrow} title={s.document.title} description={s.document.description} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[ScanText, LockKeyhole].map((Icon, i) => (
                <div key={s.document.cards[i]} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                  <Icon className="h-7 w-7 text-pulse" />
                  <p className="mt-4 font-semibold text-white">{s.document.cards[i]}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="glass-panel rounded-lg p-6">
              <div className="rounded-lg border border-white/10 bg-black/35 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{s.document.preview}</p>
                    <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">{s.document.document}</p>
                  </div>
                  <FileScan className="h-10 w-10 shrink-0 text-pulse" />
                </div>
                <div className="space-y-3">
                  {s.document.fields.map((field, index) => (
                    <div key={field} className="grid gap-2 rounded-lg bg-white/5 p-3 text-sm sm:grid-cols-[130px_1fr] sm:gap-3">
                      <span className="text-slate-400">{field}</span>
                      <span className={`${index === 0 ? "text-pulse" : "text-slate-100"} min-w-0 break-words`} dir={index === 0 ? "ltr" : undefined}>
                        {index === 0 ? "WBA5XXXXXX1234567" : s.document.placeholder}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="how-it-works" className="bg-midnight py-24">
        <div className="section-shell">
          <Reveal><SectionHeading eyebrow={s.flow.eyebrow} title={s.flow.title} description={s.flow.description} align="center" /></Reveal>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {s.flow.items.map(([title, steps], index) => {
              const Icon = flowIcons[index];
              return (
                <Reveal key={title} delay={index * 0.08}>
                  <div className="semantic-card h-full p-6">
                    {index === 0 ? <SemanticFilm scene="wheel" /> : <SemanticFilm />}
                    <div className="flex items-center justify-between"><Icon className="h-9 w-9 text-pulse" /><Car className="h-6 w-6 text-white/30" /></div>
                    <h3 className="mt-7 font-[var(--font-space-grotesk)] text-2xl font-semibold">{title}</h3>
                    <ol className="mt-6 space-y-4">
                      {steps.map((step, i) => (
                        <li key={step} className="flex items-center gap-3 text-slate-200">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pulse/10 text-sm font-semibold text-pulse">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-obsidian py-24">
        <div className="section-shell">
          <Reveal><SectionHeading eyebrow={s.business.eyebrow} title={s.business.title} description={s.business.description} /></Reveal>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
            {s.business.plans.slice(0,2).map(([name, price, features, cta, href], index) => (
              <Reveal key={name} delay={index * 0.08}>
                <div className="semantic-card flex h-full flex-col p-6">
                  <SemanticFilm scene={index === 0 ? "standard" : "premium"} />
                  <p className="font-[var(--font-space-grotesk)] text-2xl font-semibold">{name}</p>
                  <p className="mt-3 text-lg text-pulse">{price}</p>
                  <div className="mt-7 space-y-3">
                    {features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-slate-300"><Check className="h-5 w-5 shrink-0 text-pulse" />{feature}</div>
                    ))}
                  </div>
                  <CtaLink
                    href="#partner-map"
                    variant={index === 0 ? "primary" : "secondary"}
                    className="mt-8 gap-2"
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {cta} {href.startsWith("http") ? <ExternalLink className="h-4 w-4" /> : null}
                  </CtaLink>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="partner-map" className="scroll-mt-24 bg-midnight py-24">
        <div className="section-shell">
          <Reveal><WorkshopFinder locale={locale} /></Reveal>
        </div>
      </section>

      <section className="bg-obsidian py-24">
        <div className="section-shell">
          <Reveal><SectionHeading eyebrow={s.security.eyebrow} title={s.security.title} description={s.security.description} align="center" /></Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {s.security.items.map(([title, description], index) => {
              const Icon = securityIcons[index];
              return (
                <Reveal key={title} delay={index * 0.08}>
                  <div className="semantic-card h-full p-6">
                    <SemanticFilm />
                    <Icon className="h-8 w-8 text-pulse" />
                    <h3 className="mt-6 font-[var(--font-space-grotesk)] text-xl font-semibold">{title}</h3>
                    <p className="mt-3 leading-7 text-slate-300">{description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={0.12}>
            <div className="mt-10 rounded-lg border border-pulse/25 bg-pulse/10 p-6 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-pulse" />
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-200">{s.security.callout}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-midnight py-24">
        <div className="section-shell">
          <Reveal>
            <div className="glass-panel rounded-lg p-8 text-center sm:p-12">
              <ShieldCheck className="mx-auto h-12 w-12 text-pulse" />
              <h2 className="mx-auto mt-6 max-w-4xl font-[var(--font-space-grotesk)] text-3xl font-semibold text-white sm:text-5xl">{s.end.title}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">{s.end.description}</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <CtaLink href={`/${locale}/workshops`} className="gap-2">{locale === "ar" ? "افحص سيارتك" : "Get your car checked"} <ArrowRight className="h-4 w-4" /></CtaLink>
                <CtaLink href={`/${locale}/reports`} variant="secondary">{locale === "ar" ? "البحث عن تقرير" : "Find report"}</CtaLink>
                <CtaLink href={`/${locale}/workshops`} variant="secondary">{s.end.app}</CtaLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-obsidian py-12">
        <div className="section-shell">
          <div className="grid gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <BrandLogo size="footer" homeHref={`/${locale}`} />
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">{s.footer.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [t.site.workshops, `/${locale}/workshops`], [locale === "ar" ? "البحث عن تقرير" : "Find report", `/${locale}/reports`],
                [t.site.shop, `/${locale}/products`], [t.site.contact, `/${locale}/contact`],
                [t.site.imprint, "/impressum"], [t.site.privacy, "/datenschutz"], ["Konto löschen (DE)", "/konto-loeschen"], [t.site.terms, "/agb"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                >
                  {label}{href.startsWith("http") ? <ExternalLink className="h-3.5 w-3.5" /> : null}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 LUVIPRO. {s.footer.copyright}</p>
            <p>{s.footer.note}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
