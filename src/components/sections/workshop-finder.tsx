"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Search, Store, Wrench } from "lucide-react";

type Workshop = {
  id: string;
  name: string;
  city: string;
  postalCode: string;
  address: string;
  verified: true;
};

// Only publish real, confirmed LUVIPRO partner workshops here or from a verified
// access-controlled backend. Never display sample markers as real businesses.
const verifiedWorkshops: Workshop[] = [];

export type WorkshopLanguage = "de" | "en" | "ar";

const copy = {
  de: {
    eyebrow: "Werkstattsuche",
    title: "LUVIPRO Partnerwerkstatt finden",
    body: "Suchen Sie nach einer Werkstatt in Ihrer Region, um die Verfügbarkeit einer Fahrzeugprüfung zu prüfen.",
    placeholder: "PLZ oder Ort, z. B. Hannover",
    button: "Werkstatt suchen",
    all: "Alle Standorte",
    none: "Für diese Suche ist derzeit keine bestätigte LUVIPRO Partnerwerkstatt veröffentlicht.",
    empty: "Aktuell sind keine bestätigten Partnerstandorte veröffentlicht. Gerne prüfen wir eine Anfrage für Ihre Region.",
    contact: "Verfügbarkeit direkt anfragen",
    label: "Standorte",
    note: "Nur bestätigte LUVIPRO Partnerwerkstätten werden als Treffer angezeigt.",
  },
  en: {
    eyebrow: "Find a workshop",
    title: "Find a LUVIPRO partner workshop",
    body: "Search your area to check the availability of a vehicle inspection with a LUVIPRO partner workshop.",
    placeholder: "Postal code or city, e.g. Hannover",
    button: "Search workshops",
    all: "All locations",
    none: "No confirmed LUVIPRO partner workshop is currently listed for this search.",
    empty: "No confirmed partner locations are published yet. Contact us about inspections in your area.",
    contact: "Ask about availability",
    label: "Locations",
    note: "Only confirmed LUVIPRO partner workshops are shown as results.",
  },
  ar: {
    eyebrow: "البحث عن ورشة",
    title: "ابحث عن ورشة شريكة مع LUVIPRO",
    body: "ابحث عن ورشة في منطقتك لمعرفة إمكانية الحصول على خدمة فحص السيارة.",
    placeholder: "الرمز البريدي أو المدينة، مثل Hannover",
    button: "البحث عن ورشة",
    all: "جميع المواقع",
    none: "لا توجد ورشة شريكة مؤكدة ومعلنة في نتائج هذا البحث حاليًا.",
    empty: "لا توجد مواقع مؤكدة لشركائنا منشورة حاليًا. تواصل معنا للاستفسار عن الفحص في منطقتك.",
    contact: "استفسر عن التوفر",
    label: "المواقع",
    note: "تظهر فقط ورش LUVIPRO الشريكة المؤكدة.",
  },
} as const;

export function WorkshopFinder({ locale = "de" }: { locale?: WorkshopLanguage }) {
  const t = copy[locale];
  const [cityInput, setCityInput] = useState("");
  const [search, setSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const results = verifiedWorkshops.filter((item) => {
    if (!search) return true;
    return [item.city, item.postalCode, item.address, item.name]
      .some(value => value.toLocaleLowerCase("de-DE").includes(search.toLocaleLowerCase("de-DE")));
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(cityInput.trim());
    setSearched(true);
  }

  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="min-w-0">
        <span className="text-sm font-semibold uppercase tracking-[0.17em] text-pulse">{t.eyebrow}</span>
        <h2 className="mt-4 max-w-lg font-[var(--font-space-grotesk)] text-3xl font-semibold leading-tight text-white sm:text-4xl">{t.title}</h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">{t.body}</p>
        <form className="mt-8" onSubmit={submit} role="search" aria-label={t.title}>
          <label htmlFor={`workshop-city-${locale}`} className="block text-sm font-semibold text-slate-200">{t.eyebrow}</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id={`workshop-city-${locale}`}
              type="search"
              name="region"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              maxLength={90}
              autoComplete="address-level2"
              placeholder={t.placeholder}
              className="min-h-12 w-full min-w-0 flex-1 rounded-xl border border-white/20 bg-[#080f20] px-4 text-base text-white outline-none placeholder:text-slate-400 focus:border-pulse focus:ring-2 focus:ring-pulse/20"
            />
            <button type="submit" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-pulse px-5 py-3 font-semibold text-obsidian transition hover:bg-frost focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse">
              <Search className="h-4 w-4" />{t.button}
            </button>
          </div>
        </form>
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.045] p-5" role="status" aria-live="polite">
          {results.length ? (
            <ul className="space-y-4">
              {results.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-white/10 pb-4">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-pulse" />
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-300">{item.address}, {item.postalCode} {item.city}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-start gap-3">
              <Wrench className="mt-1 h-5 w-5 shrink-0 text-pulse" />
              <p className="text-sm leading-7 text-slate-300">{searched ? t.none : t.empty}</p>
            </div>
          )}
        </div>
        <Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-pulse transition hover:text-white">
          {t.contact}<ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="glass-panel relative flex min-h-[390px] min-w-0 flex-col overflow-hidden rounded-2xl border border-pulse/15 p-6 sm:min-h-[470px] sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(32,214,255,0.15),transparent_42%),linear-gradient(rgba(217,247,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(217,247,255,0.06)_1px,transparent_1px)] bg-[size:100%_100%,45px_45px,45px_45px]" />
        <div className="relative flex items-center justify-between gap-4">
          <p className="font-[var(--font-space-grotesk)] text-xl font-semibold text-white">{t.label}</p>
          <MapPin className="h-6 w-6 shrink-0 text-pulse" />
        </div>
        <div className="relative flex flex-1 items-center justify-center">
          <div aria-hidden className="absolute h-48 w-48 rounded-full border border-pulse/10 shadow-[0_0_100px_rgba(32,214,255,0.12)] sm:h-64 sm:w-64" />
          <div aria-hidden className="absolute h-36 w-36 rounded-full border border-pulse/20 sm:h-48 sm:w-48" />
          <div className="relative mx-auto max-w-xs rounded-2xl border border-white/15 bg-[#091426]/90 px-6 py-7 text-center shadow-xl backdrop-blur">
            <Search className="mx-auto h-11 w-11 text-pulse" />
            <p className="mt-4 text-sm leading-7 text-slate-300">{searched ? t.none : t.empty}</p>
          </div>
        </div>
        <p className="relative border-t border-white/10 pt-4 text-xs leading-6 text-slate-400">{t.note}</p>
      </div>
    </div>
  );
}
