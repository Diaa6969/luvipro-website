# LUVIPRO Cinematic Motion – Final Release Review (31 October 2026)

**Scope:** visual changes in the SAME original Next.js website `Diaa6969/luvipro-website`. No database, Supabase, FlutterFlow, pricing, invoices, auth, orders or report changes.

## Visual changes requested and implemented

- Replaced the old **Audi grille/logo** global background (Pexels 11901729) with clear footage of a blue car's unbranded side/mirror (Pexels 8033487).
- Replaced the irrelevant **blinking turn signal** hero film (Pexels 4707143) with a detailed, real paintwork and reflection close-up (Pexels 6159204). No 3D cartoon.
- Every foreground informational and offer card has its **own video behind text**: 3 hero statistic cards, 3 problem cards, 6 ecosystem cards, Standard and Premium price cards, 3 process cards, 3 trust cards, 2 FIN/report security cards and the UV feature card. The global background and hero also have their own distinct footage. **25 distinct sources/motifs in total.**
- Exactly **17 distinct licensed stock footage clips** of automotive exteriors/details and **8 originally generated procedural video streams** for VIN, PDF/report and privacy illustrations. Every scene key is assigned to just one position on a landing page. No reused MP4 source.
- Digital video effects are created by the user's browser with Canvas `captureStream(12)` (320×180, silent); they contain no existing brand, text, individual or third-party UI. These are original motion graphics, NOT AI photorealistic films or recordings of LUVIPRO inspections.
- Cards use full-background video with dark scrim for text legibility. Global car film is deliberately clearer than v2. Both real and generated videos stop outside the viewport or when reduced-motion/data saving is enabled.

## Pexels stock clips and licensing

Source file `src/lib/semantic-film-clips.ts` lists the direct MP4 and Pexels source page for all 17 stock clips. See [Pexels License](https://www.pexels.com/license/) for general commercial usage permission.

Even commercial stock licences do not necessarily clear independent trademarks, car-design rights, model marks or licence plates. Two or more frames of each selected clip were visually reviewed using FFmpeg contact sheets and the build rejects banned sources, but this is **not a guarantee** of absence of third-party markings in all frames. The original Audi grille and indicator MP4 IDs are banned by CI. If residual brand marks appear, replace/crop their source before marketing use. Self-host compressed clips later to reduce CDN leakage of IP/UA, after privacy/copyright review.

## Visual placement and maintenance

`src/components/ui/semantic-film.tsx` chooses an in-viewport licensed MP4 or locally generated stream according to the unique scene key. `src/components/ui/generated-clip.tsx` creates the 8 original abstract movies. `src/app/globals.css` controls full-card background, UV tint/contrast and visible site atmosphere. Every scene is declared in `src/lib/semantic-film-clips.ts` and each page references it consistently across DE, EN, AR and European locales.

Production deploy must be confirmed separately by **successful Vercel status on the merged `main` commit**, after green build and relevant tests. Record PR, SHA and rollback commit. No user data or business logic touched.

## Performance caveat

Seventeen genuine MP4s increase transfer on a full long-page scroll. Viewport-only loading and Save-Data/reduced-motion support reduce this cost. For production optimization, progressively encode verified short 480p/720p loops and self-host static poster/video derivatives, and test mobile Safari/Android performance. There are no new cookies or JS trackers in the animation implementation.
