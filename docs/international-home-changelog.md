# LUVIPRO international homepage — change log

Date: 2026-10-20
Source production branch: `main`, baseline commit `d999bbb61f1f4f9658c6b2d1ff0ace95b7f82bec`
Development branch: `feature/international-home-en-ar`
Production publishing: **NOT PERFORMED**

## Purpose

Provide full English and Arabic versions of the **homepage only** at `/en` and `/ar`. The German root homepage `/` and existing app/legal/payment routes remain operational; no backend integrations added. All work is on a separate Git branch.

## Changes

- `src/lib/international-home-copy.ts`: structured English/Arabic copy covering all homepage sections, CTA text, navigation, mobile menu and footer.
- `src/components/international/international-home.tsx`: corresponding translated sections, sharing existing visual components, colors and animation wrappers.
- `src/components/international/international-navbar.tsx`: localized navigation, portal-based mobile overlay, language links, client-side document language/direction handling.
- `src/app/en/page.tsx`, `src/app/ar/page.tsx`: localized homepage routes, titles, descriptions, canonical URLs, reciprocal hreflang.
- `src/components/ui/brand-logo.tsx`: optional `homeHref` prop; default `/` remains **unchanged** for all existing usages.
- `src/components/sections/navbar.tsx`: small language switcher on existing German desktop/mobile menus. Original German navigation/menu behavior preserved.
- `src/app/page.tsx`: reciprocal hreflang metadata on German root homepage; German visible content and section structure unchanged.
- `public/sitemap.xml`: new homepage URLs included.

## Product accuracy

Only international copy was modernized to reflect the planned one-device `LU3656060` launch and VIN-based report access; no QR stickers, AI, or active marketplace claims in the new translations. **Existing German text still contains earlier QR/AI/marketplace wording and needs separate business approval before editing.**

## Known limitations

- The non-homepage routes (e.g. `/products`, `/verify`, `/contact`, legal pages) are **still German**. Language-specific menus currently link there; translating those pages belongs to the next stage.
- In Next.js App Router the shared root `<html>` is initially rendered with `lang="de-DE"`. International pages have server-rendered localized text and a `<main lang="en|ar" dir="ltr|rtl">` wrapper; a client effect also updates `document.documentElement.lang` and `dir`. To have the proper `<html lang>` already in **server HTML**, a carefully tested layout refactor is still necessary before the final SEO launch.
- No live services, report search, payments, or marketplace were added.
- No automated build or browser test has been executed by the assistant. Verify on the user's computer before publishing.

## Verification to run locally

```cmd
cd /d C:\Users\diaaa\OneDrive\Desktop\luvipro
git fetch origin
git switch --track origin/feature/international-home-en-ar
npm run build
npm run dev
```

Test `http://localhost:3000/`, `http://localhost:3000/en` and `http://localhost:3000/ar`, especially language links, desktop/mobile navigation, Arabic text and RTL, existing routes, and mobile scroll-lock/close behavior.

After a successful build and user visual approval, merge changes separately. **Do not push/merge to `main` or change Vercel Production without explicit approval.**

## Rollback

Since all changes are isolated in a feature branch, simply switch back to `main` and do not merge the feature branch. The production branch stays at its previous state unless separately approved.
