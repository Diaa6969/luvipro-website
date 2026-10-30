# LUVIPRO Affiliate AGB — Implemented and legal review (29 October 2026)

## Public German legal copy
- `/affiliate/agb`: dedicated B2B Affiliate participation AGB, version **2026-10-29**.
- `/agb`: existing general terms now point to specific Affiliate participation conditions.
- `/affiliate`: signup form links to full AGB and records version + timestamp.
- `/affiliate/login`, `/affiliate/dashboard`, site footer and mobile legal navigation link to terms.

## Commercial contract rule
- LUVIPRO decides both *customer coupon discount* and *Affiliate commission %* manually.
- Commission percentage of actual net eligible selling price **after discount** determines the *total gross commission* where validly individually agreed: any applicable VAT is **inside** that amount, not in addition.
- E.g. 2,700 € net eligible product sale × a separately accepted 10% rate = 270 € total commission. German standard 19% VAT partner: 226.89 € service net + 43.11 € VAT (inside 270). German Kleinunternehmer §19 partner: 270 € without displayed VAT.
- Affiliate handles their own income/corporate/trade taxes and social contributions. This does NOT shift legal VAT liability, reverse charge or invoice duties to the wrong entity.
- Code rate is *not* guaranteed at 10%; only an accepted individual rate applies.
- Monthly payout is a **manually executed external bank transfer by LUVIPRO Admin**, only documented in app after proof; reminder is an internal Admin note. Valid legal due dates must be honored.
- 14 days after delivery is a practical review buffer, not a statutory withdrawal right for every B2B sale and never overrides non-waivable HGB rights.

## Statutory constraints incorporated (official sources)
- `https://www.gesetze-im-internet.de/ustg_1980/__14.html` §14 UStG (document content, Gutschrift prior agreement, objection).
- `https://www.gesetze-im-internet.de/ustg_1980/__19.html` §19 UStG (Kleinunternehmer treatment).
- `https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.htm` B2B E-Rechnung, PDF vs structured format, time-limited transitional rules.
- `https://www.gesetze-im-internet.de/uwg_2004/__5a.html` §5a(4) UWG (identify commercial purpose).
- `https://www.gesetze-im-internet.de/ddg/__6.html` §6 DDG (commercial communication identification and promotion terms).
- `https://www.gesetze-im-internet.de/hgb/__84.html` §84 HGB (actual work can constitute a Handelsvertreter role regardless of label).
- `https://www.gesetze-im-internet.de/hgb/__87a.html` and `https://www.gesetze-im-internet.de/hgb/__87c.html` (mandatory commissions due/records).
- `https://www.gesetze-im-internet.de/hgb/__89b.html` (mandatory statutory compensation if Handelsvertreter criteria are met).
- `https://www.gesetze-im-internet.de/bgb/__307.html` §307 BGB (AGB clauses must be fair and transparent).

## Contract formation (MUST enforce before live program)
The public checkbox is NOT the signed economic agreement. Applicant must separately accept:
- Signed individual contract with legal supplier identity, commission %, eligible products, gross/VAT-inclusive compensation, attribution method, territory and start date.
- For every code issuance/amendment, evidenced agreement of exact customer discount, commission and validity; no retroactive change to acquired commission.
- Tax profile and, if LUVIPRO issues tax Gutschriften on behalf of the Affiliate, separate **prior** Gutschrift agreement and accurate tax status.

`docs/sql/affiliate-agb-acceptance.sql` is a STAGED migration for new columns in the *existing* Supabase project; existing application approvals without legal terms remain unverified and are not falsely backfilled.

**Production DB has not been changed by this branch.** Website code must be activated only once full backups/restorable local clone, RLS test, reviewed migrations and secure document evidence are complete. Do not migrate by merely enabling Vercel env flags.

## Open legal/compliance checks — do not call this 100% lawyer certified
1. Qualified German commercial/competition lawyer should confirm whether actual referral work is merely advertising vs. Handelsvertreter (§§84 ff HGB), which cannot be decided by labels in AGB. Add mandatory statutory clauses if applicable.
2. German tax adviser verifies Gutschrift agreement, invoicing, VAT-inclusive treatment, §19, international partners/§13b reverse charge, EN16931 E-Rechnung and GoBD retention. Current PDF alone is not a fully structured e-invoice.
3. Check publisher legal identity and complete current ladungsfähige address in the Impressum (especially before UG foundation) and legal contracting party of existing vs future UG.
4. Preserve signed contracts/Gewerbenachweise in private, access-controlled archive; a free-text agreement reference alone is not the signed contract. Add actual evidence upload/retention workflow and legally correct copy of terms/version per contract.
5. Build contract acceptance controls in original FlutterFlow application directly through Codex (do not create parallel app); validate end-to-end and security before enabling payouts.
6. Existing app/web checkout promo attribution and verified payment evidence are still not enabled and need transaction-specific validation.

The page is public informational B2B contract language; **not a claim of court-tested legal enforceability**.

## Production deploy retry – 30 October 2026

A fresh push to the existing `main` branch was requested to retry the Vercel production deployment after the previous `Deployment rate limited` status. This is a documentation-only deploy trigger; production code, user data, Supabase schema and payment settings were not changed. Verify the new commit status in Vercel before calling publication successful.
