import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(file)=>readFileSync(file,"utf8");
const terms=read("src/lib/affiliate/terms.ts");
const page=read("src/app/affiliate/agb/page.tsx");
const application=read("src/app/affiliate/page.tsx");
const api=read("src/app/api/affiliate/apply/route.ts");
const admin=read("src/app/intern/finanzen/affiliate/page.tsx");
const adminRoute=read("src/app/api/accounting/affiliate/route.ts");
const db=read("docs/sql/affiliate-agb-acceptance.sql");
const footer=read("src/components/sections/footer.tsx");
const general=read("src/app/agb/page.tsx");
const account=read("src/app/affiliate/dashboard/page.tsx");
for(const phrase of [
 "Gewerbenachweis","Bruttovergütung","Umsatzsteuer","Einkommen-","Gutschrift",
 "§ 19 UStG","§ 14 UStG","§ 87c","§ 89b","§ 307","Widerrufsfrist","14 Tagen",
 "Werbung","§ 5a UWG","DSGVO","Kündigung","Haftung"
])assert.ok(terms.includes(phrase),"Missing essential Affiliate term: "+phrase);
assert.match(terms,/affiliateTermsVersion = "2026-10-29"/);
assert.match(page,/affiliateAgbSections/);
assert.match(application,/href="\/affiliate\/agb"/);
assert.match(application,/name="terms_version" value=\{affiliateTermsVersion\}/);
assert.match(application,/name="terms" required/);
assert.match(api,/f\.get\("terms_version"\)!==affiliateTermsVersion/);
assert.match(api,/legal_agb_version:affiliateTermsVersion/);
assert.match(api,/legal_agb_accepted_at:new Date\(\)\.toISOString\(\)/);
assert.match(admin,/individual_agreement_ref/);
assert.match(admin,/individual_agreement_confirmed/);
assert.match(admin,/gross_inclusive_terms/);
assert.match(admin,/name="code_terms_evidence_ref"/);
assert.match(adminRoute,/action==="approve" && \(contractRef\.length<4/);
assert.match(adminRoute,/gross_inclusive_terms/);
assert.match(adminRoute,/code_terms_confirmed/);
assert.match(adminRoute,/Partner must accept AGB and sign individual terms/);
assert.match(db,/Original application legal acceptance is immutable/);
assert.match(db,/individual_agreement_accepted_at/);
assert.match(db,/code_terms_evidence_ref/);
assert.match(footer,/href: "\/affiliate\/agb"/);
assert.match(general,/LegalPage/);
assert.match(account,/href="\/affiliate\/agb"/);
console.log("Dedicated Affiliate AGB, acceptance, legal evidence and published navigation: PASS");
