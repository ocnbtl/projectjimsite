# Project Jimsite

Internal working project for the Masonry Color Corrections LLC website. “Project Jimsite” is not client-facing copy.

## Current status

Phase 1 research and strategy is complete. The responsive Next.js website now includes production routes for Home, Services, Gallery, About, Contact, and Privacy. The July 14, 2026 redesign establishes the approved masonry-first editorial direction, confirmed business details, local-search foundations, and a photo-enabled consultation form interface.

Five original MCC before-and-after project sets are now integrated across the homepage, gallery, and social-sharing metadata. The repository preserves the supplied JPEGs byte-for-byte; responsive framing is handled by the website without editorial retouching.

The `main` branch deploys to the connected Vercel project. The consultation form now posts directly to a server route and includes up to five project photos. Until the final domain, business inbox, and Resend environment values are configured, the form reports that online delivery is pending and directs the visitor to call; it never reports a false send.

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

1. Confirm the public business email and create the Google Workspace inbox.
2. Verify the sending domain in Resend, then add the three server-only form-delivery values shown above in Vercel.
3. Complete the client's final content and project-photo approval.
4. Connect the custom domain, set `NEXT_PUBLIC_SITE_URL`, and complete launch/search-console QA.
