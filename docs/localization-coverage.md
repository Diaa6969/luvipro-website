# LUVIPRO European localization (27 October 2026)

This feature **continues the existing Next.js 15 repository** and does not change
the original Android/iOS Flutter app, live Supabase schema/data, production
payments, company accounting or the existing report access controls.

## Supported website languages (31)

German (canonical), English, Arabic, French, Spanish, Italian, Dutch, Turkish,
Russian, Polish, Ukrainian, Portuguese, Romanian, Greek, Czech, Hungarian,
Swedish, Danish, Norwegian Bokmål, Finnish, Slovak, Bulgarian, Croatian,
Serbian, Slovenian, Lithuanian, Latvian, Estonian, Albanian, Bosnian,
Macedonian.

The language picker displays native language names and filters them using
the search input. It is available on mobile and desktop for the original German,
English and Arabic pages, and the new locale pages.

## What is actually translated (and what is not)

- The existing complete German site and the existing detailed English/Arabic
  landing pages are preserved.
- All 28 newly introduced languages have **original translated text (not
  auto-translated at runtime)** for the main product/UV/VIN/report/service
  descriptions, prices, pricing notes, navigation, contact, partner workshops,
  safety notice, user instructions, and CTAs.
- Localized routes: `/{locale}`, `/{locale}/products`,
  `/{locale}/reports`, `/{locale}/workshops`, `/{locale}/contact`,
  `/{locale}/app`. Localized pages use the existing LUVIPRO visual theme,
  but some are deliberately **shorter informational layouts** than the original
  full German marketing pages. Do not claim the full German page content was
  translated word for word.
- EN/AR original detailed landing pages route deeper links to their localized
  summaries rather than a German page.
- Prices retain their source meaning: device EUR 3,000.00 **net** excl.
  German shipping EUR 29.99 net and VAT where applicable; vehicle checks
  Standard EUR 59.99 and Premium EUR 119.99 **gross incl. German 19% VAT**.
- No public paid report data or PDF is exposed: the VIN or report number is
  only a search reference. Actual protected private PDF download remains
  dependent on authenticated user, authorization/payment and hardened Storage.
- **German-only remains**: binding legal/AGB/privacy pages, full B2B checkout
  and payment forms, some regional workshop-search UI, and the unfinished
  protected paid-report webapp. The translated interfaces explicitly say
  checkout/legal terms remain German. Do not represent these as fully
  translated/compliant in every language.
- No external translation API is called, so language selection never sends
  personal customer or vehicle data to a third-party translation provider.
- German root routes stay canonical. Alternate language home URLs advertise
  hreflang; subpages use localized canonical and hreflang metadata; public
  sitemap enumerates supported localized pages.

## Test plan

`npm ci && npm run test:locales && npm run test:reports && npm run build`.

For live visual smoke tests after merge and Vercel deployment, check at least:
`/tr`, `/ru`, `/nl`, `/fr`, `/pl`, `/uk`, `/ar`, `/en`,
`/fr/products`, `/tr/reports`, `/nl/workshops`. Check mobile language
search/dropdown, selected language label, links, number/letter validation and
RTL in Arabic, plus original `/`, `/products`, `/order`, `/reports`.

Professional native-speaker proofing is still recommended, especially for
legal wording and the smaller languages. No sales checkout or production
payment functionality is enabled by these translations.

## Rollback

This change was developed in `feature/european-locales`. The original
`main` commit serves as the baseline until a reviewed merge; revert the
merge if the locale rollout causes regressions. Data-bearing systems remain
untouched.
