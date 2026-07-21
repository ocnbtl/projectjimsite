import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProjectPair } from "@/components/project-pair";
import { projects } from "@/content/projects";
import { services } from "@/content/site";
import styles from "./services.module.css";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Post-construction masonry color matching and staining for additions, repairs, brick, mortar, and specialty installed materials in the Cincinnati area.",
};

const serviceProjects = [projects[0], projects[3], projects[2]];

const serviceSituations = [
  ["Replacement brick", "Completed wall repairs", "New additions"],
  ["Broad color shifts", "Mismatched brick batches", "Exterior masonry updates"],
  ["Mortar and grout", "Ceramic architectural accents", "Select installed surfaces"],
];

const faqs = [
  {
    question: "What should I send with an estimate request?",
    answer:
      "Helpful photos make it easier to understand the project before we follow up. If you have them, include one or two wide views, a few close-ups, the project location, and a short description of what changed.",
  },
  {
    question: "Is color correction the same as painting masonry?",
    answer:
      "No. Paint creates a continuous surface layer. Color correction and staining are considered more selectively in relation to the material, its absorbency, existing coatings, and the variation that is already present.",
  },
  {
    question: "Can MCC review interior and commercial projects?",
    answer:
      "Yes. MCC welcomes residential and commercial inquiries for interior and exterior color work. Each review considers the installed material, existing finish, viewing distance, and overall scope.",
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
      <PageIntro title="Color correction begins where masonry construction ends.">
        <p>
          MCC does not build walls, lay brick, or perform structural repairs. A mason or builder
          completes that work first; MCC then handles the specialized color stage when the new
          material does not match what is already there.
        </p>
        <Link className="button" href="/contact">
          Request an estimate <span aria-hidden="true">→</span>
        </Link>
        <Link className="text-link" href="/masonry-staining">
          See exactly what MCC does <span aria-hidden="true">→</span>
        </Link>
      </PageIntro>

      <section
        className={`service-detail-list shell ${styles.serviceList}`}
        aria-label="Masonry color services"
      >
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
            <div className={`service-detail-media ${styles.serviceMedia}`}>
              <ProjectPair
                {...serviceProjects[index]}
                priority={index === 0}
                variant={
                  serviceProjects[index].orientation === "portrait" ? "gallery" : "service"
                }
              />
            </div>
          </article>
        ))}
      </section>

      <section className="faq-section shell" aria-labelledby="faq-title">
        <div className="faq-heading">
          <h2 id="faq-title">A few useful things to know before you send photos.</h2>
          <p>
            Color work begins with context: the full installed surface, the material, and the
            difference drawing the attention.
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
        <h2>
          <span className={styles.ctaLine}>Not sure which</span>
          {" "}
          <span className={styles.ctaLine}>service fits?</span>
        </h2>
        <p>Send photos of the full area and the mismatch. MCC can help identify the next step.</p>
        <Link className="button" href="/contact">
          Start with photos <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
