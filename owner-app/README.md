# MCC Office

Private operations app, isolated from the public Next.js website and its analytics.
Cloudflare Worker, D1 (SQLite) with capped private receipt chunks, Cloudflare Access, React + Vite.

## Release status

Protected first release deployed October 9, 2026 at https://office.masonrycolorcorrections.com.
The dedicated production D1 database is migrated and contains only the two approved owners.
Worker version: ff5a8e2b-2c36-43ac-9e64-35df2090bdd3. Anonymous office/API/photo requests redirect to Access.
Do not use real customer/financial records until the release gate is complete.
The existing Zero Trust organization was verified on the Free plan on October 9, 2026.
Do not enable paid services. First real owner OTP login is still pending; see RELEASE-GATE.md.

## Design and access contract

- Mode: admin / operations control center. The job is the organizing unit.
- Audience: Jim and separate crew accounts, simple phone-friendly controls.
- Navigation: Today, Jobs, Customers (owner), Money (owner), Team (owner), Settings.
- Owner manages customer records, assignments, imports, exports, finances, users.
- Crew reads assigned job details and submits only their own expenses/mileage.
- All permissions enforced by server and current database membership, never UI alone.
- White canvas, gray rail, charcoal type, brick-red actions, 6px corners, 16px body.
- Empty-state first launch. No fabricated records, charts, totals, or testimonials.
- Dialog forms have visible labels, error/status text, keyboard focus, cancel and save.
- Every save awaits server confirmation. Retries must not silently duplicate records.
- Private files have no public URLs. Downloads recheck permissions, no-store responses.
- Auth validates Cloudflare-signed JWTs with the application audience and issuer, then checks active database membership and role on every private request. Plain email headers are not trusted.
- No passwords, public signup, automatic membership or automatic owner promotion. Legacy password modules are not imported by the deployed Worker entrypoint; legacy endpoints return 404.
- Jim and Ocean are explicitly approved owners. Crew accounts may use personal email. Jim's role does not automatically transfer to other addresses on his domain.
- No public signup, no analytics, no session replay, no private data in browser storage.
- Receipt upload is separate from extraction: no OCR provider or paid API enabled.
- Imports are reviewed CSV imports, not live Invoice Simple or QuickBooks synchronization.
- No bank connections, payroll, tax filing, invoicing email, or money movement.
- Monetary amounts stored in integer cents; mileage records retain odometer readings.
- Activity retains actor/action/resource references without storing private payload copies.
- Exportable SQLite schema and receipt bytes ease later VPS migration.

## Provider gate

The production config uses the dedicated D1 database 1824a77f-1cac-4903-942e-b24eb27f8f94.
Local defaults must never be published.
`wrangler.production.jsonc` records the verified Access issuer/audience and HTTPS origin;
workers.dev and preview URLs are disabled. The complete production hostname must remain
Access-protected. No public bypass policy and no alternative unprotected hostname.

Before launch: benchmark signed authentication, receipt operations and bounded imports
against Workers Free CPU limits; verify physical D1 growth against the per-database
limit (the 200 MiB receipt payload cap is not a physical SQLite file-size guarantee);
provision D1, apply migrations, then apply `setup/approved-owners.sql` to that database.
That setup file grants only the two user-approved addresses owner permissions. It is
not part of ordinary migrations and must not be applied to unrelated databases.
Configure the MCC custom domain only after these gates, then verify real owner login
and denial of anonymous/unapproved/crew access. No real email-code delivery was tested.

## Crew onboarding and offboarding

1. Jim adds the person's own email and name in Team. Personal email works.
2. Administrator adds that exact address to an MCC crew-only Cloudflare policy.
   Do not add a whole email domain or Everyone. The app database still enforces crew role.
3. Crew enters their email and the code delivered by Cloudflare; app permissions show
   assigned jobs and their own submissions only. This form does not send invitations.
4. Disable in Team at job end, remove from the MCC Access allowlist and revoke their
   Cloudflare session. Disabling blocks new private requests immediately; it cannot
   retract data already viewed or downloaded. Restoring requires a new signed token.
5. No email: Jim records their work, or they create their own mailbox. Never share codes.

## Verified Access configuration (October 9, 2026)

- Application: MCC Office, `6b3c6c97-eef6-44ea-8202-0271bd1f276f`.
- Hostname: `office.masonrycolorcorrections.com` only; custom domain and TLS deployed.
- Policy: MCC owners only, `722b5058-f09f-46d2-9082-e404c3eff0b4`.
- Exact allowlist: `james@masonrycolorcorrections.com`, `ocean@oceanbattelle.com`.
- One-time PIN only; 12-hour application session; HTTP-only and binding cookies, SameSite Lax.
- Other applications and policies were not changed. No purchase or plan upgrade.
- Local build and automated tests passed (latest counts in RELEASE-GATE.md). Tests use synthetic signed JWTs with no
  external network or email delivery. Desktop 1280 and phone 390 UI checks covered crew
  creation, settings, receipts and sign-out. Isolated network probe requests observed 1–4ms CPU
  for bounded uploads, downloads, imports and concurrent reads. This does not prove a live OTP/JWKS round trip.

## Sources

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://help.invoicesimple.com/en/articles/11664395-how-do-i-export-a-summary-of-my-invoices-or-expenses
