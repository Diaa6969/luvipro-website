# LUVIPRO Affiliate + Accounting — implementation and launch checklist
Status: 2026-10-29, website branch feature/affiliate-accounting-20261029.

## Routes for testing after merging into `main`
- `https://luvipro.de/demo/marketing`: fully interactive synthetic **demo**, safe to use publicly. Admin accept/reject, code creation, finance overview, download an independently generated **DEMO** PDF. No real data persists or is sent to Supabase.
- `https://luvipro.de/affiliate`: production-form UI and legal text; submission is visibly disabled until the server backend is configured, backed up and migrated. Never upload personal Gewerbe proof while disabled.
- `https://luvipro.de/intern/finanzen`: existing private accounting login and dashboard; shows new affiliate, cash journal and monthly PDF links only when `ACCOUNTING_PANEL_ENABLED=true` and strong secret password/session are configured.
- `https://luvipro.de/intern/finanzen/affiliate`: administrative approval of Gewerbeanmeldung and manually issued discount codes.
- `GET /api/accounting/monthly-pdf?month=YYYY-MM`: real data admin PDF; must present signed accounting cookie or Supabase administrator JWT in Authorization.
- `POST /api/affiliate/claim`: existing FlutterFlow authenticated user with confirmed email links to their approved application only.

## Safety: what remains OFF
`AFFILIATE_APPLICATIONS_ENABLED`, `STORE_CHECKOUT_ENABLED`, `STORE_BANK_TRANSFER_ENABLED`, `INVOICE_ISSUANCE_ENABLED`, `ACCOUNTING_PANEL_ENABLED` are all independently default OFF. Nothing in the marketing preview charges money, issues invoices or grants coupon redemption.

### Before turning on real applications
1. Perform and verify an **updated** full SQL/auth/storage Supabase backup (the user's Oct 15 backup is not current). Do not rely solely on repository files; the Supabase Free plan does not provide the same automatic backups as paid tiers.
2. Ensure no production schema drift. Validate dependencies in `docs/sql/invoicing-schema.sql` and `docs/sql/bookkeeping-extension.sql` before enabling the existing finance module. Apply the additive `docs/sql/affiliate-accounting-extension.sql` after a local transaction/security test and fresh backup.
3. Use a private Storage bucket `luvipro-affiliate-docs` and service-role-only endpoint for Gewerbe proofs. Verify upload, authorized reading, and delete/retention workflow. Dedicated atomic HMAC-IP limiter `luvipro_affiliate_take_rate` is required before enabling applications.
4. Set private Vercel environment variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AFFILIATE_RATE_SECRET` (>=32 characters) and `AFFILIATE_APPLICATIONS_ENABLED=true`. For FlutterFlow bearer downloads, add Supabase publishable/anon key as `SUPABASE_ANON_KEY` to Vercel server environment (nonsecret public client key); NEVER expose service role in web/mobile code.
5. Re-deploy Vercel, test form with a dedicated fictional applicant, synthetic document and review in protected Admin. Disable feature and remove synthetic data after the test under a documented cleanup plan. Re-test RLS.
6. Verify full multi-tenant security, admin actions, email verified account linking, commission/payout state guards and legal notice retention. Review actual affiliate agreement, tax invoice receipt policy, German B2B electronic invoice requirements with an accountant.

### Before turning on payments / live discounts
- Current checkout still uses an independent Stripe price and its existing invoice snapshot. It DOES NOT accept a discount code yet. The current code insertion intentionally has `active=false`. Do not activate codes just to test: connect server-side discount validation and immutable pricing, limits/replay-safe redemption, idempotent verified-payment events, delivered-at evidence, cancellations/refunds/chargebacks, invoices reflecting actual discounted prices and commission ledger.
- A flat 14-day buffer may be insufficient for some purchases. Database has 15-day conservative safety floor after verified delivery and `return_deadline_at` to enforce a longer relevant period.
- Bank transfers/payments remain manual approval and documentation; no automatic payout API is integrated.

## Native FlutterFlow code prepared
- `integration/flutter/luvipro_marketing_accounting_admin.dart`: native admin tab with Gewerbe review, manual code editing/creation, commission overview and monthly PDF bytes; uses Supabase client's current session and existing `is_admin()`.
- `integration/flutter/luvipro_affiliate_account.dart`: affiliate tab, no new user role, verified-email account linking, own codes/commission/payout snapshots.
- `integration/flutter/AFFILIATE_ACCOUNTING_CODEX.md`: integration steps/tests in **original** FlutterFlow project. Adapt original app imports, file-save/open action, navigation and theme; use no parallel Flutter project.
These are *source modules staged in the website GitHub repository*, not FlutterFlow editor changes. They have not been compiled with the exact FlutterFlow project dependencies.

## Accounting scope
Already in website repo (not necessarily enabled in live DB): outgoing device invoices, private supplier receipts, CSV annual export and simplified monthly table. Newly added: append-only supplementary cash journal, scanned receipt→PDF download, monthly PDF report (original entries + separated cash events + paid affiliate payouts).
Never describe this as a complete GoBD-certified financial accounting system. Full DATEV exports, asset depreciation, actual B2B XRechnung/ZUGFeRD, accounting posting rules, bank reconciliation and year-end closing still require implementation/accountant review.
