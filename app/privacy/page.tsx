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
        <h2>Email-based estimate requests</h2>
        <p>
          The estimate form opens your email application rather than uploading or storing the form
          entry and photos on this website. Review the message, attach any selected project photos,
          and send it when you are ready. Your email provider’s privacy practices apply to the
          message and attachments.
        </p>
        <h2>Changes to this notice</h2>
        <p>
          This notice may be updated if the website later adds a secure form provider, analytics,
          or other services that change how information is collected or processed.
        </p>
        <h2>Questions</h2>
        <p>
          Privacy questions can be sent to contact@masonrycolorcorrections.com.
        </p>
      </article>
    </>
  );
}
