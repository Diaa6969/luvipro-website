import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(file)=>readFileSync(file,"utf8");
const footage=read("src/components/ui/real-car-footage.tsx");
const hero=read("src/components/sections/hero.tsx");
const pricing=read("src/components/sections/pricing.tsx");
const ecosystem=read("src/components/sections/ecosystem.tsx");
const enar=read("src/components/international/international-home.tsx");
const eu=read("src/components/international/european-home.tsx");
const bg=read("src/components/ui/animated-atmosphere.tsx");
const css=read("src/app/globals.css");
const docs=read("docs/cinematic-real-footage.md");

assert.match(hero,/<RealCarFootage clip="studio" variant="hero"/);
assert.doesNotMatch(hero,/<UvCarScene|BMW 530d|bg-radial-grid/);
assert.match(pricing,/clip=\{plan\.id === "standard" \? "detail" : "engine"\}/);
assert.match(pricing,/variant="card"/);
assert.match(ecosystem,/\(\["detail", "night", "studio", "engine", "night", "detail"\] as const\)\[index\]/);
assert.match(enar,/<RealCarFootage clip="studio" variant="hero"/);
assert.match(enar,/variant="card"/);
assert.match(eu,/<RealCarFootage clip="studio" variant="hero"/);
assert.match(eu,/variant="card"/);
assert.doesNotMatch(enar,/<UvCarScene/);
assert.doesNotMatch(eu,/<UvCarScene/);
assert.match(footage,/IntersectionObserver/);
assert.match(footage,/preload="metadata"/);
assert.match(footage,/playsInline/);
assert.match(footage,/muted/);
assert.match(footage,/onError=\{\(\) => setFailed\(true\)\}/);
assert.match(footage,/prefers-reduced-motion: reduce/);
assert.match(css,/\.real-car-video/);
assert.match(css,/\.real-car-footage-card/);
assert.match(css,/@keyframes luvipro-live-footage-scan/);
assert.match(bg,/cinematic-aurora/);
assert.doesNotMatch(bg,/cinematic-grid/);
assert.match(docs,/Pexels License/);
assert.doesNotMatch(docs,/clips are AI generated/i);
assert.match(read("src/app/products/page.tsx"),/audience="partner"/);
for(const clip of ["studio","detail","night","engine"]) {
  assert.ok(footage.includes(clip+': "https://videos.pexels.com/video-files/'),"Missing real MP4 for "+clip);
}
for(const path of [
 "src/components/sections/problem.tsx",
 "src/components/sections/how-it-works.tsx",
 "src/components/sections/security-trust.tsx",
]) assert.match(read(path),/cinematic-card/);
console.log("Real-car footage, ALL inspection and benefit cards, international pages and reduced-motion: PASS");
