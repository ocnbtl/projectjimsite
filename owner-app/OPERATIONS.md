# MCC Office operations

Owner: Jim. Technical operator and escalation: Ocean. No paid plan or automatic upgrade is authorized.

## Before business use

Confirm both approved owners can sign in at the Access-protected office hostname. Confirm a personal-email crew account only sees assigned jobs and their own submissions before inviting actual crew. No shared codes. Keep original receipts on the device; this app stores a compressed copy.

## Backups and recovery

The app's CSV exports are for the accountant, not disaster recovery. The technical operator should export the dedicated production D1 database weekly during active use and before schema changes or migration. This is a manual procedure, not a scheduled service. Keep at least two dated copies outside the repository in encrypted/private storage. Never commit business backups or post signed export download URLs.

Using the production config, run `wrangler d1 export mcc-office --remote --config wrangler.production.jsonc --output <private-dated-path.sql>`. Confirm the database ID first. Exports can temporarily interrupt database queries; use a quiet period. The SQL contains all saved receipt BLOBs and records. It also contains private identities and access history and must be protected accordingly.

Restore only into a separate empty SQLite/D1 database first. Run integrity_check and foreign_key_check; compare record counts and receipt byte totals. Reassemble receipt_chunks in part order and compare SHA-256 hashes against the source. Do not overwrite production as a test. Reconnect a restored database only after a reviewed incident decision. On VPS migration, revoke Cloudflare sessions and replace authentication deliberately; do not silently reuse auth state as passwords.

Synthetic restore verified October 9, 2026: 210 expenses, nine receipt photos, 4,718,592 bytes, integrity OK, no foreign-key errors, all photo SHA-256 checksums matched. This proves the tested export/restore route, not a recurring backup schedule or a production restore.

## Capacity

- Ten active app accounts maximum; separately maintain exact-email Cloudflare Access policies and account-wide Free seat usage.
- 512 KiB per compressed photo, 32 KiB per transfer. One unfinished upload per member; expires after one hour and is removed on a subsequent upload start. Existing saved photos are never auto-deleted.
- 200 MiB saved-photo payload cap, with in-app warnings at 70% and 85%. Physical database size includes other tables and must be checked in D1; payload bytes are not total database size.
- Ten records per list/export page. Three imported CSV rows per request. A full file is resumable, not one giant transaction.
- Check Workers/D1 account-wide daily use and physical database size in Cloudflare. If Free quotas are exhausted, pause and retry after reset; never enable a paid fallback automatically.
- No R2 bucket, external OCR, accounting subscription, bank connection, payroll, or outbound business email is enabled.

## Release and rollback

Build and test from owner-app. Deploy only with wrangler.production.jsonc after confirming real D1 ID, exact Access app audience, issuer, and office origin. Keep workers.dev and preview URLs disabled. No local QA or probe entrypoint may be used for production.

For a broken application release, roll back to its preceding Worker version without rolling back the database blindly. For first launch, remove the office Worker custom-domain route to take the app offline, retain Access protection and D1 records, and investigate. Do not alter the public website apex/www routing or unrelated Cloudflare apps.

## Monitoring and privacy

Observe the first real owner session and receipt save, then review aggregate errors/CPU/requests after the first working day. Ocean owns investigation and reports actionable problems to Jim. No recurring monitoring automation has been created. Worker request logging is off to avoid retaining auth headers or private URLs; use aggregate metrics, structured in-app activity, and sanitized diagnostics. Never log receipts, financial fields, JWTs, cookies, codes, or raw request headers.

Disable departed crew in Team immediately, then remove their exact Access allowlist entry and revoke sessions in Cloudflare. Already viewed/downloaded information cannot be retracted. Keep private backups; do not use public file links for financial records.
