import type { Metadata } from "next";
import { EstimateForm } from "@/components/estimate-form";
import { MaterialStudy } from "@/components/material-study";
import { PageIntro } from "@/components/page-intro";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a masonry color consultation from Masonry Color Corrections LLC or call (513) 612-8421.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro title="Start with the mismatch.">
        <p>
          Tell us where the project is, what changed, and what you want to look more consistent.
          Photos from close up and normal viewing distance help MCC understand the material and
          surrounding color. Residential and commercial projects are welcome.
        </p>
      </PageIntro>
      <section className="contact-page-grid shell">
        <div className="contact-direct">
          <MaterialStudy compact labels={false} />
          <div>
            <h2>Prefer to call or email?</h2>
            <a href={business.phoneHref}>{business.phoneDisplay}</a>
            <a href={business.emailHref}>{business.email}</a>
            <p>{business.locationContext}</p>
            <p>{business.serviceArea}</p>
          </div>
        </div>
        <div className="contact-form-panel standalone-form">
          <h2>Request a project consultation</h2>
          <p>
            Share the mismatch, project location, and photos. The temporary preview opens an email;
            direct delivery will replace it when the MCC inbox is connected.
          </p>
          <EstimateForm />
        </div>
      </section>
    </>
  );
}
