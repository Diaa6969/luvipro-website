import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(path)=>readFileSync(path,"utf8");
const background=read("src/components/ui/animated-atmosphere.tsx");
const hero=read("src/components/sections/hero.tsx");
const sv=read("src/components/ui/uv-car-scene.tsx");
const css=read("src/app/globals.css");
const enar=read("src/components/international/international-home.tsx");
const eu=read("src/components/international/european-home.tsx");
const site=read("src/app/page.tsx");
const pricing=read("src/components/sections/pricing.tsx");
assert.match(site,/<AnimatedAtmosphere \/>/);
assert.doesNotMatch(background,/cinematic-grid/);
assert.match(background,/cinematic-aurora/);
assert.match(background,/cinematic-light-ribbon/);
assert.match(background,/aria-hidden="true"/);
assert.match(hero,/<UvCarScene \/>/);
assert.match(hero,/Illustrative UV-Animation/);
assert.doesNotMatch(hero,/BMW 530d|bg-radial-grid|bg-\[linear-gradient\(rgba\(217,247,255,0\.045\)/);
assert.match(sv,/viewBox="0 0 680 320"/);
assert.match(sv,/aria-label=\{label\}/);
assert.match(sv,/uv-car-sweep-rect/);
assert.doesNotMatch(sv,/fetch\(|setInterval|requestAnimationFrame|canvas|three\.js/i);
assert.match(css,/@keyframes luvipro-car-scan/);
assert.match(css,/@keyframes luvipro-card-sheen/);
assert.match(css,/prefers-reduced-motion: reduce/);
assert.match(css,/\.uv-car-sweep-rect \{ transform: translateX\(420px\)/);
assert.match(css,/hover: hover/);
assert.doesNotMatch(css,/\.cinematic-grid\s*\{/);
assert.match(pricing,/glass-panel cinematic-card/);
assert.match(enar,/<UvCarScene label=\{/);
assert.doesNotMatch(enar,/bg-radial-grid/);
assert.match(eu,/<UvCarScene compact/);
assert.match(eu,/<AnimatedAtmosphere \/>/);
assert.match(eu,/cinematic-card rounded-2xl/);
for(const path of [
 "src/components/sections/problem.tsx",
 "src/components/sections/ecosystem.tsx",
 "src/components/sections/how-it-works.tsx",
 "src/components/sections/security-trust.tsx"
]) assert.match(read(path),/cinematic-card/,path+" has no animated card");
assert.match(hero,/href="\/verify#partner-map"/);
assert.match(pricing,/Fahrzeugcheck wählen: Standard oder Premium/);
assert.match(read("src/app/products/page.tsx"),/audience="partner"/);
console.log("LUVIPRO cinematic SVG + reduced-motion + animated cards + no homepage grid: PASS");
