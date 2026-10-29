# LUVIPRO Affiliate V2 — codes + one account (2026-10-29)
**Source branch**: feature/affiliate-code-controls-accounts, same `Diaa6969/luvipro-website` repository.

## User decisions implemented
- Admin can **Sofort deaktivieren** (pause), **Wieder aktivieren** (resume when real checkout ready), **Gültigkeit verlängern**, or **Bearbeiten** (code name when unused, discount, commission, dates, usage limit). Discount and commission remain independent. All rate/time/ownership changes are admin-only.
- Editing active terms pauses a code; existing sales commissions remain unchanged. Cannot rename a used code or edit its original start date once redeemed. Optimistic version guard and database trigger log previous/new values to `luvipro_affiliate_audit` atomically.
- One existing Supabase `auth.users.id` for **Kunde + Affiliate** and **Partnerwerkstatt + Affiliate**. No self-edited `users.role`, no new user record, no second app. Approval requires Gewerbeanmeldung verification before linking. One matching confirmed Auth email + one approved application; the website /affiliate/login uses the existing app email/password.
- Affiliate /affiliate/dashboard: codes with status and rates, open/eligible/paid commissions, paid monthly payouts, own downloadable monthly PDF. All server queries use the exact Supabase Auth-validated owner UID. No access to other partners' data.
- FlutterFlow integration source updated in `integration/flutter/luvipro_marketing_accounting_admin.dart` and `integration/flutter/luvipro_affiliate_account.dart`. Codex must import these into the ORIGINAL FlutterFlow project (still not done by website repository merge).

## Public trial (non-financial)
- `https://luvipro.de/demo/marketing` uses synthetic state only. It now previews the new coupon actions and account tabs, with two role options Kunde/Werkstatt; no persistence, no real payments.
- `https://luvipro.de/affiliate/login` and `https://luvipro.de/affiliate/dashboard` are backed by Supabase Auth and remain disabled while production Supabase migrations and environment secrets are not installed.
- `https://luvipro.de/intern/finanzen/affiliate` requires the private accounting admin session.

## Live data activation is deliberately blocked
**No live production migration has been applied by this commit.** The existing affiliate schema migration `docs/sql/affiliate-accounting-extension.sql` is still staged and must be applied **before** the new `docs/sql/affiliate-code-controls.sql`. Their order is essential: new code controls refer to existing commissions/applications/audit tables.
1. Create and **verify** a fresh backup of the production Supabase DB, Auth and Storage. Validate a local restore of the live schema/data.
2. Validate staged SQL in isolated DB with synthetic admin/customer/workshop/affiliate; confirm RLS denies anonymous and other-user reads; check invoice tables and app regression. Run `npm run test:affiliate` for pure frontend server validation tests.
3. Apply initial affiliate schema and code-controls SQL, inspect RLS and triggers; verify **approved emails unique**, and existing app user roles unchanged.
4. Configure Vercel secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `AFFILIATE_RATE_SECRET`, `AFFILIATE_APPLICATIONS_ENABLED=true`. Verify login, claim, own-data denial, admin code update and audit with **synthetic** records. Rate-limit email password sign-ins, no token logs.
5. **Never** enable `AFFILIATE_COUPON_REDEMPTION_ENABLED` until a real checkout discount validator, verified order redemption, immutable tax invoice snapshots, reconciliation and RLS tests are complete. Resume action remains guarded until that explicit milestone.
6. When app screens imported, test customer and workshop profiles, partner approvals, VIN reports, camera/photo/video, and PDF permissions in existing FlutterFlow app. No duplicate app creation.

## Accounting
This update does not pay commissions or change revenue amounts. Existing paid transactions and `commission_cents` are immutable in sales history. Monthly dashboards and statements are informational, not an officially complete GoBD/DATEV system. E-invoicing, refund reconciliation and tax filing remain separate.
