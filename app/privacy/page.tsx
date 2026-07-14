import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageIntro title="Privacy">
        <p>This working policy will be finalized with the production form and analytics setup.</p>
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
          The current website preview opens your email application rather than storing form data on
          the website. Your email provider’s privacy practices apply to the message and attachments.
        </p>
        <h2>Production update</h2>
        <p>
          Before launch, this policy will be updated to identify the selected form provider,
          retention practices, analytics tools, and contact method for privacy requests.
        </p>
      </article>
    </>
  );
}
