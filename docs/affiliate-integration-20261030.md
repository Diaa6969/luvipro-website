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

## Final review delivery

Draft PR #15 contains the website integration; current main was synchronized while preserving the customer-first homepage and removal of misleading demo links. No production merge was performed. The first Linux CI failure was a Windows-only synthetic PDF output path; the test now uses the OS temporary directory (or an explicit test output override).

Dependency verification identified existing vulnerabilities. Compatible lockfile patches update Next 15.5.28 and transitive dependencies; PostCSS is pinned/overridden to 8.5.32 and Nodemailer is pinned to the official 10.3.1 release. The production Next build, in-memory SMTP MIME/attachment compatibility test, and affected financial tests pass. npm audit reports zero known vulnerabilities for this lockfile; this is not a proof of absence of all vulnerabilities. No SMTP message was sent and no production environment credentials were changed.
