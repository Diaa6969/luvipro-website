/** Public locale catalog. German is the canonical legal/checkout source. */
export const siteLocales = [
  ["de", "Deutsch", "de-DE"],
  ["en", "English", "en-GB"],
  ["ar", "العربية", "ar"],
  ["fr", "Français", "fr-FR"],
  ["es", "Español", "es-ES"],
  ["it", "Italiano", "it-IT"],
  ["nl", "Nederlands", "nl-NL"],
  ["tr", "Türkçe", "tr-TR"],
  ["ru", "Русский", "ru-RU"],
  ["pl", "Polski", "pl-PL"],
  ["uk", "Українська", "uk-UA"],
  ["pt", "Português", "pt-PT"],
  ["ro", "Română", "ro-RO"],
  ["el", "Ελληνικά", "el-GR"],
  ["cs", "Čeština", "cs-CZ"],
  ["hu", "Magyar", "hu-HU"],
  ["sv", "Svenska", "sv-SE"],
  ["da", "Dansk", "da-DK"],
  ["nb", "Norsk bokmål", "nb-NO"],
  ["fi", "Suomi", "fi-FI"],
  ["sk", "Slovenčina", "sk-SK"],
  ["bg", "Български", "bg-BG"],
  ["hr", "Hrvatski", "hr-HR"],
  ["sr", "Српски", "sr-RS"],
  ["sl", "Slovenščina", "sl-SI"],
  ["lt", "Lietuvių", "lt-LT"],
  ["lv", "Latviešu", "lv-LV"],
  ["et", "Eesti", "et-EE"],
  ["sq", "Shqip", "sq-AL"],
  ["bs", "Bosanski", "bs-BA"],
  ["mk", "Македонски", "mk-MK"],
] as const;
export type SiteLocale = (typeof siteLocales)[number][0];
const codes = new Set<string>(siteLocales.map(entry => entry[0]));
export function isSiteLocale(value: string): value is SiteLocale { return codes.has(value); }
export function localeHome(locale: SiteLocale) { return locale === "de" ? "/" : `/${locale}`; }
export function localeHref(locale: SiteLocale, section: "products" | "reports" | "workshops" | "contact" | "app") {
  return locale === "de" ? (section === "workshops" ? "/partner-workshops" : "/" + section) : `/${locale}/${section}`;
}
export const languageAlternates = Object.fromEntries([
  ...siteLocales.map(([locale, , tag]) => [tag, localeHome(locale)]),
  ["x-default", "/"],
]);
export function languageMeta(locale: SiteLocale) {
  return siteLocales.find(row => row[0] === locale)!;
}
