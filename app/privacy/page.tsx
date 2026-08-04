import type { Metadata } from "next";
import { AnalyticsPreferencesButton } from "@/components/analytics-consent";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageIntro title="Privacy">
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
          information. Estimate details, contact information, and uploaded photos are excluded.
          Your choice and an anonymous site identifier may be stored in your browser. See PostHog’s{" "}
          <a href="https://posthog.com/privacy" rel="noreferrer" target="_blank">
            privacy practices
          </a>
          .
        </p>
        <p>
          You can accept or decline analytics and change your choice at any time.
        </p>
        <AnalyticsPreferencesButton className="privacy-choice-button" />
        <h2>Questions</h2>
        <p>
          Privacy questions can be sent to contact@masonrycolorcorrections.com. This notice may be
          updated when website practices change.
        </p>
      </article>
    </>
  );
}
