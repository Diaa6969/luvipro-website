# Marketplace V1 — implementation and release gate

This extends the existing LUVIPRO application and Supabase project. Public launch is not authorized by this change. Production website routes remain gated to `/verify`.

## Deployed backend

- Core: remote migration `20261031185955`, local source `20261030205002_marketplace_core_v1.sql`.
- Upload reservations and moderation: remote `20261031211227`, local `20261031192504_marketplace_upload_and_admin_operations_v1.sql`.
- Active Admin profile check: `20261031235555_marketplace_photo_active_admin_v1.sql` (record the remote version separately).
- `marketplace-v1` Edge version 2; original version 1 retrieved into the workspace readiness directory before replacement.
- New private bucket `luvipro-marketplace-media`; existing inspection buckets were not changed.

Never run an unreviewed `db push` or migration-history repair: remote version identifiers differ from the original local CLI filenames.

## Security and workflow

Drafts and messages are private. Public cards expose only eligible, Admin-approved listings. Publication requires a real, locked/generated matching report, seller authority and completed listing photos. Purchased-report access does not grant advertising rights. Full inspection media and PDFs are not returned by public Marketplace APIs.

Photo uploads are reserved before Storage writes and use stable per-file request IDs. Only completed, matching objects may be linked. Failed/ambiguous responses are not success. Retries within the open editor reuse the request ID and bytes; resuming after closing the editor is not implemented. Draft photos are private; published listing photos are authorized separately and use 30-second signed URLs.

The website compresses photos and rejects processed files over 4 MiB before upload, leaving room below Vercel's 4.5 MB request-body limit. The native client/new bucket accept processed photos up to 10 MiB. These photo limits do not change inspection-video duration or size settings. Source: https://vercel.com/docs/functions/limitations#request-body-size

## Actual verification and limits

- Isolated PostgreSQL: 36 core checks; 49 operations/active-Admin checks. Synthetic Auth and Storage metadata, not a real Supabase runtime.
- Edge handler/validation: 19 checks with mocked Auth/RPC/Storage.
- Next API proxy: 7 checks with mocked upstream.
- Production HTTP: 6 anonymous/denial checks; no financial or business writes.
- Native Test Mode: original Marketplace search and creation form opened; Admin workspace opened through Admin Center. See readiness screenshots and current checkpoint for later runtime results.
- Native photo file selection reached the actual `input[type=file]`, but the browser filechooser event could not be captured. No successful image upload is claimed from this attempt. Physical photo/video testing and real-account cross-user media testing remain required.
- Website Preview deployment previously failed `build-rate-limit`; verify the current commit's deployment rather than assuming push equals deployment.

## Legal and operational decisions before public launch

These are approval items, not a declaration of legal compliance:

- Approve seller terms, commercial-provider disclosures, report-use permission wording, moderation/appeal process and privacy notice.
- Approve purpose-specific retention periods and lawful bases for listings, proof references, conversations and audit records. No indefinite retention assumption and no automatic purge have been enabled.
- Approve handling of account closure and seller identity minimization. Existing reports, attribution and financial records must not be automatically deleted.
- Approve public listing-photo use separately from private inspection-media rights. A report is evidence of the recorded inspection, not a guarantee of ownership or complete current vehicle condition.
- German field labels have stable keys; full translation coverage beyond the existing German V1 copy has not been verified.

## Rollback / containment

Use `docs/sql/marketplace-containment-rollback.sql` to revoke access to the new module while retaining its records. Keep the publication guard and private bucket. Restore the prior FlutterFlow navigation/website revision and the saved Edge source only where that does not reopen a confirmed vulnerability. Do not drop tables, buckets, original reports or Auth accounts. Original backups remain untouched. Full operational Supabase restoration is not claimed.
