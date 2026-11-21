# MCC privacy release — November 20, 2026

## Release coordinates

- Canonical site: https://masonrycolorcorrections.com/
- Provider/team/project: Vercel, `unigentamos/project-jimsite`.
- Production baseline: `c76cff5ce3c73008876acd24aa64c0c1e8e3b5c6`.
- Verified rollback: `dpl_5pn12LzAWLiNoxHJgCGHF9ciBz3V`, https://project-jimsite-lk24ef592-unigentamos.vercel.app/ . The baseline public homepage and immutable deployment had identical script asset lists.
- Prepared branch: `codex/mcc-privacy-live-20261120`.
- First hosted preview: `7e0780954e85143fb31d7ccd02a0a771010bb27a`, Ready at https://project-jimsite-mokmp8lor-unigentamos.vercel.app/ . This first preview is superseded by the subsequent fixes on the branch; do not promote it.
- Linx owns final push, current-preview verification, and production promotion. No production promotion is claimed by this document.

## Changes

- Removed the global popup. The conspicuous footer link goes directly to `/privacy#privacy-choices`.
- Added independent analytics, heatmap, and masked-recording switches with immediate same-tab and storage-event/cross-tab synchronization.
- Browser GPC/DNT and server `Sec-GPC`/`DNT` take precedence over explicit stored grants. No SDK starts while the server eligibility check is pending or unavailable. Previous declines are retained. The older v1 grant is not treated as permission to add Google Analytics.
- Collection also stays off when browser storage cannot save a withdrawal. A temporary first-party preference-storage probe contains no visitor identifier.
- Five public paths are eligible: `/`, `/services`, `/masonry-staining`, `/gallery`, `/about`. Contact, privacy, office/private/admin, unknown paths, query strings, and fragments are excluded.
- A navigation guard pauses replay/heatmaps before History changes an address. Capture can restart on an eligible public destination; blocked addresses cannot enter a buffer and later flush on return to a public page.
- The PostHog transport guard is installed **before** dynamically importing the SDK, which caches network references. Permissions are rechecked when fetch/XHR/beacon actually sends, including retries and `Request` bodies. Both the real `$$heatmap` event and PostHog's `{api_key, batch:[...]}` envelope are recognized.
- Replay retains an exact allowlist of already-public text and attributes. Unrecognized text/attributes are masked before serialization; forms, inputs including hidden/file inputs, editable elements, iframe/media/canvas, and privacy controls are blocked. Console, network bodies/headers, and network capture are disabled. The pinned SDK's compressed replay fields must be decompressed recursively during payload inspection.
- Google transmits only explicitly marked MCC public events with approved event names, page titles, URL fields, and categorical properties. Raw automatic vendor hits, arbitrary titles/properties, queries, and private referrer/search terms are rejected. Ad consent remains denied; Google signals remain off. Contact-page form/lead browser events are intentionally excluded under the requested form exclusion.
- Cloudflare's optional browser beacon is no longer initialized, and its script/collection hosts are removed from CSP. Existing hosting/CDN aggregate operational counts remain. Turnstile and consultation delivery are unchanged. Vercel's dashboard showed Speed Insights disabled and Web Analytics without data; source and baseline bundles had no Vercel browser analytics tags. Cloudflare's installation was confirmed as manual snippet only by Linx.

## Geographic scope and reasons

The launch policy is `us-public-v2`, without a new environment variable. It uses Vercel's country/state headers only on Vercel, with private/no-store responses varying on location and privacy-signal headers. A missing or invalid state is not treated as an unrestricted US location. The response exposes the coarse policy jurisdiction, never an IP address.

| Visitor location | Analytics / heatmaps | Replay |
|---|---|---|
| Recognized US state or DC | On by default, subject to saved choices, signals, storage and path checks | On by default except the states below |
| CA, FL, IL, MD, MT, NH, NV, PA, WA | Same public analytics / heatmap policy | Prior explicit choice |
| Non-US or unknown | Prior explicit choice | Prior explicit choice |

The recording exceptions are a conservative engineering policy for third-party recording/interception risk, **not** a statement that every masked public-page replay is illegal in these states. They apply to replay, rather than disabling all public analytics. Specific sources:

