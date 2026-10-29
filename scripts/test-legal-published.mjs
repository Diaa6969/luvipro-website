import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/legal-content.ts", "utf8");
const legalPages = ["src/app/impressum/page.tsx", "src/app/datenschutz/page.tsx", "src/app/agb/page.tsx"];
assert.match(source,/export const datenschutzIntro/);
assert.match(source,/export const agbIntro/);
assert.match(source,/export const impressumIntro/);
const dates = source.match(/Stand: (?:[1-9]|[12][0-9]|3[01])\. (?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) 20\d{2}/g) || [];
assert.equal(dates.length,3,"All three legal pages must have a published update date");
for(const word of ["Entwurf","Platzhalter","Aufbauphase","[Datum einfügen]",
  "[Unternehmensname einfügen]","[Rechtsform einfügen]","[vollständige Anschrift einfügen]",
  "[vollständige ladungsfähige Anschrift einfügen]","[Hosting- und Auftragsverarbeitungsdetails",
  "[Konkrete Dienstleister","[USt-IdNr. einfügen",
  "[Registergericht und Registernummer einfügen","vor produktiver Nutzung"]) {
  assert.ok(!source.includes(word),"Unfinished public legal text: "+word);
}
assert.ok(!source.includes("QR-Sticker"),"QR terms must not return");
assert.ok(!source.includes("des LUVIPRO Marktplatzes"),"Future marketplace must not be presented as offered");
assert.match(source,/Diaa Alameen/);
assert.match(source,/info@luvipro.de/);
assert.match(source,/customerservice@luvipro.de/);
assert.match(source,/\+49 177 7969259/);
assert.match(source,/Art\. 6 Abs\. 1 lit\. b DSGVO/);
assert.match(source,/§ 5 DDG/);
assert.match(source,/Prinzenstraße 5, 30159 Hannover/);
for(const path of legalPages){
 const page=readFileSync(path,"utf8");
 assert.match(page,/LegalPage/);
}
console.log("Public legal content cleanup: PASS (no draft/placeholder, current date, contacts, report access privacy)");
