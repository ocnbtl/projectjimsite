import type { Metadata } from "next";
import { AnalyticsPreferencesButton } from "@/components/analytics-consent";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageIntro title="Privacy">
        <p>
          This page explains how information is handled when you contact Masonry Color Corrections
          LLC through the current website.
        </p>
      </PageIntro>
      <article className="legal-copy shell">
        <h2>Information you choose to send</h2>
        <p>
          Contact details, project descriptions, locations, and photos are used to review and
          respond to estimate requests. Do not send sensitive personal information through the
          website.
        </p>
        <h2>Website estimate requests</h2>
        <p>
          When online delivery is available, the estimate form uploads the information and any
          selected photos to the website server, where they are validated and relayed to Masonry
          Color Corrections LLC through Resend, an email-delivery provider. The website does not
          save submissions in its own database. Resend and the receiving email provider may process
          and retain the message and attachments under their own privacy practices.
        </p>
        <p>
          If online delivery is unavailable or fails, the form reports that the request was not
          sent and directs you to call instead.
        </p>
        <h2>Website analytics</h2>
        <p>
          With your permission, this website uses PostHog to measure page visits, site performance,
          and a small set of website interactions, such as selecting project photos, successfully
          submitting an estimate request, or adjusting a before-and-after comparison. Optional
          analytics remain off until you select “Accept analytics.”
        </p>
        <p>
          If you accept, the browser stores your analytics choice, a random anonymous identifier,
          and session context in local storage so visits can be understood over time. MCC does not
          identify website visitors in PostHog and does not intentionally send names, phone
          numbers, email addresses, project descriptions, locations, filenames, or uploaded photos
          to PostHog.
        </p>
        <h2>Privacy-protected session replay</h2>
        <p>
          If you accept analytics, PostHog may create a privacy-protected replay of website
          navigation, scrolling, pointer movement, and clicks to help MCC find confusing or broken
          experiences. All page text and form inputs are masked. The entire estimate form and photo
          upload area are excluded from replay. Console logs, network request and response bodies,
          network headers, canvas content, and cross-origin frames are not recorded.
        </p>
        <p>
          PostHog also helps MCC understand anonymous paths, heatmaps, dead clicks, and web
          performance. Analytics may be retained in MCC’s PostHog project according to its account
          settings and are used only to maintain and improve the website. PostHog processes this
          limited technical and behavioral information under its own{" "}
          <a href="https://posthog.com/privacy" rel="noreferrer" target="_blank">
            privacy practices
          </a>
          .
        </p>
        <h2>Your analytics choice</h2>
        <p>
          You may accept or decline optional analytics when the website asks. You can change that
          choice at any time using the button below or “Privacy choices” in the footer. Declining
          stops future analytics and clears PostHog’s website analytics storage where supported.
        </p>
        <AnalyticsPreferencesButton className="privacy-choice-button" />
        <h2>Changes to this notice</h2>
        <p>
          This notice may be updated if the website changes its form-delivery, analytics, or other
          services in a way that changes how information is collected or processed.
        </p>
        <h2>Questions</h2>
        <p>Privacy questions can be sent to contact@masonrycolorcorrections.com.</p>
      </article>
    </>
  );
}
