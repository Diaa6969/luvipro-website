import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const manifest=read("src/lib/semantic-film-clips.ts");
const film=read("src/components/ui/semantic-film.tsx");
const generated=read("src/components/ui/generated-clip.tsx");
const css=read("src/app/globals.css");
const cards={
 hero:read("src/components/sections/hero.tsx"),
 problem:read("src/components/sections/problem.tsx"),
 ecosystem:read("src/components/sections/ecosystem.tsx"),
 pricing:read("src/components/sections/pricing.tsx"),
 how:read("src/components/sections/how-it-works.tsx"),
 trust:read("src/components/sections/security-trust.tsx"),
 ocr:read("src/components/sections/ocr-verification.tsx"),
 uv:read("src/components/sections/uv-scanner.tsx"),
};
const scenes=[...manifest.matchAll(/^  (\w+): \{ kind: "(stock|generated)"/gm)];
assert.equal(scenes.length,25,"Exactly 25 unique scenic videos");
assert.equal(new Set(scenes.map(x=>x[1])).size,25);
assert.equal(scenes.filter(x=>x[2]==="stock").length,17);
assert.equal(scenes.filter(x=>x[2]==="generated").length,8);
const ids=[...manifest.matchAll(/videos\.pexels\.com\/video-files\/(\d+)\//g)].map(x=>x[1]);
assert.equal(ids.length,17);
assert.equal(new Set(ids).size,17);
for(const unwanted of ["11901729","4707143","8470382","6870334","6870341","20693173","6637310","6159183","4822920","6159285"])
  assert.ok(!ids.includes(unwanted),"Unwanted logo/indicator/person footage remains: "+unwanted);
assert.match(manifest,/  ambient: \{ kind: "stock", src: "https:\/\/videos\.pexels\.com\/video-files\/8033487\//);
assert.match(manifest,/  hero: \{ kind: "stock", src: "https:\/\/videos\.pexels\.com\/video-files\/6159204\//);
assert.match(film,/clip\?\.kind === "stock"/);
assert.match(film,/clip\?\.kind === "generated"/);
assert.match(film,/GeneratedClip theme=\{clip\.theme\}/);
assert.match(film,/prefers-reduced-motion: reduce/);
assert.match(film,/IntersectionObserver/);
assert.match(film,/saveData/);
assert.match(generated,/captureStream\(12\)/);
assert.match(generated,/requestAnimationFrame/);
assert.match(generated,/<video ref=\{node\}/);
assert.match(css,/\.semantic-film-ambient \.semantic-film-video \{\s*opacity: \.87/);
assert.doesNotMatch(css,/\.cinematic-grid \{/);
assert.match(cards.hero,/\["statUV","statVIN","statPDF"\]/);
assert.match(cards.problem,/\["problemPaint","problemDocs","problemChain"\]/);
assert.match(cards.ecosystem,/\["ecoPaint","ecoVIN","ecoInspection","ecoPDF","ecoPartner","ecoTrust"\]/);
assert.match(cards.pricing,/priceStandard" : "pricePremium"/);
assert.match(cards.how,/\["howBuyer","howSeller","howWorkshop"\]/);
assert.match(cards.trust,/\["trustPrivacy","trustIntegrity","trustPartner"\]/);
assert.match(cards.ocr,/\["ocrVIN","ocrAccess"\]/);
assert.match(cards.uv,/scene="uvSection" mode="section"/);
for(const [name,txt] of Object.entries(cards))
 assert.ok(!txt.includes("<SemanticFilm />"),"Card without video in "+name);
const enar=read("src/components/international/international-home.tsx");
const eu=read("src/components/international/european-home.tsx");
for(const t of [enar,eu])assert.ok(!t.includes("<SemanticFilm />"),"Unfilled translated card");
assert.match(enar,/\["statUV","statVIN","statPDF"\]/);
assert.match(enar,/\["problemPaint","problemDocs","problemChain"\]/);
assert.match(enar,/\["ecoPaint","ecoVIN","ecoInspection","ecoPDF","ecoPartner","ecoTrust"\]/);
assert.match(enar,/\["howBuyer","howSeller","howWorkshop"\]/);
assert.match(enar,/\["trustPrivacy","trustIntegrity","trustPartner"\]/);
assert.match(eu,/\["ecoPaint","ecoVIN","ecoPDF"\]/);
assert.match(eu,/scene="ocrAccess"/);
assert.match(read("src/app/products/page.tsx"),/audience="partner"/);
console.log("PASS: 25 unique video scenes, real car videos without Audi/indicator, original generated legal-safe digital videos, no empty cards.");
