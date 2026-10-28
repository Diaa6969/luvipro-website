import Link from "next/link";
import { ArrowRight, BatteryCharging, CarFront, Check, FileCheck2, FileLock2, Fingerprint, Globe2, Mail, MapPin, ScanLine, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { LanguagePicker } from "@/components/ui/language-picker";
import { DocumentLanguage } from "@/components/ui/document-language";
import { localeHome, localeHref, type SiteLocale } from "@/lib/site-locales";
import { siteTranslation } from "@/lib/site-translation";
import { EuropeanLookup } from "./european-lookup";

const panel = "rounded-2xl border border-white/10 bg-white/[0.045] p-6 transition hover:border-pulse/40 sm:p-8";
const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-pulse px-6 py-3 font-semibold text-obsidian transition hover:bg-frost";
const secondary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-pulse/40 bg-pulse/10 px-6 py-3 font-semibold text-white transition hover:border-pulse";

export function EuropeanHeader({ locale, section }: { locale: SiteLocale; section?: "products" | "reports" | "workshops" | "contact" | "app" }) {
  const t = siteTranslation(locale);
  const items = [
    [t.navHome, localeHome(locale)],
    [t.navDevice, localeHref(locale, "products")],
    [t.navReports, localeHref(locale, "reports")],
    [t.navPartners, localeHref(locale, "workshops")],
    [t.navContact, localeHref(locale, "contact")],
  ] as const;
  return (
    <header className="relative z-50 border-b border-[#243450] bg-[#060c1b]">
      <div className="section-shell flex min-h-20 items-center justify-between gap-4">
        <BrandLogo homeHref={localeHome(locale)} />
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Main navigation">
          {items.map(([text,href]) => <Link href={href} key={href} className="text-sm text-slate-200 transition hover:text-pulse">{text}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <LanguagePicker current={locale} section={section} compact />
          <details className="relative xl:hidden">
            <summary className="cursor-pointer list-none rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm text-white [&::-webkit-details-marker]:hidden" aria-label="Open menu">
              ☰
            </summary>
            <nav className="absolute end-0 z-[70] mt-3 grid min-w-[220px] max-w-[85vw] gap-1 rounded-xl border border-white/20 bg-[#070e1e] p-3 shadow-2xl">
              {items.map(([text,href]) => <Link key={href} href={href} className="rounded-lg px-4 py-3 text-sm text-slate-200 hover:bg-white/10">{text}</Link>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function EuropeanFooter({ locale }: { locale: SiteLocale }) {
  const t = siteTranslation(locale);
  return (
    <footer className="border-t border-white/10 bg-[#060b16] py-12">
      <div className="section-shell grid gap-8 lg:grid-cols-2">
        <div>
          <BrandLogo homeHref={localeHome(locale)} size="footer" />
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">{t.intro}</p>
          <p className="mt-3 text-xs text-slate-500">© LUVIPRO</p>
        </div>
        <div className="space-y-4">
          <p className="text-xs leading-6 text-amber-200">{t.legalNote}</p>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-200">
            <Link href="/impressum" className="hover:text-pulse">Impressum (DE)</Link>
            <Link href="/datenschutz" className="hover:text-pulse">Datenschutz (DE)</Link>
            <Link href="/konto-loeschen" className="hover:text-pulse">Konto löschen (DE)</Link>
            <Link href="/agb" className="hover:text-pulse">AGB (DE)</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function EuropeanHome({ locale }: { locale: SiteLocale }) {
  const t = siteTranslation(locale);
  return (
    <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="cinematic-page min-h-screen overflow-hidden bg-obsidian text-white">
      <DocumentLanguage locale={locale} />
      <EuropeanHeader locale={locale} />
      <section className="relative overflow-hidden bg-radial-grid py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(126,34,206,0.25),transparent_45%),radial-gradient(circle_at_20%_70%,rgba(32,214,255,0.12),transparent_35%)]" />
        <div className="section-shell relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-w-0">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 px-4 py-2 text-sm font-semibold text-frost">
              <ShieldCheck className="size-4 shrink-0" />{t.tagline}
            </p>
            <h1 className="mt-8 max-w-3xl font-[var(--font-space-grotesk)] text-[clamp(2.4rem,5vw,4.5rem)] font-semibold leading-[1.07]">{t.headline}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{t.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={localeHref(locale,"reports")} className={primary}>{t.reportCta}<ArrowRight className="size-4" /></Link>
              <Link href={localeHref(locale,"products")} className={secondary}>{t.navDevice}</Link>
            </div>
          </div>
          <div className={panel}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pulse">LUVIPRO · 365 nm</p>
            <div className="my-9 flex items-center justify-around">
              <ScanLine className="size-20 text-pulse sm:size-28" strokeWidth={1.25} />
              <div className="h-px flex-1 bg-gradient-to-r from-pulse to-ultraviolet" />
              <CarFront className="size-20 text-white sm:size-28" strokeWidth={1.25} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {["UV 365 nm","VIN / FIN","PDF"].map(x=><div key={x} className="rounded-xl border border-white/10 bg-black/20 p-3 font-semibold">{x}</div>)}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-300">{t.uvText}</p>
          </div>
        </div>
      </section>
      <section id="ecosystem" className="section-shell py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-pulse">LUVIPRO</p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t.features}</h2>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {[
            [ScanLine,t.uvTitle,t.uvText],
            [Fingerprint,t.vinTitle,t.vinText],
            [FileCheck2,t.pdfTitle,t.pdfText],
          ].map(([Icon,title,body],i)=>{
            const Symbol = Icon as typeof ScanLine;
            return <div key={i} className={panel}><Symbol className="size-9 text-pulse"/><h3 className="mt-5 text-xl font-semibold">{title as string}</h3><p className="mt-3 text-sm leading-7 text-slate-300">{body as string}</p></div>;
          })}
        </div>
      </section>
      <section className="bg-midnight py-20">
        <div className="section-shell">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t.prices}</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              ["Standard","59,99 €","19% VAT"],
              ["Premium","119,99 €","19% VAT"],
              ["LUVIPRO LU3656060","3.000,00 €","B2B"],
            ].map(([label,amount,tax])=>
              <div key={label} className={panel}>
                <p className="text-xl font-semibold">{label}</p>
                <p className="mt-5 font-[var(--font-space-grotesk)] text-4xl font-bold">{amount}</p>
                <p className="mt-2 text-xs text-slate-400">{tax}</p>
                <Link href={label==="LUVIPRO LU3656060"?localeHref(locale,"products"):localeHref(locale,"workshops")} className="mt-8 inline-flex items-center gap-2 font-semibold text-pulse hover:text-white">
                  {label==="LUVIPRO LU3656060"?t.order:t.partnerCta}<ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-300">{t.priceNote}</p>
        </div>
      </section>
      <section id="reports" className="section-shell grid items-center gap-9 py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div><h2 className="text-3xl font-semibold sm:text-4xl">{t.reportTitle}</h2><p className="mt-5 text-base leading-8 text-slate-300">{t.reportText}</p></div>
        <EuropeanLookup locale={locale} />
      </section>
      <section id="partners" className="bg-midnight py-20">
        <div className="section-shell grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <MapPin className="hidden size-36 text-pulse/50 lg:block" strokeWidth={1.1} />
          <div><h2 className="text-3xl font-semibold sm:text-4xl">{t.partnerTitle}</h2><p className="mt-5 text-base leading-8 text-slate-300">{t.partnerText}</p>
            <Link href={localeHref(locale,"workshops")} className={secondary+" mt-7"}>{t.partnerCta}<ArrowRight className="size-4"/></Link></div>
        </div>
      </section>
      <section className="section-shell py-20">
        <div className={panel}><FileLock2 className="size-9 text-pulse"/><h2 className="mt-5 text-3xl font-semibold">{t.trustTitle}</h2><p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{t.trustText}</p></div>
      </section>
      <EuropeanFooter locale={locale} />
    </main>
  );
}

export function EuropeanInner({ locale, section }: { locale: SiteLocale; section: "products"|"reports"|"workshops"|"contact"|"app" }) {
  const t = siteTranslation(locale);
  const title = section === "products" ? "LUVIPRO LU3656060" : section === "reports" ? t.reportTitle :
    section === "workshops" ? t.partnerTitle : section === "contact" ? t.navContact : t.app;
  const description = section === "products" ? t.uvText : section === "reports" ? t.reportText :
    section === "workshops" ? t.partnerText : section === "contact" ? t.legalNote : t.searchNotice;
  return (
    <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="cinematic-page min-h-screen bg-obsidian text-white">
      <DocumentLanguage locale={locale} />
      <EuropeanHeader locale={locale} section={section} />
      <section className="section-shell min-h-[65vh] pb-20 pt-16 sm:pt-24">
        <Link href={localeHome(locale)} className="text-sm text-pulse hover:text-white">← {t.back}</Link>
        <p className="mt-12 text-xs font-semibold uppercase tracking-widest text-pulse">LUVIPRO</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{description}</p>
        {section === "products" && <div className="mt-9 grid gap-5 md:grid-cols-2">
          <div className={panel}><BatteryCharging className="size-10 text-pulse"/><h2 className="mt-5 text-2xl font-semibold">LU3656060 · 365 nm</h2><p className="mt-3 text-slate-300">{t.bundle}</p>
            <p className="mt-6 text-4xl font-semibold">3.000,00 € <span className="text-base text-slate-400">netto</span></p>
            <p className="mt-3 text-sm text-slate-300">{t.priceNote}</p>
            <Link href="/order?mode=preorder" className={primary+" mt-7"}>{t.germanCheckout}<ArrowRight className="size-4"/></Link></div>
          <div className={panel}><ScanLine className="size-10 text-pulse"/><h2 className="mt-5 text-2xl font-semibold">{t.uvTitle}</h2><p className="mt-3 text-slate-300">{t.uvText}</p><p className="mt-5 text-sm text-amber-200">{t.legalNote}</p></div>
        </div>}
        {section === "reports" && <div className="mt-9 max-w-3xl"><EuropeanLookup locale={locale}/></div>}
        {section === "workshops" && <div className={panel+" mt-9 max-w-3xl"}>
          <MapPin className="size-10 text-pulse" /><h2 className="mt-5 text-xl font-semibold">{t.partnerCta}</h2>
          <p className="mt-3 text-slate-300">{t.partnerText}</p>
          <Link href="/partner-workshops" className={secondary+" mt-7"}>{t.germanCheckout}<ArrowRight className="size-4"/></Link>
        </div>}
        {section === "contact" && <div className={panel+" mt-9 max-w-3xl"}>
          <Mail className="size-10 text-pulse" /><h2 className="mt-5 text-xl font-semibold">LUVIPRO · Hannover, Germany</h2>
          <div className="mt-5 space-y-4">
            <a className="block text-pulse underline" href="mailto:info@luvipro.de">info@luvipro.de</a>
            <a className="block text-pulse underline" href="mailto:customerservice@luvipro.de">customerservice@luvipro.de</a>
            <Link href="/contact" className="inline-flex text-sm text-pulse underline">{t.germanCheckout}</Link>
          </div>
        </div>}
        {section === "app" && <div className={panel+" mt-9 max-w-3xl"}>
          <Globe2 className="size-10 text-pulse"/><h2 className="mt-5 text-xl font-semibold">{t.app}</h2>
          <p className="mt-4 text-slate-300">{t.searchNotice}</p>
          <Link href="/app" className={secondary+" mt-7"}>{t.germanCheckout}<ArrowRight className="size-4"/></Link>
        </div>}
      </section>
      <EuropeanFooter locale={locale} />
    </main>
  );
}
