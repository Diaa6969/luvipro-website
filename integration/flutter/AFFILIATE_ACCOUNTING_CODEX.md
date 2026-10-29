# LUVIPRO FlutterFlow integration: Affiliate + Finanzverwaltung (29.10.2026)

## Scope and safety
Continue in the SAME live FlutterFlow LUVIPRO project. Do not create another Flutter app. Preserve customer accounts, inspections, reports, VIN search, partner verification, existing Admin Center, and existing database. Existing administrator Auth UID must retain privileges; DO NOT hardcode it in source or use self-editable users.role for new security checks.

The Next.js website branch `feature/affiliate-accounting-20261029` stages a new /affiliate Gewerbe application, protected review UI (/intern/finanzen/affiliate), manual discount-code creation, private document handling and monthly PDF export. **The SQL is not applied automatically**. `docs/sql/affiliate-accounting-extension.sql` must be reviewed, backup created, isolated RLS tests passed, and migration deployed BEFORE enabling the website feature. Existing invoice and expense SQL is separately staged at `docs/sql/invoicing-schema.sql` and `docs/sql/bookkeeping-extension.sql`.

## Existing database capabilities
The project already has `public.is_admin()` protected by `luvipro_security.is_admin()`. For all app admin operations use Supabase Auth session and RLS, not user_metadata or user-editable role. The new (proposed) RLS-protected public tables:

| Table | Admin | Affiliate after identity linked |
|---|---|---|
| luvipro_affiliate_applications | SELECT/UPDATE and approval/rejection | SELECT own |
| luvipro_discount_codes | SELECT/INSERT/UPDATE manual, audit | SELECT own approved |
| luvipro_affiliate_commissions | SELECT/INSERT/UPDATE with trigger validation | SELECT own approved |
| luvipro_affiliate_payouts | SELECT/INSERT/UPDATE; once/month unique | SELECT own approved |
| luvipro_affiliate_audit | SELECT/INSERT only | no access |
| luvipro_billing_cash_events | SELECT/INSERT only | no access |

Gewerbe files reside in **private** Storage bucket `luvipro-affiliate-docs`. Do not open this bucket to the public or create permanent shared URLs. For admin documents, the website has a protected download endpoint using cookie authentication. Native Flutter requires a separately authenticated signed-URL retrieval channel (or a hardened Edge Function) which verifies the Supabase JWT AND `is_admin()`; do not simply embed the website session cookie.

## New FlutterFlow screens (not yet implemented by this branch)
1. Admin -> Marketing & Affiliates -> Applications: list submitted company/contact/country/status with proof preview; review actual registration before manually accepting/rejecting; capture audit reference. Authenticated admin RLS only.
2. Admin -> Marketing & Affiliates -> Rabattcodes: select *approved* applicant, type code manually, discount % and commission % separately, start/end dates, maximum uses; state defaults inactive; activate ONLY when payment checkout enforces discounts server-side.
3. Admin -> Marketing & Affiliates -> Provisionen: show verified PAID orders, delivered date, 15-day conservative buffer, refunds/cancellations, eligibility, pending payout batches. Only one payout batch per affiliate/month; manual payment confirmation plus bank reference.
4. Admin -> Finanzen: income and expense receipts, cashflow/balance-sheet classification, optional receipts, monthly summary, outgoing/incoming original invoices. Never double-count a bank entry and its invoice.
5. Admin -> Monatsabrechnung: download a **monthly summary PDF** through `GET https://luvipro.de/api/accounting/monthly-pdf?month=YYYY-MM` with HTTP `Authorization: Bearer <Supabase access_token>`, relying on the backend `public.is_admin()` RPC check; the backend requires the established finance database and environment variables.
6. Affiliate partner account: requires verified Supabase login safely linked to approved `owner_uid`, then read *own* codes, commissions, payouts using RLS. Unapproved applicants do not receive codes automatically.

## Hard rules
- Admin must personally review Gewerbeanmeldung or equivalent business registration before approval. One site application does not mean a verified identity or an automatically active Affiliate account.
- Manual code creation; no auto approval, no spontaneous bulk codes.
- Never trust browser-provided prices, percentages, paid/delivered timestamps, refunds, or affiliate identity.
- Purchase is attributed and commission computed **only** from verified payment backend events and fulfillment evidence; wallet/balance not changed from an untrusted client event.
- Consumer legal withdrawal generally starts from receipt of goods, not payment; this design uses a conservative 15-day buffer after recorded delivery; B2B waiting period is contractual.
- One payout cycle per month after verification, no duplicate per order or payout month, no payout without documented bank evidence.
- PDF monthly overview is informational and NOT tax-filing, DATEV-complete, GoBD-certified or EN16931 XRechnung/ZUGFeRD. Preserve originals; plan for GoBD retention, cancellations/corrections, VAT rules, and accountant review.

## Verification and integration workflow
1. Snapshot website main SHA, export FlutterFlow project, make new Supabase backup (the prior October 15 backup is no longer current).
2. Inspect migration; verify existing policies and auth helper. Reproduce and test all new policies with synthetic admin/customer/affiliate sessions locally.
3. Only then add new tables and private bucket; verify RLS ownership denial, unauthenticated denial, admin operation, rate limiting, max file size, and exact retention.
4. Test status transitions, refund/chargeback/14-day waiting period, payment webhook idempotency, one monthly payout, cancellation, negative/refund accounting, VAT.
5. Integrate device purchase and verified paid fulfillment server side, add checkout discount application and immutable invoice price snapshots, then activate codes.
6. Build app pages in original FlutterFlow project, test admin/customer/affiliate access and PDF download on device.
7. Retest old customer login, partner approval, inspections, VIN, PDF, storage privacy and order flow. Document every change, rollback and result.

## Required follow-up for full accounting
The website already stages outgoing invoice and incoming bill workflows. It has a simple monthly view and CSV. The added monthly PDF and cash event journal are **bookkeeping support**, not yet a complete German accounting system: implement bank reconciliation, asset register and AfA, accruals, tax controls, corrections/Storno, structured E-Rechnung, GoBD archival and DATEV output before claiming completeness.
