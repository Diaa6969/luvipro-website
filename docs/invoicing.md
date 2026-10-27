# LUVIPRO billing implementation — 26 October 2026

## Status and scope

This change is committed **only to** `feature/international-home-en-ar`, not `main` or the live Vercel site. **No production Supabase schema was changed, no invoices were legally issued and no customer emails were sent.** This project does not currently have a confirmed legal seller name, tax number/VAT ID, approved company invoicing address, or company bank details. `INVOICE_ISSUANCE_ENABLED=false` is mandatory until those are confirmed.

### Price engine: domestic Germany, 19% standard VAT

Device pricing (`LU3656060`) is **net**, VAT added. Standard and Premium inspections are **gross**, VAT extracted from the agreed consumer price.

| Item | Net | VAT 19% | Gross |
| --- | ---: | ---: | ---: |
| LU3656060, 1 unit | EUR 3,000.00 | EUR 570.00 | EUR 3,570.00 |
| Germany shipping, once/order | EUR 29.99 | EUR 5.70 | EUR 35.69 |
| One device + shipping | **EUR 3,029.99** | **EUR 575.70** | **EUR 3,605.69** |
| Standard inspection | EUR 50.41 | EUR 9.58 | **EUR 59.99** |
| Premium inspection | EUR 100.83 | EUR 19.16 | **EUR 119.99** |

Calculation is integer cents with explicit rounding. The calculation currently covers only ordinary **domestic German transactions at 19%**. Cross-border transactions, reverse-charge, exemptions and small-business special treatment require separate invoicing logic and tax review. Public-facing prices are not modified: devices are 3,000 EUR net, inspections retain 59.99/119.99 EUR gross.

### PDF document engine
`src/lib/invoicing/document.ts` generates one-page PDF invoices via `pdf-lib`, with:
- Company/workshop (actual legal issuer), German issuer and customer billing address;
- issuer's real Steuernummer or USt-IdNr.; consecutive invoice number;
- invoice and verified supply/service date, item, qty, VAT rate, net/VAT/gross totals;
- paid vs unpaid status, bank data for unpaid invoices, and a bank transfer **Verwendungszweck** identical to the unique invoice number.
- `demo=true` produces a clearly watermarked **MUSTER / KEINE RECHNUNG** with invented synthetic information, never a usable tax invoice.

Local-only PDF demos (via `npm run dev`, blocked in production builds):
- `http://localhost:3000/api/billing/sample?kind=device`
- `http://localhost:3000/api/billing/sample?kind=inspection_standard`
- `http://localhost:3000/api/billing/sample?kind=inspection_premium`

The engine produces a human-readable PDF **not an EN 16931 structured E-Rechnung**. This is not a complete compliant 2028 B2B E-invoicing implementation.

### Real device invoice flow (code, disabled)
The following cannot run until properly enabled in a separate, explicitly approved deployment.

1. An internal **fulfilled/delivered order** event sends a signed/private authorized request to `POST /api/billing/issue-device` with a Stripe `sessionId` and the true delivery date `deliveredAt`.
2. Handler requires a strong `INVOICE_INTERNAL_TOKEN`, `INVOICE_ISSUANCE_ENABLED=true`, `SUPABASE_SERVICE_ROLE_KEY`, legal seller details and Hostinger SMTP credentials.
3. Server fetches Stripe checkout and line items itself; verifies payment status, device ID, price, quantity, Germany billing address, 19% gross sum. It refuses any unsupported tax configuration.
4. A **proposed, not executed** PostgreSQL schema in `docs/sql/invoicing-schema.sql` provides a unique invoice sequence, source key uniqueness, protected RLS table, and an idempotent source reservation procedure. Do not manually invent invoice numbers in the browser.
5. Once payment and delivery are verified, the renderer builds the invoice PDF. Durable snapshot + PDF are saved. A single worker claims delivery and Hostinger SMTP emails the attached invoice to the customer's checkout email. The unique invoice number is included in the PDF and mail as **Verwendungszweck**.
6. Email state `sent` is recorded. An uncertain SMTP error or server crash leaves state for manual reconciliation; invoices are **not automatically sent again**, avoiding accidental duplicates. An audit/reconciliation dashboard still needs implementation.

The current Stripe Checkout setting `invoice_creation[enabled]=false` prevents duplicate Stripe-generated formal invoices when this own-number engine is enabled. Stripe payment receipts remain separate from legally valid invoices. The website's direct checkout is also gated on invoice readiness and remains OFF by default.

IMPORTANT: This engine issues the **final hardware invoice only after recorded supply/delivery**. A payment **before** delivery may require a separate advance/deposit invoice (`Anzahlungsrechnung`) and later final settlement; do not counterfeit a delivery date simply to send an immediate invoice. Implement the advance-payment flow separately once actual payment and supply terms are confirmed.

### Inspections: workshop vs platform issuer

LUVIPRO's currently adopted model says **the partner workshop performs and invoices the inspection** and assumes inspection/report service liability; LUVIPRO retains its platform fee. Therefore a Standard or Premium **customer invoice must name the responsible workshop**, including its tax ID and address, **not silently show LUVIPRO UG as the supplier**. Using Hostinger to deliver that invoice on behalf of the workshop requires contract authorization and an authenticated workshop event. 

This repo currently provides **accurate VAT calculation and clearly marked sample PDF invoices** for both inspection types, but **does not issue legal inspection invoices** until the user approves partner billing authority, workflow integration with the existing Flutter/Supabase project, and an independent per-issuer numbering scheme. The existing `public.purchases` table reflects report purchases, not a verified payment ledger of Standard/Premium workshop inspections, so don't incorrectly treat it as a source for inspection invoice issue. Production Supabase was only inspected read-only.

Commissions (80% workshop / 20% LUVIPRO) require **separate settlement and platform commission invoices** based on the precise merchant-of-record/payment-collection agreement. Do not put the workshop's 80% payout on a customer's tax invoice by default.

### Account data, payments, legal and testing requirements before go-live

- Confirm LUVIPRO UG legal establishment, exact seller address, tax number/USt-IdNr., bank account, VAT regime and whether PDF invoices are appropriate for the company's year and turnover.
- Execute reviewed database migration **only with backup and explicit approval**. It is not installed on the production database.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `INVOICE_INTERNAL_TOKEN`, SMTP password and Stripe secret exclusively on server, never in Git/client code. Add durable retention and archival of issued PDF/documents (8 years VAT retention), plus admin access control, amendment/credit-note workflow.
- Connect actual *verified* fulfillment events from the order-management workflow. Configure authenticated workshop delivery triggers for inspection invoices once supplier arrangements are approved.
- Test with **synthetic data**: pricing, PDF text, email attachment, duplicate paid event (only one invoice number and one mail), concurrency/retry/crash, abnormal tax rates, canceled/refunded payments, VAT IDs, refunds/credits, incorrect addresses, data retention, and Stripe tax mismatch.
- Add explicit support for structured `XRechnung` or `ZUGFeRD` (EN 16931) for future B2B obligations; PDF alone is not a structured German e-invoice.
- Never enable billing merely because checkout is displayed; no invoice should issue on a non-binding `Unverbindliche Produktanfrage`.

References (Germany):
- BMF FAQ March 2026: https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html
- IHK Hannover compulsory particulars: https://www.ihk.de/hannover/hauptnavigation/recht/steuerrecht/umsatzsteuer/pflichtangaben-in-rechnungen-5217552

### Rollback and change safety
All changes are isolated to the feature branch with Git commit history. The original main remains unchanged and is the rollback baseline. No live DB schema/data, Supabase Edge Functions or Flutter source were modified.
