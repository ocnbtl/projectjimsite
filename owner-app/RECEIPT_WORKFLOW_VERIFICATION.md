# Receipt workflow implementation, October 9, 2026

State: PARTIALLY VERIFIED for release; receipt implementation locally verified. Not deployed. No real records, emails, provider changes, purchases, or production credentials used.

## Implemented

- One photo per expense, compressed in the browser to JPEG at most 512 KiB. Re-encoding removes camera metadata. The saved image is a compressed copy, not an archival full-resolution original.
- Input up to 25 MiB; JPEG/PNG/WebP picker. Preview, rotation before saving, readability confirmation, replacement, download, removal confirmation, and unsaved-change warning. Expense details remain editable through the existing Edit control. Cropping is explicitly delegated to the device Photos app; no in-app crop or OCR claim.
- Receipt manager accessible after adding an expense, in Money, job expenses, and crew recent expenses. Crew can view their own receipts but cannot change reviewed/void expenses. Owner can correct reviewed receipts. Void receipts remain read-only.
- D1 storage uses at most sixteen 32 KiB chunks per photo. A single bounded upload is committed transactionally with metadata and activity history. There is no staging/orphan reservation lifecycle to leak quota.
- Atomic expected-version guard prevents stale replacement/deletion. Transactions recheck active membership and current expense status. Failed replacement rolls back deletion of the previous receipt and quota counters.
- Hard 200 MiB receipt-payload cap, owner-only capacity display and in-app warnings at 70/85 percent. At maximum file size this is 400 photos; smaller images allow more. This is not the physical D1 database size, which includes metadata/index overhead.
- Application Wrangler configuration and local harness no longer bind R2. Old receipt metadata is preserved, but legacy R2 files require an explicit migration before release if any exist. No legacy provider files have been deleted.

## Local verification

`npm run build` and `npm test`: 20 tests passed, zero failures. Tests include maximum-sized image byte equality, sixteen chunk boundaries, oversize/unsupported rejection, anonymous and cross-crew denial, reviewed crew locks, account revocation, stale updates, simultaneous replacements, full-cap rollback, removal releasing space without deleting expense, and void-record guard enforcement. Existing financial import/record tests also pass.

Browser QA through the supported in-app browser, synthetic owner account and synthetic receipt only:

- Created expense through UI, selected photo, compressed to 83 KiB, rotated, confirmed readability, saved, reloaded, and verified persistence.
- Reopened from Money, checked removal warning and Keep photo cancellation, selected replacement, verified unsaved-close warning, kept editing, and saved replacement.
- Inspected final desktop 1280x900 and mobile 390x844 layouts. Mobile document width 390, dialog width 352, dialog scrollWidth/clientWidth both 335: no horizontal overflow. Dialog scroll is intentional for lower controls. Full photo uses contained preview, not a second scrolling pane.
- No captured browser warning/error logs. Browser-based deletion was not executed; actual removal and accounting-record retention are covered by the API tests.
- Screenshot evidence stored outside the repository in the thread visualization directory: receipt-mobile.png and receipt-desktop.png.

Not verified: real iOS/Android camera permissions or HEIC decoding, varied real-world photo legibility, offline persistence (unsaved photo stays in current page memory only), exhaustive browser coverage, production backups, or live Free CPU/physical database headroom. The synthetic preview server is not a production deployment.

## Password finding

The existing login is unchanged. Scrypt is a deliberately expensive password-hashing method, not a script the owner needs to run. Prior isolated Cloudflare measurements in tests/free-plan-probe/RESULTS-2026-10-09.md recorded 75 ms login CPU, above the published 10 ms Workers Free limit.

Additional local workerd compatibility probe (`node tests/password-feasibility.mjs`): native PBKDF2 SHA-256/600000 iterations succeeded at 150 ms local wall time; SHA-512/210000 succeeded at 60 ms. These are local elapsed times, not Cloudflare CPU measurements. They establish compatibility, not production Free-plan suitability. No hash algorithm or security work factor was weakened or changed.

Managed Cloudflare Access email PIN or an external identity provider keeps application-side password hashing out of the Worker. A Google/Microsoft sign-in uses that provider's existing credential, not a new MCC-specific password. A custom password flow remains possible with suitable hosting or a verified managed authentication service, but is not proven within the strict all-Cloudflare Free design.

Sources checked October 9, 2026:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
- https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## Release gates still open

Finalize and implement managed authentication with owner/crew authorization; retest request CPU including full-size receipt upload/download and bounded imports on isolated Free infrastructure; verify actual D1 physical headroom and account-shared usage; validate recovery/backups and original migration if needed. No guarantee of zero-cost production readiness follows from these local tests. A production launch gate is required before publication.
