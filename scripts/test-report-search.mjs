import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=readFileSync("src/lib/reports/reference.ts","utf8");
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
{module,exports:module.exports},{timeout:1000});
const {normalizeReportReference,validReportReference}=module.exports;
const vin="WBA12345678901234";
assert.equal(validReportReference("vin",vin),true);
assert.equal(normalizeReportReference(" wba12345678901234 "),vin);
assert.equal(validReportReference("vin","WBI12345678901234"),false);
assert.equal(validReportReference("vin",vin.slice(0,16)),false);
assert.equal(validReportReference("report","8DFA7B5E-8F1B-41E5-A829-2A3C133B8E8D"),true);
assert.equal(validReportReference("report","LUV-2026-0000001"),true);
assert.equal(validReportReference("report","123"),false);
assert.equal(validReportReference("report","../../private"),false);

const pages=[
"src/components/sections/app-coming-soon.tsx",
"src/lib/legal-content.ts",
"src/components/sections/hero.tsx",
"src/components/sections/ecosystem.tsx",
"src/components/sections/how-it-works.tsx",
"src/components/sections/security-trust.tsx",
"src/components/sections/footer.tsx",
"src/components/sections/navbar.tsx",
"src/app/reports/page.tsx",
"src/app/verify/page.tsx",
"src/components/reports/report-lookup.tsx",
"src/components/international/international-home.tsx",
"src/lib/international-home-copy.ts",
];
for(const path of pages) {
  const htmlSource=readFileSync(path,"utf8");
  assert.doesNotMatch(htmlSource,/\bQR\b|QR[-_]/i,`QR reference persists in ${path}`);
}
const legacy=readFileSync("src/app/r/[token]/page.tsx","utf8");
assert.match(legacy,/redirect\("\/reports"\)/);
assert.doesNotMatch(legacy,/get_public_inspection_preview|public_token/);
const refPage=readFileSync("src/components/reports/report-lookup.tsx","utf8");
assert.doesNotMatch(refPage,/public_token|storage\/v1|pdf_base64|report_url/);
assert.match(refPage,/keine vertraulichen Berichte ohne Anmeldung/);
assert.match(refPage,/Neue Berichtskäufe sind in V1 deaktiviert/);
assert.doesNotMatch(refPage,/falls erforderlich, nach dem Kauf/);
console.log("Report lookup identifiers, no public QR flow, privacy-gated download UX: PASS (synthetic)");
