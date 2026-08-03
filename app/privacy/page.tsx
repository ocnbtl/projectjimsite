import type { Metadata } from "next";
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
          This website uses PostHog to measure anonymous page visits and a small set of website
          interactions, such as selecting project photos, successfully submitting an estimate
          request, or adjusting a before-and-after comparison. Analytics use an anonymous,
          non-persistent browser identifier. MCC does not intentionally send names, phone numbers,
          email addresses, project descriptions, locations, or uploaded photos to PostHog.
        </p>
        <p>
          PostHog may process limited technical information needed to provide analytics and error
          reporting under its own {" "}
          <a href="https://posthog.com/privacy" rel="noreferrer" target="_blank">
            privacy practices
          </a>
          .
        </p>
        <h2>Changes to this notice</h2>
        <p>
          This notice may be updated if the website changes its form-delivery, analytics, or other
          services in a way that changes how information is collected or processed.
        </p>
        <h2>Questions</h2>
        <p>
          Privacy questions can be sent to contact@masonrycolorcorrections.com.
        </p>
      </article>
    </>
  );
}
