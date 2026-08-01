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
        <h2>Changes to this notice</h2>
        <p>
          This notice may be updated if the website changes its form-delivery service or later adds
          analytics or other services that change how information is collected or processed.
        </p>
        <h2>Questions</h2>
        <p>
          Privacy questions can be sent to contact@masonrycolorcorrections.com.
        </p>
      </article>
    </>
  );
}