- **California:** [Javier v. Assurance IQ, Ninth Circuit memorandum](https://cdn.ca9.uscourts.gov/datastore/memoranda/2022/05/31/21-16351.pdf) addresses prior consent to third-party website recording. It is a nonprecedential memorandum involving form data; MCC excludes forms and still chooses prior-choice replay here.
- **Florida:** [F.S. 934.03](https://www.leg.state.fl.us/Statutes/index.cfm?App_mode=Display_Statute&URL=0900-0999/0934/Sections/0934.03.html), including the all-parties consent provision for interception of wire/oral/electronic communications.
- **Illinois:** [720 ILCS 5/14-2(a)(3)](https://www.ilga.gov/legislation/ilcs/fulltext?DocName=072000050K14-2), concerning surreptitious recording of private electronic communications by a nonparty. The website/vendor party classification is the bounded risk motivating this replay exception.
- **Maryland:** [Courts and Judicial Proceedings §10-402(c)(3)](https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcj&section=10-402), prior consent of all parties to covered communications.
- **Montana:** [MCA 45-8-213(3)](https://mca.legmt.gov/bills/mca/title_0450/chapter_0080/part_0020/section_0130/0450-0080-0020-0130.html), electronic interception and the warning exception. MCC chooses an explicit recording choice rather than assuming a footer notice was seen.
- **New Hampshire:** [RSA 570-A:2](https://gc.nh.gov/rsa/html/LVIII/570-A/570-A-2.htm), interception/recording and prior-consent restrictions.
- **Nevada:** [NRS 200.620](https://www.leg.state.nv.us/nrs/nrs-200.html#NRS200Sec620), restrictions and limited exceptions for interception of wire communications. This is a conservative recording-risk exception, not a conclusion about every web interaction.
- **Pennsylvania:** [18 Pa.C.S. §5704(4)](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/18/00.057.004.000..HTM), prior consent of all parties for covered wire/electronic/oral interception.
- **Washington:** [RCW 9.73.030](https://app.leg.wa.gov/RCW/default.aspx?cite=9.73.030), consent for recording/transmission of covered private communications and conversations.

All non-US traffic follows an explicit-choice policy. This is an intentional conservative rollout scope, not a claim that every non-US jurisdiction legally requires it. EEA/UK rules concerning nonessential storage and [Google's EU user consent policy](https://www.google.com/about/company/user-consent-policy/) are concrete reasons to retain a prior-consent path internationally. No location is inferred from language, time zone, proximity to Cincinnati, or the absence of a known restriction. Broadening the non-US default would require a distinct, documented policy decision.

## Verification and limits

- TypeScript and ESLint pass on the reviewed source; focused privacy tests cover headers, deferred eligibility, previous choices, unavailable storage, sensitive routes, batch envelopes, heatmap-only mode, queued transport, Google hit validation, and pre-History pause order.
- Consultation regression tests use a mocked email provider and synthetic photos. No real estimate/email was submitted. Navigation and property-selection regressions pass.
- Actual PostHog 1.444.0 and Google's script were exercised in an isolated local SDK fixture. Public markup came from the production public homepage; source modules were transpiled directly, with only local host/HTTPS gates adjusted. Vendor configuration and geographic eligibility were synthetic. Collection was diverted to localhost, with CSP independently preventing direct external collection.
- Recursively decoded desktop and mobile replay payloads retained public copy and omitted body-text, attribute, form, hidden-field, upload, console, and network canaries. Heatmaps and analytics emitted genuine SDK packets. Independent choices, cross-tab updates, reload persistence, GPC and DNT were observed. Recordings require a visible page; the mobile test was repeated after showing the browser.
- Failure/retry-after-withdrawal verification uses simulated collector HTTP 503s in that same isolated fixture; final observations are recorded separately in the QA artifacts.
- Local full Next builds encountered Windows directory/junction permission failures. Compile-only mode once produced a runnable local server; it is not a full build pass. The Next CLI also emitted an upgrade advisory. Dependencies were not changed in this scoped release. The superseded hosted preview built successfully on Vercel; the final SHA still needs its own provider build and smoke check.
- Hosted preview domains and automated browsers intentionally do not contribute production events. A hosted payload test must intercept all collection and route the canonical public hostname to the preview, or use the provided isolated SDK fixture. A successful UI preview alone does not prove production analytics delivery.
- Production-only `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` / `NEXT_PUBLIC_POSTHOG_HOST` and the existing GA web stream must be checked for the target build without printing credentials or sending diagnostic leads. No new region variable is required. Verify actual `/api/analytics-eligibility` output, including jurisdiction and header-only GPC/DNT suppression, on the final hosted deployment.
- Public replay text/attribute values are exact allowlists. Regenerate/review them when public content or rendering changes; new unknown values remain masked. Public stylesheet URLs are retained for layout, so asset retention affects later playback fidelity.

## Safe commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
node --test scripts/google-analytics.test.mjs scripts/page-transitions.test.mjs scripts/consultation.test.mjs scripts/property-type-select.test.mjs
```

`scripts/privacy-sdk-fixture.mjs` is local QA only; it must not be exposed publicly. Start it in this checkout, then use the visible controls at `http://127.0.0.1:3111/`. All collector traffic is intercepted locally. Use Fresh, then test public clicks, canaries, independent switches, multiple tabs, GPC/DNT, query/contact routes, and simulated collector failures before withdrawal. Report packets recursively decodes the recorder compression and saves the inspected evidence. No real form submission is necessary.

For a read-only hosted HTML/SEO smoke test, set `SEO_TEST_BASE_URL` to the verified immutable preview URL and run `node --test scripts/seo.test.mjs`. This fetches HTML without executing browser analytics. It does not replace the intercepted browser payload matrix.

## Promotion disposition

Source is prepared for Linx's final hosted verification. Do not treat this document, a local compile, or the first preview as production signoff. Promote only the reviewed final commit after its own hosted build, geography, privacy-control, payload, retry, and route tests pass. Retain the verified baseline deployment above for rollback. No credential, billing, advertising, or unrelated product changes are included.
