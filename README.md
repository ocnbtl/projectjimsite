# Project Jimsite

Internal working project for the Masonry Color Corrections LLC website. “Project Jimsite” is not client-facing copy.

## Current status

Phase 1 research and strategy is complete. The responsive Next.js website is now scaffolded with production routes for Home, Services, Gallery, About, Contact, and Privacy. The July 14, 2026 build includes the approved minimal editorial direction, confirmed business details, local-search foundations, and a photo-enabled consultation form interface.

Five original MCC before-and-after project sets are now integrated across the homepage, gallery, and social-sharing metadata. The repository preserves the supplied JPEGs byte-for-byte; responsive framing is handled by the website without editorial retouching.

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

## Delivery path

1. Replace the placeholder email and testimonial content when the client approves them.
2. Connect secure form delivery with image attachments to the future Google Workspace inbox.
3. Complete final accessibility, device, and content approval QA.
4. Connect the domain, deploy, submit search properties, and complete launch QA.
