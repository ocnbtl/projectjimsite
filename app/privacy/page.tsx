import { pageMetadata } from "@/content/page-metadata";
import { AnalyticsPreferencesButton, AnalyticsTestingStatus } from "@/components/analytics-consent";
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
        <h2>Optional analytics</h2>
        <p>
          With your permission, MCC uses PostHog to collect limited website usage and performance
          information, including recordings of how pages are used. Form inputs are masked in
          recordings. Estimate details, contact information, and uploaded photos are excluded.
          Your choice and an anonymous site identifier may be stored in your browser. See PostHog’s{" "}
          <a href="https://posthog.com/privacy" rel="noreferrer" target="_blank">
            privacy practices
          </a>
          .
        </p>
        <p>
          With your permission, Cloudflare Web Analytics also measures page views, visits, referring
          websites, country-level location, device and browser types, and page performance. It does
          not use analytics cookies or record your form entries. See Cloudflare’s{" "}
          <a href="https://www.cloudflare.com/privacypolicy/" rel="noreferrer" target="_blank">
            privacy practices
          </a>
          .
        </p>
        <p>
          You can accept or decline analytics and change your choice at any time.
        </p>
        <p>
          With your permission, Google Analytics measures page visits, scroll engagement, estimate
          form starts, confirmed estimate requests, and clicks on our phone and email links. It uses
          a browser cookie with a lifetime of up to 90 days. We do not send your form entries,
          contact details, photos, or full URL query strings. Advertising personalization and Google
          signals are disabled. A phone or email click does not mean a conversation or job took place.
          See Google’s <a href="https://policies.google.com/privacy" rel="noreferrer" target="_blank">privacy policy</a>.
        </p>
        <AnalyticsPreferencesButton className="privacy-choice-button" />
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
