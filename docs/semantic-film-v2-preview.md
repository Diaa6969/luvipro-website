# LUVIPRO cinematic real-video backgrounds V2 — private preview

**Status: preview only. No merge into production main.**

## What changed after user visual feedback

The earlier draft preview used a cartoon-like SVG scan, then wrongly placed unrelated night-traffic MP4s as visible thumbnails on every card. This v2 design starts from the original `main` and does **not** use the previous preview branch.

Every film is a background layer of its entire semantic section or card. **All text, prices, CTAs and icons remain above the video** behind a dark violet scrim. The page backdrop is a real auto workshop film with low opacity plus moving soft violet/blue light; no square grid. Videos share equal fill dimensions through `object-fit:cover` and there are no arbitrary-height media thumbnails. The same structure applies to German, English, Arabic and European localized homepages.

## Subject-aware sourcing (genuine video recordings)

All assets are genuine, royalty-free Pexels stock video under the [Pexels License](https://www.pexels.com/license/). Each direct MP4 was checked by a range GET in GitHub Actions and returned **206 video/mp4 + a valid MP4 header** on 2026-10-31.

| Theme / place | Real film | Source |
| --- | --- | --- |
| Main hero / inspection steps / car examination | Mechanic inspecting the underbody with a light | https://www.pexels.com/video/mechanic-checking-under-the-car-8470382/ |
| Standard check / paint surfaces / paint-related benefits | Close-up of a black car's reflective paintwork | https://www.pexels.com/video/close-up-video-of-a-car-paint-6159202/ |
| Premium inspection / diagnostic cards | Mechanic using an OBD diagnostic tablet | https://www.pexels.com/video/mechanic-using-obd-scanner-tablet-6870334/ |
| Digital report / PDF / test documentation | Mechanic viewing tablet in auto repair shop | https://www.pexels.com/video/a-man-using-ipad-6870341/ |
| Global soft atmospheric background / workshop and partners | Genuine workshop and vehicle | https://www.pexels.com/video/a-man-is-standing-next-to-a-car-in-a-garage-20693173/ |
| VIN/FIN and document-related cards | Person reading vehicle documents inside car | https://www.pexels.com/video/a-man-reading-a-document-6637310/ |
| Surface condition feature / bodywork detail | Professional car detailing and car paintwork | https://www.pexels.com/video/close-up-video-of-a-car-6157904/ |

The context mapping is in `src/lib/semantic-film-clips.ts`. We **do not call stock footage AI-generated video** and we do not claim it is footage of LUVIPRO's 365 nm UV lamp. A genuine LUVIPRO UV scan will require filming the actual product, or use of a properly licensed generative-video service that is not currently connected.

## Browser behavior, privacy, and performance

- MP4 loads **only when near the viewport**, silent autoplay, inline loop, pauses offscreen.
- Reduced-motion users and data-saver devices get the static cinematic fallback, no automatic video.
- CSS uses violet grading and animated UV-toned lighting; **these lighting effects are stylistic, not scientific measurements**.
- Videos use a third-party CDN. Before launch, check GDPR/privacy handling, preserve source license documentation, and preferably self-host compressed clips with static posters. No cookies or direct app data are sent by the media component, but browsers request the CDN, revealing IP/user-agent to that host.
- Each film already has a dark fallback and error handling. Browser Safari/iOS + Android actual playback and contrast must be visually tested before production publishing.
- For a future generative pipeline: define seven precise semantic prompts, generate context-specific *realistic* footage, check rights, verify 365 nm claims, compress to WebM/MP4 and replace only the manifest sources, **not the layouts**.

## No production changes

- This branch has no Supabase, Auth, price calculation, checkout, Stripe, VIN, PDF, FlutterFlow or other data changes.
- Do not merge until the user has checked the preview visually and approves.
