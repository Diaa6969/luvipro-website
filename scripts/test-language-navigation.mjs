import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const de = read("src/components/sections/navbar.tsx");
const international = read("src/components/international/international-navbar.tsx");
const europe = read("src/components/international/european-home.tsx");
const picker = read("src/components/ui/language-picker.tsx");
const css = read("src/app/globals.css");
const catalog = read("src/lib/site-locales.ts");

for (const [name, page] of [
  ["German homepage navbar", de],
  ["English/Arabic homepage navbar", international],
]) {
  assert.match(page, /luvipro-fixed-header/,"Fixed opaque header missing: " + name);
  assert.match(page, /bg-\[#050d1c\]/,"Solid color missing: " + name);
  assert.match(page, /<LanguagePicker current=/,"Language selection missing: " + name);
  assert.doesNotMatch(page, /hidden lg:block[^>]*><LanguagePicker/,
    "Language picker must be visible on mobile: " + name);
  assert.doesNotMatch(page, /bg-obsidian\/72|bg-\[#020617\]\/95/,"Transparent header/menu: "+name);
  assert.match(page, /xl:hidden/,"Menu unavailable at tablet widths: " + name);
}
assert.match(europe, /<LanguagePicker current=/);
assert.match(europe, /bg-\[#060c1b\]/);
assert.doesNotMatch(europe, /bg-\[#060c1b\]\/90/);

assert.match(picker, /createPortal\(/,"Picker must escape clipping ancestors");
assert.match(picker, /document\.body/);
assert.match(picker, /aria-haspopup="dialog"/);
assert.match(picker, /aria-modal="true"/);
assert.match(picker, /siteLocales\.filter/,"31 searchable options expected");
assert.match(picker, /fixed inset-0/);
assert.match(picker, /bg-\[#030815\]/,"Menu overlay must be solid");
assert.match(picker, /bg-\[#0b1428\]/,"Menu content must be opaque");
assert.doesNotMatch(picker, /bg-[^ "]+\/(?:[0-9]+)/,"No translucent menu panel backgrounds");
assert.match(picker, /sm:hidden/,"Compact mobile language code must be present");
assert.match(picker, /max-h-/,"Long language list should scroll");

assert.match(css, /\.cinematic-page > \.luvipro-fixed-header\s*\{\s*position: fixed/);
assert.match(css, /background-color: #050d1c/);
assert.match(catalog, /\["tr", "Türkçe"/);
assert.match(catalog, /\["ru", "Русский"/);
assert.match(catalog, /\["nl", "Nederlands"/);
console.log("Navigation: visible language picker on all 3 homepage types, opaque dropdown and fixed header: PASS");
