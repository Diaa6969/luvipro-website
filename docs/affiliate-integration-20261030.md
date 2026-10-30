# Shared Affiliate integration — 30 October 2026

Uses the existing LUVIPRO Supabase project and Auth identity. Customer/Partner roles are never replaced. No payment provider or bank transfer is activated.

- Authenticated private business-proof submission and versioned consent use the same deployed `affiliate-program-v1` Edge endpoint as FlutterFlow.
- Registration status and historical account/documents remain accessible independently of the flag pausing new website applications.
- Admin reviews use revision checks, verified document/individual agreement evidence, and separate public messages/private notes.
- One existing discount-code table now supports devices, Standard/Premium inspections, percentage/fixed-net discounts, caps/minimums, dates, quotas, and explicit new-Partner eligibility. Per-product compensation has no implicit positive default.
- Checkout quotes and order attribution are computed/validated in PostgreSQL. Shipping is excluded from discount and commission bases. Previous sales keep immutable terms.
- Commission percentage of NET AFTER DISCOUNT is the agreed TOTAL payout, including applicable VAT. A verified domestic tax profile separates net/VAT/gross without adding VAT to that total. Foreign treatment fails closed pending separate review.
- Existing monthly settlements, reminders and manually documented external transfers remain the only payout path. There is no transfer API. Actual bank evidence and unique references remain mandatory.
- Device bank checkout/invoice integration consumes the trusted snapshot when separately activated. Stripe and other live-payment flags are unchanged. Inspection quotes do not grant report access or activate an inspection payment flow.

## Verification

- 68 isolated PostgreSQL checks, including production-schema compatibility, role isolation, concurrent quota/confirmation guards, immutable attribution and non-destructive containment rollback. Synthetic Auth/Storage records are not a claim of real Auth integration.
- 15 actual Next route-handler scenarios with mocked upstream Auth/Edge/DB responses.
- 19 discounted-pricing/order/invoice assertions; one synthetic preview PDF generated.
- Six Edge validation/PDF tests and Deno type check. The deployed Edge v2 source matches the three maintained files; JWT verification is enabled.
- Next TypeScript check and production build passed locally; CI runs the affected suites and build with payments disabled.
- Original FlutterFlow project has seven native Affiliate pages and seven saved custom widgets. Cloud readback and editor reload verified persistence; actual Test Mode rendered the menu, program, terms and protected Admin code list. Back navigation was corrected in all seven page AppBars.

## Deployment boundary

The tested SQL units are already applied to the existing Supabase project. SQL sources here describe their final combined definitions; do not blindly reapply them to production. Production migrations and source/rollback checkpoints are recorded in the existing local readiness directory. All production users, reports and 1,244 Storage objects were preserved.

This website branch is for review/preview. It is not authorization to merge a production website release, activate payments, create real contracts or publish the FlutterFlow application. A full synthetic registration → approval → order → settlement session with a dedicated test account remains separate from mocked/SQL verification. No real legal consent or external transfer was fabricated.
