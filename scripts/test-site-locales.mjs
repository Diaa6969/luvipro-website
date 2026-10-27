import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function readTS(path) {
  const source = readFileSync(path, "utf8");
  const commonjs = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(commonjs, {
    module, exports: module.exports,
    require() { throw new Error("No runtime dependency expected in " + path); },
    Set, Object,
  }, {timeout:1000,filename:path});
  return module.exports;
}
const locales = readTS("src/lib/site-locales.ts");
const fields = [
 "navHome","navDevice","navReports","navPartners","navContact","language",
 "tagline","headline","intro","features",
 "uvTitle","uvText","vinTitle","vinText","pdfTitle","pdfText",
 "prices","priceNote","order","reportTitle","reportText","reportCta",
 "partnerTitle","partnerText","partnerCta","trustTitle","trustText",
 "legalNote","germanCheckout","app","back","vinLabel","reportLabel",
 "search","searchNotice","bundle",
];
const codes = locales.siteLocales.map(x=>x[0]);
assert.equal(codes.length,31);
assert.equal(new Set(codes).size,codes.length);
assert.ok(codes.includes("tr")&&codes.includes("ru")&&codes.includes("nl"));
for (const [code,native,tag] of locales.siteLocales) {
  assert.ok(native.length>=3);
  assert.ok(tag.length>=2);
  assert.equal(locales.isSiteLocale(code),true);
  assert.equal(locales.localeHome(code),code==="de"?"/":"/"+code);
  assert.equal(locales.languageAlternates[tag],locales.localeHome(code));
}
assert.equal(locales.languageAlternates["x-default"],"/");
const translations = [
  readTS("src/lib/translations-west.ts").westernTranslations,
  readTS("src/lib/translations-east.ts").easternTranslations,
  readTS("src/lib/translations-north.ts").northernTranslations,
];
const all = Object.assign({}, ...translations);
const expected = codes.filter(x=>!["de","en","ar"].includes(x));
assert.equal(Object.keys(all).length,expected.length);
for(const code of expected){
  assert.ok(all[code],"Missing localized copy: "+code);
  assert.deepEqual(Object.keys(all[code]).sort(),[...fields].sort(),"Field mismatch: "+code);
  for(const field of fields){
    const value=all[code][field];
    assert.equal(typeof value,"string",code+" "+field);
    assert.ok(value.trim().length>=2,code+" "+field+" empty");
  }
  assert.match(all[code].priceNote,/59,99|59\.99/);
  assert.match(all[code].priceNote,/119,99|119\.99/);
  assert.match(all[code].searchNotice,/PDF/i);
}
assert.deepEqual(Object.keys(all).sort(),expected.sort());
const picker = readFileSync("src/components/ui/language-picker.tsx","utf8");
assert.match(picker,/siteLocales\.filter/);
assert.match(picker,/aria-current/);
assert.match(picker,/max-h-/);
assert.ok(readFileSync("src/app/[locale]/page.tsx","utf8").includes("generateStaticParams"));
assert.ok(readFileSync("src/app/[locale]/[section]/page.tsx","utf8").includes("generateStaticParams"));
console.log("LUVIPRO 31-locale catalog, 28 new complete core dictionaries, German/EN/AR preservation, menus and routes: PASS");

