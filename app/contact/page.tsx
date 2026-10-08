import { pageMetadata } from "@/content/page-metadata";
import Image from "next/image";
import { EstimateForm } from "@/components/estimate-form";
import { PageIntro } from "@/components/page-intro";
import { projects } from "@/content/projects";
import { business } from "@/content/site";

export const metadata = pageMetadata("/contact", {
  title: "Contact",
  description:
    "Request a masonry color consultation from Masonry Color Corrections LLC or call (513) 612-8421.",
});

const contactFaqs = [
  {
    question: "Can you match new brick to an older wall?",
    answer: "MCC reviews replacement brick and additions after construction is complete, then mixes and tests colors against the surrounding masonry. The material, existing finish, and amount of color change determine whether staining is a good fit.",
  },
  {
    question: "What should I include in my request?",
    answer: "Include the project location and a short description of the mismatch. If you have photos, send a wide view and a few close-ups showing the brick, mortar, and surrounding material.",
  },
  {
    question: "Do you repair or rebuild the masonry?",
    answer: "No. A mason or builder handles structural repairs and construction first. MCC handles the color matching and staining of the installed material afterward.",
  },
  {
    question: "What happens after I request an estimate?",
    answer: "MCC reviews your project details and gets in touch by phone or email, usually within two business days, to discuss fit and next steps. Estimates are free.",
  },
];

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
      <section className="faq-section shell" aria-labelledby="contact-faq-title">
        <div className="faq-heading">
          <h2 id="contact-faq-title">Common questions</h2>
          <p>A few answers to help you plan the next step.</p>
        </div>
        <div className="faq-list">
          {contactFaqs.map((faq, index) => (
            <article key={faq.question}>
              <span aria-hidden="true">0{index + 1}</span>
              <div>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
