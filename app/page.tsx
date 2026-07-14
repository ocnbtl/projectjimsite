import Link from "next/link";
import { EstimateForm } from "@/components/estimate-form";
import { LocalBusinessSchema } from "@/components/local-business-schema";
import { MaterialStudy } from "@/components/material-study";
import { business, feedbackPlaceholders, processSteps, services } from "@/content/site";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <>
      <LocalBusinessSchema />
      <section className="hero shell">
        <div className="hero-copy">
          <h1>Make mismatched masonry belong.</h1>
          <p>
            Precision color mixing, staining, and matching for brick repairs, additions, chimneys,
            fireplaces, and masonry that no longer looks like part of the original work. Serving
            residential and commercial properties across the Cincinnati tri-state area.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/contact">
              Request a project consultation
            </Link>
            <a className="button button-secondary" href={business.phoneHref}>
              Call {business.phoneDisplay}
            </a>
          </div>
        </div>
        <MaterialStudy />
      </section>

      <section className="services-section shell" aria-labelledby="services-title">
        <div className="section-heading services-heading">
          <h2 id="services-title">Color solutions for the masonry in front of you.</h2>
          <p>
            Different mismatches call for different levels of correction. Start with the area that
            keeps catching your eye.
          </p>
        </div>
        <div className="service-bands">
          {services.map((service, index) => (
            <article className={`service-band service-band-${index + 1}`} key={service.number}>
              <span className="service-number">{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.short}</p>
              <div className="service-material" aria-hidden="true">
                <MaterialStudy compact labels={false} />
              </div>
            </article>
          ))}
        </div>
        <Link className="text-link" href="/services">
          Explore services <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="education-section shell" aria-labelledby="education-title">
        <div className="education-media">
          <MaterialStudy />
        </div>
        <div className="education-copy">
          <h2 id="education-title">Change the color without hiding the masonry.</h2>
          <p>
            Paint covers a surface with one continuous layer. Color correction takes a more
            selective approach, working with the visible texture and variation that give masonry
            its character.
          </p>
          <div className="comparison-row">
            <div>
              <h3>Paint covers</h3>
              <p>A surface layer can flatten the individual variation from brick to brick.</p>
            </div>
            <div>
              <h3>Color correction</h3>
              <p>Targeted shifts help the adjusted area relate to the masonry around it.</p>
            </div>
          </div>
          <Link className="text-link" href="/services">
            Understand the options <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="process-section shell" aria-labelledby="process-title">
        <div className="section-heading process-heading">
          <h2 id="process-title">A careful match begins with the masonry already there.</h2>
          <p>Each decision is made in relationship to the existing material and the full surface.</p>
        </div>
        <ol className="process-list">
          {processSteps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.feedbackSection} shell`} aria-labelledby="feedback-title">
        <div className={`section-heading ${styles.feedbackHeading}`}>
          <h2 id="feedback-title">The finished match should speak for itself.</h2>
          <p>
            Verified customer feedback and MCC project photography will be added here after client
            approval.
          </p>
        </div>
        <div className={styles.feedbackList}>
          {feedbackPlaceholders.map((item, index) => (
            <article key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section shell" aria-labelledby="contact-title">
        <div className="contact-material">
          <MaterialStudy labels={false} />
          <div className="area-note">
            <span className="area-dot" aria-hidden="true" />
            <p>
              Based in Maineville, near Mason.
              <strong>Cincinnati · Northern Kentucky · Southeast Indiana</strong>
            </p>
          </div>
        </div>
        <div className="contact-form-panel">
          <h2 id="contact-title">Show us what does not match.</h2>
          <p>
            Tell us where the project is, what changed, and what needs to look more consistent.
            Residential and commercial inquiries are welcome.
          </p>
          <EstimateForm />
        </div>
      </section>
    </>
  );
}
