# MCC measurement and review guide

Implemented 2026-11-01 for PostHog project 539730.

## Dashboards

- [Inquiries & Website Health](https://us.posthog.com/project/539730/dashboard/1943328): consented visitors, sessions, pageviews, same-session contact funnel, accepted estimates, contact intent, sources, pages and failure reasons.
- [Forms & Project Interest](https://us.posthog.com/project/539730/dashboard/1943347): send attempts versus acceptance, photos, comparisons, CTA placement, FAQs, and native page-level LCP/INP/CLS drill-downs.

Known staff/test filters are applied and queries are limited to MCC hosts. Older unlabeled testing cannot be retrospectively distinguished from customers. These are documented MCC definitions, not Data Catalog-governed metrics: the connected app lacks Data Catalog scopes.

## Event definitions

| Event | Meaning | Allowed custom properties |
| --- | --- | --- |
| consultation_form_started | First observed form edit or valid submission interaction after consent | none |
| consultation_submit_attempted | Prepared form is about to be sent to MCC's endpoint | property_type, photo_count |
| consultation_request_submitted | Endpoint confirms email-provider acceptance | confirmation=email_provider_accepted, property_type, photo_count |
| consultation_request_failed | Categorical form/preparation/security/delivery failure | failure_reason |
| consultation_photos_selected | Visitor selects photos | photo_count (0–5) |
| phone_link_clicked / email_link_clicked | Contact intention, never a confirmed lead | source_section |
| estimate_cta_clicked | Click on an explicitly labeled estimate link | placement, optional service_id, source_section |
| service_link_clicked | Click on an explicitly labeled service link | service_id, source_section |
| faq_opened | First opening of a particular FAQ per page visit | question_id |
| project_comparison_adjusted | Finished pointer/keyboard comparison adjustment | project_id, before_visibility_percent |
| page_scroll_depth | Once per page at 25%, 50%, 75% | percent_scrolled |
| $exception | Sanitized website error; repeated stacks deduplicated, maximum 10 per document | static message, known error category, public MCC asset locations |

Only explicitly allowed categorical values are forwarded. No form text, names, email addresses, telephone numbers, filenames, upload URLs or submission IDs enter custom analytics. Existing GA4 mappings and its accepted-lead rule are preserved; newly added engagement events are PostHog-specific.

## Privacy and accuracy

- Pending/declined consent loads no browser analytics; excluded staff/local/preview/private routes stay excluded. No declined activity is backfilled.
- URL queries and fragments are stripped, external referrers reduced to origin, unknown public paths normalized. Nested initial URL properties receive the same treatment.
- Only a finite allowlist of campaign source/medium labels is retained. Raw campaign names, terms and advertising click identifiers are excluded. Any future Ads campaign attribution requires an explicit privacy-safe design.
- Form inputs remain masked; photo previews/status content uses existing masking/block classes. Network bodies/headers, console recordings and canvas capture remain off.
- Replay startup respects remote sampling/triggers. IP anonymization and test-account filtering are enabled in MCC's project; unrelated toolbar domains were removed.
- PostHog, GA4 and aggregate server counts overlap and must not be added together. A cookie/browser ID is not necessarily a person; server requests are not unique visitors.
- Accepted estimates are not proof of inbox delivery, qualification, revenue or a booked job. Reconcile with Jim's actual inquiries.
- New CTA/FAQ/send-attempt/project-ID measurements have no pre-release baseline.

## Review workflow

Review the inquiry dashboard weekly. Inspect failure reasons first; ordinary validation errors are not outages. Compare contact-page visits with first edits and accepted estimates in the same session, then inspect a few masked replays. Use the three saved heatmaps (home/contact/gallery) at phone, tablet and desktop widths. Choose one improvement supported by evidence rather than A/B testing this small sample.

Existing native Core Web Vitals queries use p75 and Google's standard thresholds. Sparse consented observations do not establish a Search Console field-data pass. Keep indexing and indexing requests inside Google Search Console.

## Pending connections and delivery

Search Console requires the user to complete Google's authorization in the open PostHog connection tab. No credentials are pasted into chat. Connect only sc-domain:masonrycolorcorrections.com, web search, with daily incremental tables after discovering the connector schema; verify the first completed sync and totals before claiming a working import. No source has been created until that handoff completes.

Email recipients/schedule are pending. Two disabled, unsubscribed free-plan rules are saved: any delivery/response failure per hour (01a198ff-4a37-0000-746c-c42aafc09054) and browser errors in three or more sessions per hour (01a198ff-539c-0000-17a5-4b7bd1aad09c). They do not yet evaluate or notify. Weekly delivery must use a non-AI dashboard snapshot, send_test_now=false, and the user's confirmed destination/schedule. Do not send a real test email.

Private source-map uploading needs a PostHog error-tracking write credential in the production build environment; none is configured. Sanitized errors work without it, but stack frames remain minified. Do not expose public maps or reuse the public ingestion token for uploads. [Official source-map setup](https://posthog.com/docs/error-tracking/upload-source-maps/nextjs).

## Costs and validation

The organization was visibly on PostHog's free plan at setup. No credit card, paid add-on, AI summary, Replay Vision, experiment or Ads feature was enabled. Shared organization quotas still apply; reaching a free cap can stop collection. The setup uses three heatmap pages and existing dashboards.

Production build, TypeScript, scoped ESLint, and 94 regression tests pass, including consent transitions, test exclusion, form acceptance/rejection/network failure with mocked email, URL/exception sanitization, FAQ/CTA interactions, navigation, metadata and Markdown. Desktop/mobile contact UI was inspected without submitting. Repository-wide lint also scans an unrelated untracked logo-export script under output/; its five pre-existing CommonJS lint errors were left untouched.

Rollback: revert the website implementation commit and redeploy. Original PostHog settings/dashboard definitions are retained in output/posthog-implementation-backup-2026-11-01.json for reviewed restoration. Do not blindly overwrite later changes.

