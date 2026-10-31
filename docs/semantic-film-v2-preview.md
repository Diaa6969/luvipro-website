# LUVIPRO cinematic website – no repeated people footage (preview revision 2026-10-31)

**PREVIEW ONLY.** Production `main` is unchanged. No Supabase, checkout, legal, mobile app, data or prices changed.

## Corrected after visual feedback

- Removed films with **real mechanics or other people**, including hands in workshops; removed recordings of invoices, paperwork, smartphone/tablet screens and embedded text.
- Reduced nine visible films to exactly nine **distinct** close-ups of car objects. A given film source is used at most once on each localized landing page. Other cards use handcrafted CSS UV light animation—**not a repeated video**.
- Entire card is the video background behind the heading/price/button; no small video boxes. CSS contains a dark scrim for contrast.
- Increased underlying atmospheric video visibility substantially from approximately 1–2% effective to roughly 25–35%, by increasing video opacity/brightness and reducing section masks. The video stays muted and doesn't prevent reading.
- Original illustrated "demo" vehicles and random street-traffic videos are no longer used.
- Animation performance: IntersectionObserver pause offscreen, reduced-motion and save-data disable playback, fallback on errors. Nine unique media sources is still bandwidth heavy; production should use self-hosted transcoded files, static posters and cap concurrent playback.
- Scenes describe automotive *objects*, not an actual LUVIPRO 365 nm inspection; effects are purely aesthetic.
- The website is built as the original Next.js repository's **draft PR #17** and Vercel Preview; do not publish to the main domain until user approves and independent legal/media QA is completed.

## MP4 source register

Pexels video license allows general commercial website use with no attribution: https://www.pexels.com/legal-pages/license/ . However, a stock footage license **does not guarantee that visible third-party trademarks, model-specific body parts, text, number plates, identifiable people or locations are cleared**. Therefore this is a rights-*reduced-risk preview*, NOT a promise of 100% rights-cleared custom original video. Final production assets should ideally be filmed by LUVIPRO or AI-generated using a licensed video generation model with commercial usage rights, visually checked for identifiable brands, people and written text.

| Scene | Pexels clip ID | Topic (no intentionally filmed people or printed screen) |
| --- | --- | --- |
| Global background | 11901729 | Headlight surface with sunset reflections |
| Hero background | 4707143 | Vehicle headlight coming on |
| Standard card | 6159202 | Close-up of vehicle paint |
| Premium card | 8104040 | Moving car wheel close-up |
| Surface check | 6157786 | Vehicle body paint details |
| Eco: paint | 6159204 | Car exterior reflection |
| Eco: headlight | 5309342 | Headlight reflecting ambient light |
| UV / surface feature | 6157864 | Finished paintwork surface |
| Buyer journey | 5419070 | Headlamp and evening reflection |

All direct MP4 URLs are in `src/lib/semantic-film-clips.ts`. A CI smoke test checks that each is online, has a valid MP4 header and is unique; it cannot establish the absence of faces, trademarks, watermarks or written overlays. Visual review using extracted frames is required before approval. Some stock clips may contain visible brand marks even when not described; **any suspicious footage must be removed or replaced**, not hidden and assumed safe.

## Legal and technical launch gate

1. Inspect at least two separate frames of each source for persons, logos, license plates, source-imposed text and any watermark. Inspect all nine videos at full length for edge cases; compare versions rendered on mobile and desktop.
2. Record licence URL, author, source ID, date and archival screenshot for each selected clip. Do not imply any brand/producer endorsed LUVIPRO.
3. Prefer replacing these stock videos with wholly bespoke, separately licensed, brand-free videos and self-hosting for production; Pexels CDN currently sees visitor requests/IP.
4. Get explicit user visual approval on the preview before merging or production Vercel deployment.

No one should call this production-safe or "100% copyright-free" merely because the Pexels licence permits commercial reuse.
