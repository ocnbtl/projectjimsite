# Project Jimsite

Internal working project for the Masonry Color Corrections LLC website. “Project Jimsite” is not client-facing copy.

## Current status

Phase 1 research and strategy is complete. The responsive Next.js website now includes production routes for Home, Services, Gallery, About, Contact, and Privacy. The July 14, 2026 redesign establishes the approved masonry-first editorial direction, confirmed business details, local-search foundations, and a photo-enabled consultation form interface.

Five original MCC before-and-after project sets are now integrated across the homepage, gallery, and social-sharing metadata. The repository preserves the supplied JPEGs byte-for-byte; responsive framing is handled by the website without editorial retouching.

The `main` branch deploys to the connected Vercel project. The consultation form posts directly to a server route and includes up to five project photos. The form reports success only after the email provider accepts the request. Provider acceptance does not confirm inbox delivery; a separately authorized live submission is required whenever recipient delivery needs to be verified.

Optional PostHog analytics are consent-first. Before a visitor accepts, PostHog is not initialized. After acceptance, MCC records anonymous page and bounded interaction events, web vitals, heatmaps, dead clicks, and privacy-protected session replay. Public page copy remains visible in replay, while every form input value is masked; console logs, network bodies and headers, canvas content, and cross-origin frames are excluded. Consented PostHog traffic uses the same-origin `/mcc-route` relay so browser privacy tools do not selectively drop replay while allowing other events. Visitors can change their choice through the footer or privacy page.

Consultation analytics record only that the form was started, whether photos were selected, and the delivery outcome. Contact details, project descriptions, filenames, and photo contents are never sent to PostHog.

The consultation form supports Cloudflare Turnstile when both Turnstile environment values are configured. The browser obtains a short-lived challenge token and the server validates it before calling Resend. The existing honeypot, same-origin validation, file limits, idempotency, and phone fallback remain in place.

## Project documents

- [Phase 1 research and strategy](docs/phase-1-research-strategy.md)
- [Client intake and asset checklist](docs/client-intake-checklist.md)
- [Launch content blueprint](docs/launch-content-blueprint.md)
- [Visual concept brief](docs/visual-concept-brief.md)
- [Confirmed client details](docs/client-confirmed-details-2026-07-14.md)

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

For a production-domain launch, configure:

```bash
NEXT_PUBLIC_SITE_URL=https://masonrycolorcorrections.com
RESEND_API_KEY=re_replace_with_resend_api_key
CONTACT_TO_EMAIL=contact@masonrycolorcorrections.com
CONTACT_FROM_EMAIL=MCC Website <website@send.masonrycolorcorrections.com>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=replace_with_turnstile_site_key
TURNSTILE_SECRET_KEY=replace_with_turnstile_secret_key
```

Preview deployments stay `noindex`; setting the final URL enables the production canonical URLs, sitemap, and indexing rules.

## Delivery path

### Estimate confirmation and analytics

The contact form displays an accessible thank-you panel only after the API returns
`accepted: true` following email-provider acceptance. This is not proof of inbox
delivery. Failed requests keep the entered details, and an unchanged retry reuses
its submission ID to avoid duplicate email sends. The security token is refreshed
after each network attempt.

The consent-based PostHog funnel uses the existing event names:
`consultation_form_started` → `consultation_request_submitted`.
Inspect `consultation_request_failed` separately by `failure_reason`; this now
includes browser validation, photo validation, and missing security checks.
No form text, contact details, or photos are added to these events. Query these
names rather than the report's proposed `estimate_form_*` names.

Run `node --test scripts/consultation.test.mjs` for isolated API regression checks.
For a local UI preview, run `node scripts/preview-consultation.mjs` and open
`http://127.0.0.1:3102/contact`. This fixture disables real analytics and Turnstile
and intercepts email-provider requests. No email is sent. Enter `LOCAL_FAILURE`
in the description to simulate rejection, then change it to test success.

### Production delivery

1. Keep the Google Workspace inbox, Resend sending domain, and three server-only form-delivery values under the approved client/provider ownership model.
2. Use an authorized, clearly labeled live request only when recipient delivery must be verified; do not submit a real lead as routine smoke testing.
3. Complete the client's final content and project-photo approval.
4. Maintain the custom domain and `NEXT_PUBLIC_SITE_URL`, then complete ongoing search-console and launch follow-up QA.
