import type { SiteLocale } from '@/lib/site-locales';

/**
 * The user's selected website language determines the example in Suchwunsch.
 * Every officially supported locale has one natural, single-language example.
 * German is the default if the user has not chosen a language.
 */
export const MARKETPLACE_SEARCH_HINTS: Record<SiteLocale,string> = {
  "de": "z. B. BMW Diesel Automatik bis 20.000 € in Hannover",
  "en": "e.g. BMW diesel automatic under €20,000 near Hanover",
  "ar": "مثلاً: أبحث عن BMW ديزل أوتوماتيك بسعر أقل من ٢٠٬٠٠٠ يورو في هانوفر",
  "fr": "Ex. : BMW diesel automatique à moins de 20 000 € à Hanovre",
  "es": "Ej.: BMW diésel automático por menos de 20.000 € en Hannover",
  "it": "Es.: BMW diesel automatica sotto 20.000 € ad Hannover",
  "nl": "Bijv. BMW diesel automaat tot € 20.000 in Hannover",
  "tr": "Örn. Hannover'da 20.000 € altında otomatik dizel BMW",
  "ru": "Например: BMW дизель автомат до 20 000 € в Ганновере",
  "pl": "Np. BMW diesel automat do 20 000 € w Hanowerze",
  "uk": "Наприклад: BMW дизель автомат до 20 000 € у Ганновері",
  "pt": "Ex.: BMW diesel automático até 20 000 € em Hanôver",
  "ro": "Ex.: BMW diesel automată sub 20.000 € în Hanovra",
  "el": "π.χ. BMW ντίζελ αυτόματο έως 20.000 € στο Ανόβερο",
  "cs": "Např. BMW diesel automat do 20 000 € v Hannoveru",
  "hu": "Pl. BMW dízel automata 20 000 € alatt Hannoverben",
  "sv": "T.ex. BMW diesel automat under 20 000 € i Hannover",
  "da": "F.eks. BMW diesel automatgear under 20.000 € i Hannover",
  "nb": "F.eks. BMW diesel automat under 20 000 € i Hannover",
  "fi": "Esim. BMW diesel automaatti alle 20 000 € Hannoverissa",
  "sk": "Napr. BMW diesel automat do 20 000 € v Hannoveri",
  "bg": "Напр. BMW дизел автоматик до 20 000 € в Хановер",
  "hr": "Npr. BMW dizel automatik do 20.000 € u Hannoveru",
  "sr": "Нпр. BMW дизел аутоматик до 20.000 € у Хановеру",
  "sl": "Npr. BMW dizel avtomatik do 20.000 € v Hannovru",
  "lt": "Pvz., BMW dyzelis automatinė iki 20 000 € Hanoveryje",
  "lv": "Piem., BMW dīzelis automāts līdz 20 000 € Hannoverē",
  "et": "Nt BMW diisel automaat kuni 20 000 € Hannoveris",
  "sq": "P.sh. BMW naftë automatik deri në 20 000 € në Hanover",
  "bs": "Npr. BMW dizel automatik do 20.000 € u Hannoveru",
  "mk": "На пр. BMW дизел автоматик до 20.000 € во Хановер"
};

export function marketplaceSearchHint(locale: SiteLocale): string {
  return MARKETPLACE_SEARCH_HINTS[locale] ?? MARKETPLACE_SEARCH_HINTS.de;
}
