import type { Metadata } from "next";
import Image from "next/image";
import { EstimateForm } from "@/components/estimate-form";
import { PageIntro } from "@/components/page-intro";
import { projects } from "@/content/projects";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a masonry color consultation from Masonry Color Corrections LLC or call (513) 612-8421.",
};

export default function ContactPage() {
  const entryProject = projects[4];

  return (
    <>
      <PageIntro title="Start with the mismatch.">
        <p>
          If the material is already installed and the remaining problem is color, tell us where
          the project is, what changed, and what you want to look more consistent. Photos from
          close up and normal viewing distance help MCC understand the material and surrounding
          color. Residential and commercial projects are welcome.
        </p>
      </PageIntro>

      <section className="contact-page-grid shell">
        <aside className="contact-direct" aria-label="Direct contact information">
          <div className="contact-direct-image">
            <Image
              src={entryProject.after}
              alt={entryProject.afterAlt}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 42vw"
            />
            <p>
              <span>Completed MCC project</span>
              {entryProject.title}
            </p>
          </div>
          <div className="contact-direct-copy">
            <p className="contact-method-label">Email</p>
            <a href={business.emailHref}>{business.email}</a>
            <h2>Prefer to call?</h2>
            <a href={business.phoneHref}>{business.phoneDisplay}</a>
            <p>{business.locationContext}</p>
            <p>{business.serviceArea}</p>
          </div>
        </aside>

        <div className="contact-form-panel">
          <h2>Request a project consultation</h2>
          <p>
            Share a short description, project location, and a few useful photos. That context
            helps MCC respond quickly with a free estimate, usually within two business days.
          </p>
          <EstimateForm />
        </div>
      </section>
    </>
  );
}
