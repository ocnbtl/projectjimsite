import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { business } from "@/content/site";
import { projects } from "@/content/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "What Is Masonry Staining?",
  description:
    "Learn what Masonry Color Corrections LLC does after masonry construction: custom color mixing and staining for mismatched brick, mortar, and select installed materials.",
};

const process = [
  {
    number: "01",
    title: "Study what is already there",
    text: "MCC looks at the surrounding wall or finish from normal viewing distance and up close, paying attention to its lighter tones, darker tones, texture, and repetition.",
  },
  {
    number: "02",
    title: "Mix and test the color",
    text: "Target colors are developed against the actual project rather than selected from one generic paint chip. The surface and existing finish determine whether the approach is a fit.",
  },
  {
    number: "03",
    title: "Apply the correction selectively",
    text: "The color work is placed where the mismatch needs it—sometimes brick by brick, sometimes across a larger installed area, and sometimes through the mortar joints as well.",
  },
  {
    number: "04",
    title: "Review the whole relationship",
    text: "The finished area is checked in context so the repair, addition, shipment change, or specialty material no longer draws attention away from the larger surface.",
  },
];

const applications = [
  {
    title: "Brick and mortar",
    text: "Replacement brick, additions, separate material shipments, patched openings, and mortar or grout that is already installed but does not match.",
  },
  {
    title: "Broad masonry color shifts",
    text: "Larger fields of suitable masonry that need a custom color direction while keeping their visible texture and unit-to-unit variation.",
  },
  {
    title: "Specialty installed materials",
    text: "Select ceramic architectural accents and other compatible surfaces when their finish needs to relate to nearby masonry, wood, or trim.",
  },
  {
    title: "Chalk run-down on brick",
    text: "Masonry discolored by weathered paint pigment washing down from aluminum siding, when MCC confirms color correction is the right response.",
  },
];

export default function MasonryStainingPage() {
  const addition = projects[0];
  const repair = projects[1];

  return (
    <>
      <PageIntro title="The masonry is built. MCC handles the color.">
        <p>
          Masonry Color Corrections is a color-matching and staining specialist. MCC does not lay
          brick, rebuild walls, or perform structural masonry repair. The work begins after the
          mason, builder, or installer has finished and the remaining problem is how the new
          material looks beside the original.
        </p>
        <Link className="button" href="/contact">
          Request a Free Estimate <span aria-hidden="true">→</span>
        </Link>
      </PageIntro>

      <section className={`${styles.definition} shell`} aria-labelledby="definition-title">
        <div className={styles.definitionCopy}>
          <h2 id="definition-title">What masonry staining means here.</h2>
          <p>
            MCC mixes color for the installed surface and applies it to bring a distracting
            mismatch back into the larger material pattern. That may mean changing the tone of a
            replacement brick, building variation into a new addition, matching mortar between
            two shipments, or correcting a broader unwanted cast.
          </p>
          <p>
            The goal is not to make every unit identical. Good matching pays attention to the
            relationship between colors—the light, dark, warm, and muted notes that make the
            original surface feel natural.
          </p>
        </div>
        <figure className={styles.definitionVisual}>
          <Image
            src={addition.after}
            alt={addition.afterAlt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
          />
          <figcaption>
            <span>Completed color work</span>
            The addition was already built before MCC matched it to the original home.
          </figcaption>
        </figure>
      </section>

      <section className={`${styles.boundary} shell`} aria-labelledby="scope-title">
        <div className={styles.boundaryIntro}>
          <h2 id="scope-title">Color work, not masonry construction.</h2>
          <p>
            This distinction matters when planning a project. If brick needs to be laid, a wall
            needs to be rebuilt, or structural damage needs repair, that work belongs with a mason
            or builder first.
          </p>
        </div>
        <div className={styles.scopeCards}>
          <article>
            <h3>MCC does</h3>
            <ul>
              <li>Study the existing color and variation</li>
              <li>Mix and test project-specific tones</li>
              <li>Stain or color-match installed material</li>
              <li>Coordinate with builders and masons when useful</li>
            </ul>
          </article>
          <article>
            <h3>MCC does not</h3>
            <ul>
              <li>Lay brick or block</li>
              <li>Rebuild damaged walls</li>
              <li>Perform structural masonry repair</li>
              <li>Replace the mason, builder, or installer</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={`${styles.processSection} shell`} aria-labelledby="process-title">
        <div className={styles.processHeading}>
          <h2 id="process-title">How the color match is developed.</h2>
          <p>
            Every project has its own material, light, history, and surrounding color. MCC uses
            that context to guide the work instead of forcing one stock color across every job.
          </p>
        </div>
        <ol className={styles.processList}>
          {process.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.applications} shell`} aria-labelledby="applications-title">
        <div className={styles.applicationsImage}>
          <Image
            src={repair.after}
            alt={repair.afterAlt}
            fill
            sizes="(max-width: 900px) 100vw, 46vw"
          />
        </div>
        <div className={styles.applicationsCopy}>
          <h2 id="applications-title">Where color matching can help.</h2>
          <div className={styles.applicationList}>
            {applications.map((application) => (
              <article key={application.title}>
                <h3>{application.title}</h3>
                <p>{application.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside className={`${styles.resource} shell`} aria-labelledby="resource-title">
        <div>
          <h2 id="resource-title">A technical reference for brick treatments.</h2>
          <p>
            The Brick Industry Association identifies masonry stain as one of several treatments
            used to change the appearance of brick. Its guidance notes that stain can change color
            while maintaining natural texture, and recommends evaluating the wall assembly and
            approving the appearance with samples.
          </p>
        </div>
        <a
          className="button button-secondary"
          href="https://www.gobrick.com/media/file/TN%206%20Changing%20the%20Appearance%20of%20Brick%20Masonry%20-%20POSTED%20AUG%202024.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Read BIA Technical Note 6 <span aria-hidden="true">↗</span>
        </a>
      </aside>

      <section className="plain-cta shell">
        <h2>Is the construction finished, but the color still wrong?</h2>
        <p>
          Send a wide view, a few close-ups, and the project location. MCC will review the installed
          surface and follow up about fit and next steps.
        </p>
        <div className={styles.ctaActions}>
          <Link className="button" href="/contact">
            Request a Free Estimate <span aria-hidden="true">→</span>
          </Link>
          <a className="button button-dark-secondary" href={business.phoneHref}>
            Call {business.phoneDisplay}
          </a>
        </div>
      </section>
    </>
  );
}
