import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const hero = read("src/components/sections/hero.tsx");
const verify = read("src/app/verify/page.tsx");
const nav = read("src/components/sections/navbar.tsx");
const footer = read("src/components/sections/footer.tsx");
const final = read("src/components/sections/final-cta.tsx");
const finder = read("src/components/sections/workshop-finder.tsx");
const report = read("src/components/reports/report-lookup.tsx");

for (const [path,src] of Object.entries({
  "home hero":hero,
  "mobile nav":nav,
  "footer":footer,
  "final CTA":final,
})) {
  assert.match(src,/Fahrzeug checken lassen/,path+" is missing exact customer-facing label");
  assert.match(src,/\/verify#partner-map/,path+" does not lead directly to workshop search");
  assert.doesNotMatch(src,/Fahrzeug verifizieren/,path+" retains old wording");
}
assert.match(verify,/<h1[^>]*>[\s\S]*?Fahrzeug checken lassen[\s\S]*?<\/h1>/);
const workshopPosition=verify.indexOf('<section id="partner-map"');
const stagesPosition=verify.indexOf('So läuft der LUVIPRO Fahrzeugcheck');
const reportPosition=verify.indexOf('<section id="report-lookup"');
assert.ok(workshopPosition > 0 && workshopPosition < stagesPosition && stagesPosition < reportPosition,
  "Partner workshop search must appear first; report lookup is a separate later task.");
assert.match(verify,/id="partner-map" className="scroll-mt-24/);
assert.match(verify,/<WorkshopFinder locale="de"\s*\/>/);
assert.match(verify,/href="#partner-map"/);
assert.match(verify,/href="#report-lookup"/);
assert.match(finder,/placeholder: "PLZ oder Ort, z\. B\. Hannover"/);
assert.match(finder,/type="search"/);
assert.match(finder,/role="search"/);
assert.match(finder,/verifiedWorkshops: Workshop\[\] = \[\]/);
assert.doesNotMatch(report,/get_public_inspection_preview/);
console.log("Vehicle check navigation, visible workshop-first form, direct anchors, separate secure report lookup: PASS");
console.log("Reminder: workshop list is empty until real confirmed partner data is published; no fake locations are shown.");
