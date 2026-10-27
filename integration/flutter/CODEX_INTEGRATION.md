# CODEX / LUVIPRO: integrate bank-transfer admin into the ONE EXISTING Flutter app

**Status:** Prepared integration instructions. User authorization to integrate
into the existing local Flutter source DOES NOT authorize changing LIVE Supabase,
the active Android/iOS release, or the Vercel production website.

## Source files: current GitHub website branch

GitHub repository: `Diaa6969/luvipro-website`
Branch: `feature/international-home-en-ar`.

Mandatory read-only sources:
- `integration/flutter/bank_transfer_admin_section.dart` — staged Flutter widget.
- `integration/supabase/functions/bank-transfer-admin/index.ts` — staged secure Supabase Edge bridge. Not deployed.
- `src/app/api/internal/bank-orders/route.ts` — website backoffice API.
- `src/lib/bank-transfer/service.ts` — private payment/reminder/send implementation.
- `src/lib/bank-transfer/logic.ts` — verified totals and prefilled German emails.
- `docs/sql/bank-transfer-orders.sql` — **proposal only**; MUST NOT run.
- `docs/bank-transfer-integration.md` — rollout and prerequisites.

On the Windows workstation, the *website* Git checkout is known as
`C:\Users\diaaa\OneDrive\Desktop\luvipro` (verify it exists, and do not
assume it contains Flutter). Read staged sources via `git show` without
switching/merging its branch:
```cmd
cd /d C:\Users\diaaa\OneDrive\Desktop\luvipro
git status -sb
git fetch origin feature/international-home-en-ar
git show origin/feature/international-home-en-ar:integration/flutter/bank_transfer_admin_section.dart
git show origin/feature/international-home-en-ar:integration/supabase/functions/bank-transfer-admin/index.ts
```
If fetch/ref fails, report instead of recreating source or guessing another
remote. Another project on the laptop contains the ACTUAL exported Flutter
application, both ZIP and extracted folder. Locate by `pubspec.yaml` and
real `adminCenterPage`/FlutterFlow exports; do NOT choose the website folder.

## Mandatory safe integration steps

1. Inspect the real extracted Flutter source, actual Dart page name/path for
   adminCenterPage, routing, Supabase initialization, user authentication, and
   current permissions. Confirm the `supabase_flutter` version/APIs from the
   project's own `pubspec.lock`. Do NOT change any existing working flow.
2. Save a Git commit/snapshot of the unchanged app, test the current baseline,
   document the exact rollback path. Do not overwrite the original ZIP.
3. Adapt the staged widget `BankTransferAdminSection` for the **existing**
   adminCenterPage, using the project's current component/style conventions.
   It must show pending and paid bank orders, exact unique invoice reference,
   total and customer; offer two actions: manual paid confirmation only with
   real bank statement reference+date+checkbox, and preview then explicitly send
   the filled German payment reminder.
4. Invoke the named Supabase Edge function using the **existing logged-in
   session's** access token. Never include `SUPABASE_SERVICE_ROLE_KEY`,
   `BANK_ADMIN_BRIDGE_TOKEN`, Hostinger SMTP or Stripe secret in Flutter.
   Do not consider `public.users.role` or client `user_metadata` proof
   of admin rights. The Edge backend separately verifies a Supabase Auth
   allowlisted UUID **and** trusted `app_metadata.billing_admin`.
5. Do not assume the staged Edge function has been deployed. Add code to the
   existing backend workspace only if accessible; otherwise record required
   integration step without touching the live Supabase project.
   The staged web API is likewise inactive until secure configuration.
6. Implement sensible error/loading/empty states and no automatic email or
   status changes on list refresh. Never mark a bank payment paid based on
   customer's checkbox, screenshot or email alone: only admin's verified
   transaction against actual bank statement.
7. Ensure this is one continuation of the user's EXISTING Flutter app codebase.
   No parallel app, no second FlutterFlow export, no partial rewrite.

## Acceptance tests — local / synthetic only

- Baseline: app builds and existing admin workflows work before changes.
- After: existing login/admin navigation/regression paths remain intact.
- Unauthorized user cannot open bank/admin data or invoke privileged action.
- Admin sees pending/paid bank list from mocked Edge API.
- Confirm paid requires matching bank-statement entry reference/date; duplicate
  confirmation fails and never marks invoice paid twice.
- Preview shows exact saved invoice number, amount, customer email and IBAN.
- Reminder sends only after explicit human confirmation and reports failure
  without displaying false success or re-sending on retries.
- Offline/network failure yields a safe message; nothing is accidentally sent.
- `flutter analyze`, relevant widget tests, and Android build (plus iOS only
  in a supported Mac/iOS environment) pass.
- Report exact changed Dart files, test outputs, original file SHA/backup,
  how to undo changes, and list any unverified backend assumptions.

**HARD STOP:** No live DB migrations, Storage/RLS changes, Edge deployments,
Vercel deployment or production payment/email sends until separately approved.
Git commits/backups in the existing app source are welcome.
