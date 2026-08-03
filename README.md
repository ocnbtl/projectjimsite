# Project Jimsite

Internal working project for the Masonry Color Corrections LLC website. “Project Jimsite” is not client-facing copy.

## Current status

Phase 1 research and strategy is complete. The responsive Next.js website now includes production routes for Home, Services, Gallery, About, Contact, and Privacy. The July 14, 2026 redesign establishes the approved masonry-first editorial direction, confirmed business details, local-search foundations, and a photo-enabled consultation form interface.

Five original MCC before-and-after project sets are now integrated across the homepage, gallery, and social-sharing metadata. The repository preserves the supplied JPEGs byte-for-byte; responsive framing is handled by the website without editorial retouching.

The `main` branch deploys to the connected Vercel project. The consultation form posts directly to a server route and includes up to five project photos. Production contains the required Resend environment configuration, and the form reports success only after the provider confirms delivery. A separately authorized live submission is still required whenever recipient delivery needs to be reverified.

Optional PostHog analytics are consent-first. Before a visitor accepts, PostHog is not initialized. After acceptance, MCC records anonymous page and bounded interaction events, web vitals, heatmaps, dead clicks, and privacy-protected session replay. All replay text and inputs are masked; the estimate form and photo upload area are blocked entirely; console logs, network bodies and headers, canvas content, and cross-origin frames are excluded. Consented PostHog traffic uses the same-origin `/mcc-route` relay so browser privacy tools do not selectively drop replay while allowing other events. Visitors can change their choice through the footer or privacy page.

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
CONTACT_FROM_EMAIL=MCC Website <website@masonrycolorcorrections.com>
```

Preview deployments stay `noindex`; setting the final URL enables the production canonical URLs, sitemap, and indexing rules.

## Delivery path

1. Keep the Google Workspace inbox, Resend sending domain, and three server-only form-delivery values under the approved client/provider ownership model.
2. Use an authorized, clearly labeled live request only when recipient delivery must be verified; do not submit a real lead as routine smoke testing.
3. Complete the client's final content and project-photo approval.
4. Maintain the custom domain and `NEXT_PUBLIC_SITE_URL`, then complete ongoing search-console and launch follow-up QA.
