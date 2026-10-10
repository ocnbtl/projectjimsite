import { pageMetadata } from "@/content/page-metadata";
import Image from "next/image";
import { EstimateForm } from "@/components/estimate-form";
import { PageIntro } from "@/components/page-intro";
import { projects } from "@/content/projects";
import { business } from "@/content/site";
import { contactFaqs } from "@/content/contact-faqs";
import { siteUrl } from "@/content/site-url";

export const metadata = pageMetadata("/contact", {
  title: "Contact",
  description:
    "Request a masonry color consultation from Masonry Color Corrections LLC or call (513) 612-8421.",
});

export default function ContactPage() {
  const entryProject = projects[4];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${siteUrl}/contact#faq`,
        url: `${siteUrl}/contact`,
        about: { "@id": `${siteUrl}/#business` },
        mainEntity: contactFaqs.map((faq) => ({
          "@type": "Question", name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }).replace(/</g, "\\u003c") }} />
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
            <a className="contact-phone" href={business.phoneHref}>{business.phoneDisplay}</a>
            <div className="contact-service-area">
              <p>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{business.locationContext}</span>
              </p>
              <p>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                  <path d="M12 12h.01M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M22 13a18.15 18.15 0 0 1-20 0" />
                  <rect width="20" height="14" x="2" y="6" rx="2" />
                </svg>
                <span>{business.serviceArea}</span>
              </p>
            </div>
          </div>
        </aside>

        <div className="contact-form-panel">
          <h2>Request a project consultation</h2>
          <p>
            Share a short description, project location, and a few useful photos. That context
            helps us respond quickly with a free estimate, usually within two business days.
          </p>
          <EstimateForm />
        </div>
      </section>
      <section className="faq-section contact-faq-section shell" aria-labelledby="contact-faq-title">
        <div className="faq-heading">
          <h2 id="contact-faq-title">Common questions</h2>
          <p>A few answers to help you plan the next step.</p>
        </div>
        <div className="contact-faq-grid">
          {contactFaqs.map((faq) => (
            <details className="contact-faq-item" key={faq.question}>
              <summary>
                <h3>{faq.question}</h3>
                <span className="contact-faq-toggle" aria-hidden="true" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
