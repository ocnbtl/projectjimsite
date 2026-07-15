import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProjectPair } from "@/components/project-pair";
import { projects } from "@/content/projects";
import { services } from "@/content/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Masonry color matching and staining services for repairs, additions, brick, fireplaces, stone, and mortar in the Cincinnati area.",
};

const serviceProjects = [projects[0], projects[3], projects[2]];

const serviceSituations = [
  ["Replacement brick", "Patched openings", "New additions"],
  ["Broad color shifts", "Faded or inconsistent tones", "Exterior masonry updates"],
  ["Fireplaces and chimneys", "Stone accents", "Mortar color differences"],
];

const faqs = [
  {
    question: "What should I send with an estimate request?",
    answer:
      "Send the project location, one or two wide views, close-ups of the mismatch, and a short description of what changed. Photos from normal viewing distance help show how the area relates to the whole surface.",
  },
  {
    question: "Is color correction the same as painting masonry?",
    answer:
      "No. Paint creates a continuous surface layer. Color correction and staining are considered more selectively in relation to the material, its absorbency, existing coatings, and the variation that is already present.",
  },
  {
    question: "Can MCC review interior and commercial projects?",
    answer:
      "Yes. MCC welcomes residential and commercial inquiries for confirmed interior and exterior masonry color work. Photos are the best first step for determining whether the surface and project are a fit.",
  },
  {
    question: "Will every masonry surface accept the same approach?",
    answer:
      "No. Material type, porosity, previous coatings, current condition, and the amount of change all matter. MCC reviews those factors before recommending a direction.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageIntro title="Color work built around the mismatch in front of you.">
        <p>
          The right approach depends on the material, the amount of change, previous coatings,
          and how the new work relates to the original masonry. Photos are the best place to
          start.
        </p>
        <Link className="button" href="/contact">
          Request an estimate <span aria-hidden="true">→</span>
        </Link>
      </PageIntro>

      <section className="service-detail-list shell" aria-label="Masonry color services">
        {services.map((service, index) => (
          <article className="service-detail" key={service.number}>
            <div className="service-detail-copy">
              <span>{service.number}</span>
              <h2>{service.title}</h2>
              <p>{service.detail}</p>
              <ul className="service-situations" aria-label="Common project situations">
                {serviceSituations[index].map((situation) => (
                  <li key={situation}>{situation}</li>
                ))}
              </ul>
              <Link className="text-link" href="/contact">
                Ask about this service <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="service-detail-media">
              <ProjectPair {...serviceProjects[index]} />
              <p>
                <span>Related MCC project</span>
                {serviceProjects[index].title}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="faq-section shell" aria-labelledby="faq-title">
        <div className="faq-heading">
          <h2 id="faq-title">A few useful things to know before you send photos.</h2>
          <p>
            Color work begins with context: the full surface, the material, and the difference
            that keeps drawing attention.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <article key={faq.question}>
              <span>0{index + 1}</span>
              <div>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="plain-cta shell">
        <h2>Not sure which service fits?</h2>
        <p>Send photos of the full area and the mismatch. MCC can help identify the next step.</p>
        <Link className="button" href="/contact">
          Start with photos <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
