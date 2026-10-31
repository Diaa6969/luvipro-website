# LUVIPRO authentic automotive video preview – licensing and deployment

The previous custom SVG illustration was rejected in the review. This **preview-only** branch replaces the visible hero artwork and the Standard/Premium and customer-benefit cards with actual video recordings of vehicles. There is **no production merge**.

## Royalty-free source videos – commercial usage reviewed 2026-10-31

All footage is genuine stock automotive camera footage from Mixkit under **Mixkit Stock Video Free License**, not a 3D illustration and not the Mixkit *Restricted (personal use only)* license. Each of these specific video pages explicitly states commercial use:

1. Garage hero (studio): https://mixkit.co/free-stock-video/parked-red-sports-car-66/ — garage pan of red parked sports car.
2. Standard + surface close-up (detail): https://mixkit.co/free-stock-video/closeup-of-red-sports-car-49/ — camera pan of vehicle exterior details.
3. Premium + automotive components (engine): https://mixkit.co/free-stock-video/closeup-of-sports-car-engine-65/ — real close-up of a motor.
4. Background supporting cards (night): https://mixkit.co/free-stock-video/rear-view-of-a-car-through-the-city-42033/ — rear view of car driving on streets after dark.

All MP4 files are requested from the Mixkit assets host only if their component scrolls into the viewport. They are muted, looped, inline and disabled with `prefers-reduced-motion`; static UV-toned fallbacks show if files fail. The clips are tinted/graded for LUVIPRO and **are not footage of a LUVIPRO device or real UV inspections**. UI text must not imply that the depicted car was actually inspected.

### Operational tradeoff

The video CDN is externally hosted; this avoids uploading binary assets through the text-only GitHub connector, but introduces a third-party dependency and direct requests to the assets CDN. Before full production deployment, self-host compressed verified MP4/WebM assets on a suitable video/CDN host (with retained licensing records), test video actual playback on Safari / Android, consider GDPR/privacy disclosures about media host and implement static posters. Do not represent an MP4 URL format as guaranteed until remote checks and browser playback succeed.

Avoid Mixkit video pages that say **Restricted License / Personal Use only** (for example 47829, 47831 or 17134); those have not been used. Verify each asset's official license record on the linked item page.

Performance guidelines: lazy only on viewport, one rendition per asset, no audio, no 4K video, no animated SVG car, and do not autoplay for users requesting reduced motion.
