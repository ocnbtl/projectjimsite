# MCC Office initial release gate

Phase: POST-DEPLOYMENT VALIDATION. Mode: internal/admin system. Risk: HIGH (private finances, uploads, owner/crew permissions).
Canonical repository: Project Jimsite; branch main; public baseline a8da08b3400ddf6194fc17118cf928add4714b11. Office is a separate new Worker and D1 database, not a change to public-site hosting. Release owner: Ocean; business owner: Jim. October 9, 2026, America/New_York.

Scope: email-code owner/crew office, CRM/jobs, expenses, compressed receipt controls, mileage, invoice records, reviewed CSV import/export, settings, no paid services. Excluded: live accounting sync, OCR, payroll/banking, business email, passwords, recurring automation, real test records.

| Category | Criticality | Status | Evidence and remaining action | Owner |
|---|---|---|---|---|
| Scope/source | HIGH | PASSED | Canonical main baseline verified; preserve unrelated ads notes, brand outputs and audits. Production D1 is newly created 1824a77f-1cac-4903-942e-b24eb27f8f94. | Ocean |
| Function | CRITICAL | PASSED | 32 tests passed after deployment, including signed identities, owner/crew isolation, receipt failures/retries, 200-row resumed import, complete exports and ten-active-account insert/restore cap with rollback. | Engineering |
| Visual | MEDIUM | PASSED | Local receipt save and mobile preview at 390px, desktop 1280px; saved image loaded, zero horizontal overflow. Settings and synthetic CSV download checked; console errors/warnings empty. | Engineering |
| Accessibility | HIGH | PASSED | Native modal, labels, focus visibility, 44px controls, status/error announcements, reduced-motion CSS; keyboard/phone controls checked. No assistive-device certification claimed. | Engineering |
| SEO/discovery | HIGH | PASSED | Office noindex/nofollow/noarchive, disallow robots, Access authentication. Marketing SEO unchanged. | Engineering |
| Performance/resilience | HIGH | PARTIAL | Latest isolated signed-identity probe: visible 50 requests include upload steps 2–4ms, finish 3ms, download 4ms, three-row import 4ms and ten concurrent reads 1ms each. One synthetic owner, not ten distinct users; actual production OTP/JWKS first use still pending. Backup restored exactly. | Engineering |
| Security/privacy | CRITICAL | PASSED | RS256 issuer/audience/expiry checks, active DB membership and subject binding, owner-only finances, CSRF checks, private photo routes, no raw request logging, no client storage/analytics, strict CSP. Full npm audit zero advisories. Live anonymous root/API/photo requests each returned 302 to exact Access tenant. Actual signed owner session pending. | Engineering |
| Analytics/conversion | MEDIUM | NOT APPLICABLE | Explicitly no marketing analytics or session replay in private office. Save outcomes tested via stored synthetic records. | Ocean |
| Operations/recovery | HIGH | PASSED | OPERATIONS.md names operator and manual weekly export. Restored 210 synthetic expenses and nine photos; integrity/FK checks passed and 4,718,592 photo bytes match SHA-256. Not a scheduled backup. | Ocean |
| Deployment | CRITICAL | PASSED | Worker ff5a8e2b-2c36-43ac-9e64-35df2090bdd3 uploaded and custom-domain route deployed. HTTPS Access login visible. Dedicated D1 has all six migrations, exactly James/Ocean owners, zero business records. workers.dev and preview off. Public footer build passed. | Engineering |
| Content/authority | HIGH | PASSED | User explicitly approved exact hostname, Jim/Ocean owners, crew personal emails, free-only release. No fabricated client/financial records. | Ocean |
| Data integrity | CRITICAL | PASSED | Integer amounts, optimistic versioning, atomic small import batches, receipt replacement transaction/byte totals/checksums; empty production seed must contain only approved owners. | Engineering |

Current decision: protected empty deployment published for owner validation; NOT READY FOR BUSINESS RECORDS until real owner login and the authenticated production API are verified. No conditional risk has been accepted on the owner's behalf. Ocean was asked to sign in directly without sharing the code in chat. Crew live onboarding remains a later explicit-allowlist step.

Public site validation: production build passed; scoped application ESLint passed. Repository-wide lint reports five pre-existing require-import violations in untracked output/brand/export-original-logo.cjs, which was not modified or included. The independent office is checked by its own TypeScript build and Worker tests, not Next.js lint rules.

Rollback: first-release office can be taken offline by removing only its Worker custom-domain route; retain Access protection and D1 records. No public-site/domain-wide changes. Later versions can roll back Worker code without blindly undoing database migrations.

Observation: Ocean performs first real login; check role, empty records, API access, and sign-out. Engineering verifies anonymous access and alternate-host denial. No real OTP was sent by the agent and no recurring monitor was created.
