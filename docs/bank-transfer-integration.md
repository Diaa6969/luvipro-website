# LUVIPRO Vorkasse / Banküberweisung — branch-only implementation

Status: October 27, 2026. Only the existing `feature/international-home-en-ar` branch was changed. **No live Supabase tables were created, no bank orders were issued, no production mails were sent, and neither production website nor original Flutter app were changed.**

## Buyer flow — website

On `/order`, a third payment method **Banküberweisung** is shown alongside unbinding inquiry and Stripe checkout. It is blocked until these server-only prerequisites are present: 
`STORE_BANK_TRANSFER_ENABLED=true`, `BANK_ORDER_RATE_SECRET` (32+ chars), `BANK_TRANSFER_HOLDER`, checksum-valid German `BANK_TRANSFER_IBAN`, legal invoice issuer data, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (NEVER NEXT_PUBLIC), Hostinger SMTP details. The app calculates product pricing from server constants (LU3656060 EUR 3,000 net; DE shipping EUR 29.99 net once; 19% VAT; one device order including shipping EUR 3,605.69 gross). DB function performs the same independent calculation.

When the buyer accepts conditions and provides billing address, the server reserves a unique **LUV-YYYY-NNNNNNN** reference from the shared invoice sequence, associates it atomically with an unissued final invoice record and a protected bank order, and sends payment instructions to the buyer's supplied email:
- recipient/account holder, IBAN/BIC, amount, taxes, unique **Verwendungszweck = reserved invoice number**, customer name/order/quantity;
- email carefully labels itself as **Vorkasse-Zahlungsaufforderung, not a final tax invoice**. This avoids falsely claiming delivery before delivery.
- React keeps a UUID idempotency key for retries. The DB prevents duplicated reserved invoice numbers and limits new orders per email/IP fingerprint.
- If sending fails, the order remains in the internal queue flagged **failed**; do not instruct the customer to pay until instructions delivered and bank account validated. Operators must reconcile errors; do not invent an invoice or silently retry emails.

An unpaid prepayment order is *not* an earned completed sale or automatically a final invoice. A verified bank payment before delivery can still create **Umsatzsteuer / Anzahlungsrechnung** obligations. A tax adviser must approve the advance payment and final-invoice handling before enabling the feature for real orders (the current dashboard is not a legally authoritative UStVA ledger).

## Admin website
`/intern/finanzen` now includes **Banküberweisungen**:
- Open payments: customer, email, amount gross, exact invoice reference, original instruction-email status.
- **Zahlung bestätigen** demands an explicit reviewed bank statement checkbox, actual bank booking reference and credit date. Only admins with private credentials and a configured admin actor can call this endpoint. The DB accepts the transition from `pending` to `paid` once (audited); no email, buyer click or bank transfer claim can mark itself paid.
- **Fertige E-Mail ansehen** previews the reminder built from the actual saved order: customer's email/address, amount, banking recipient, IBAN and identical unique reference. **Erinnerung senden** sends via Hostinger SMTP only after explicit click. Database claim limits to one reminder attempt in 24 hours and records success/failure.
- Paid orders can be marked **delivered with an actual delivery date**, to generate the final device invoice PDF with the same reserved invoice number, archive the document, and send it to the customer. This step is disabled until proper seller/issuer, invoicing and advance-tax review are complete.
- These cash payment statuses are distinct from invoices included in the monthly VAT summary. No double-counting of workshop gross inspection receipts.

## Existing Flutter app (do not create second project)
- Staged Edge backend: `integration/supabase/functions/bank-transfer-admin/index.ts`.
  Use the authenticated client's Supabase JWT; the Edge Function verifies the user with Supabase Auth and checks BOTH an explicit allowlist `BANK_ADMIN_AUTH_UIDS` AND trusted `auth.app_metadata.billing_admin=true`.
  It never trusts the user-editable `user_metadata` or previously unsafe `public.users.role`.
- Staged drop-in UI: `integration/flutter/bank_transfer_admin_section.dart`.
  The existing `adminCenterPage` should import `BankTransferAdminSection` from the **same exported Flutter project** after verifying exact Flutter package API, existing app routes and navigation. It lists unpaid/paid bank orders and has two admin actions: actual bank payment confirmation (booking reference and confirmation) and pre-filled reminder preview + send. **Not currently integrated into your on-device Flutter source**, because no copy of that private code is available to this GitHub repository.
- Edge-to-website bridge uses `BANK_ADMIN_BRIDGE_TOKEN` in the Edge Function and server only. Mobile app NEVER contains Supabase service-role, bridge token, bank account private operations, SMTP password or Stripe secret. Website `/api/internal/bank-orders` verifies this bridge token and admin user ID; existing protected web accounting session may also use it.
- Do **not deploy** Edge function, change app or set auth app_metadata before explicit security/production authorization. Default admin access remains off.

## Database and security

Staged SQL (NOT executed):
1. `docs/sql/invoicing-schema.sql` — shared unique invoice-number sequence and protected invoices.
2. `docs/sql/bookkeeping-extension.sql` — separate private incoming invoice ledger and archive.
3. `docs/sql/bank-transfer-orders.sql` — secure bank order queue, atomic reserve + manual payment claim + daily reminder claim, append-only event/audit table and default-deny RLS.

All new tables revoke `anon` and `authenticated` privileges; only `service_role` may query via server. Never expose to Flutter/Next browser. Bank/customer records are personal data: appropriate GDPR records/retention/deletion policy and controller documentation required.

Before enabling on real traffic: independent tax/legal review, verify business registered and banking details, apply migrations **on synthetic local copy first**, test repeated/parallel checkout, verify spam WAF/CAPTCHA/SMTP constraints, add MFA and brute-force controls to accounting login, ensure period-compliant VAT prepayment treatment, versioned backup/GoBD retention, reconciliation workflows and check every stage. No production SQL/Edge deploy without separate explicit approval.

### Developer tests
`npm ci && npm run test:bank-orders && npm run test:invoices && npm run test:accounting && npm run build`.
Github Actions runs these against synthetic test data. It does not prove production SMTP delivery, actual database SQL deployment, or end-to-end functionality in Flutter.

### Revert / data policy
Main, Vercel Production, live Supabase and uploaded Flutter source stay unchanged. Every modification is committed on the existing website feature branch; standard git revert is available. Rollback for eventual live payments/issued invoices cannot delete tax records and must use documented reversals.
