import { pageMetadata } from "@/content/page-metadata";
import { AnalyticsConsentSettings, AnalyticsTestingStatus } from "@/components/analytics-consent";
import { PageIntro } from "@/components/page-intro";

export const metadata = pageMetadata("/privacy", {
  title: "Privacy",
  description: "How Masonry Color Corrections LLC handles estimate requests, photos, and optional website analytics.",
});

export default function PrivacyPage() {
  return (
    <>
      <PageIntro route="/privacy" title="Privacy">
        <p>How MCC handles information provided through this website.</p>
      </PageIntro>
      <article className="legal-copy shell">
        <h2>Information you send</h2>
        <p>
          Information and photos submitted through the estimate form are used to review and respond
          to your request. Submissions are relayed by email and are not stored in the website’s own
          database. Email providers may process and retain them.
        </p>
        <h2>Hosting and aggregate traffic counts</h2>
        <p>
          Our hosting provider, Vercel, processes requests to deliver and protect this website.
          We can view aggregate server/CDN request totals, including requests made when optional
          analytics are declined. These counts do not add analytics cookies, session recordings,
          or a browser tracking script. They include automated traffic and requests for images
          and other files, so they are not counts of individual people or confirmed leads.
        </p>
        <p>
          The hosting provider may process standard request information, including IP addresses,
          for delivery, security, and operations. We do not add a separate visitor identifier or
          customer-information database for these aggregate counts. See Vercel’s{" "}
          <a href="https://vercel.com/legal/privacy-policy" rel="noreferrer" target="_blank">privacy policy</a>.
        </p>
        <h2>Optional analytics</h2>
        <p>
          MCC uses PostHog for selected public-page interactions, heatmaps, and masked page recordings.
          Only approved public text and layout are readable in recordings. Other text is masked before
          transmission. Contact forms, uploads, privacy controls, private pages, and visits with URL
          queries or fragments are excluded. We do not collect console logs or network request data.
          Your choice and an anonymous site identifier may be stored in your browser. See PostHog’s{" "}
          <a href="https://posthog.com/privacy" rel="noreferrer" target="_blank">
            privacy practices
          </a>
          .
        </p>
        <p>
          Optional collection starts on for eligible public browsing. In locations covered by
          our prior-choice policy, it stays off until you enable it. Recordings also require an
          opt-in in states covered by our stricter recording policy, or when a US state is unknown.
          If your country is unknown, all optional collection stays off until you choose to enable it.
          You can turn each
          category on or off below. A previous decline,
          Global Privacy Control, Do Not Track, and staff testing exclusions take precedence over defaults.
        </p>
        <p>
          Changes apply immediately in this browser, including its other open tabs. They stop future
          collection; information already sent is not erased by changing a browser preference.
        </p>
        <p>
          When website analytics is enabled, Google Analytics measures public-page visits, scroll
          engagement, and selected links, including phone and email clicks. The contact page and
          its form are excluded from browser analytics. Google Analytics uses
          a browser cookie with a lifetime of up to 90 days. We do not send your form entries,
          contact details, photos, or full URL query strings. Advertising personalization and Google
          signals are disabled. A phone or email click does not mean a conversation or job took place.
          See Google’s <a href="https://policies.google.com/privacy" rel="noreferrer" target="_blank">privacy policy</a>.
        </p>
        <h2>Where optional information is processed</h2>
        <p>
          Google Analytics and PostHog may process the selected public-page usage information outside
          your country, including in the United States. Website analytics can include an anonymous
          browser identifier, device information, page visits, and selected clicks. Heatmaps and masked
          recordings are processed by PostHog. The provider privacy links above explain how to contact
          each provider and exercise your rights; you can also contact MCC using the address below.
        </p>
        <p>
          Turning a category on is a separate choice to send that category’s information to its providers,
          including for processing abroad. You can use this website without enabling any category and
          withdraw each choice below. For Brazil, MCC uses your consent for these optional tools.
        </p>
        <AnalyticsConsentSettings />
        <h2>Staff and testing</h2>
        <p>Staff and developers can exclude this browser from optional analytics. The setting remains on this browser until you change it.</p>
        <AnalyticsTestingStatus />
        <p><a href="/privacy?mcc_analytics=off">Exclude this browser from analytics</a>{" · "}<a href="/privacy?mcc_analytics=on">Remove this browser’s testing exclusion</a></p>
        <h2>Questions</h2>
        <p>
          Privacy questions can be sent to contact@masonrycolorcorrections.com. This notice may be
          updated when website practices change.
        </p>
      </article>
    </>
  );
}
