import { pageMetadata } from "@/content/page-metadata";
import Image from "next/image";
import { TransitionLink as Link } from "@/components/page-transitions";
import { PageIntro } from "@/components/page-intro";
import { business } from "@/content/site";
import { projects } from "@/content/projects";
import { stainingProcess, stainingApplications } from "@/content/staining";
import styles from "./page.module.css";

export const metadata = pageMetadata("/masonry-staining", {
  title: "What Is Masonry Staining?",
  description:
    "See how MCC stains and color-matches brick and mortar, blends repairs and additions, corrects paint chalking, and adjusts color for project LRV requirements.",
});

export default function MasonryStainingPage() {
  const addition = projects[0];
  const repair = projects[1];

  return (
    <>
      <PageIntro route="/masonry-staining" title="The masonry is built. MCC handles the color.">
        <p>
          The repair is done, but the new brick still stands out. Or you’re ready for a different
          color across the whole wall. We mix and test stains for your masonry, then apply the
          color where it’s needed. Your mason handles any construction or structural repairs first.
        </p>
        <Link className="button" href="/contact">
          Request a Free Estimate <span aria-hidden="true">→</span>
        </Link>
      </PageIntro>

      <section className={`${styles.definition} shell`} aria-labelledby="definition-title">
        <div className={styles.definitionCopy}>
          <h2 id="definition-title">New brick can look like it belongs.</h2>
          <p>
            When replacement brick doesn’t match, you don’t always need to replace it again.
            We can often adjust its color with stain. The same approach can help a new addition,
            mismatched mortar, or two brick deliveries that don’t quite match.
          </p>
          <p>
            An older wall usually has several shades in it. We work with those differences so
            the finished area still looks like brick, not one flat block of color. We check the
            surface and test a sample before choosing the treatment.
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
            This addition started with gray brick. We matched it to the original red brick after construction.
          </figcaption>
        </figure>
      </section>

      <section className={`${styles.boundary} shell`} aria-labelledby="scope-title">
        <div className={styles.boundaryIntro}>
          <h2 id="scope-title">Your mason builds it. We match the color.</h2>
          <p>
            If a wall needs rebuilding or a structural repair, bring in your mason or builder
            first. Once that work is finished, we can help with the color.
          </p>
        </div>
        <div className={styles.scopeCards}>
          <article>
            <h3>What we handle</h3>
            <ul>
              <li>Brick and mortar color matching</li>
              <li>Staining for repairs, additions, and larger walls</li>
              <li>Paint chalking color correction</li>
              <li>Color adjustment for supplied LRV requirements</li>
            </ul>
          </article>
          <article>
            <h3>What your mason handles</h3>
            <ul>
              <li>Laying brick or block</li>
              <li>Rebuilding damaged walls</li>
              <li>Structural masonry repairs</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={`${styles.processSection} shell`} aria-labelledby="process-title">
        <div className={styles.processHeading}>
          <h2 id="process-title">How we get to a good match.</h2>
          <p>
            We start with the wall in front of us. The brick, mortar, old coatings, and color
            you want all help us choose the next step.
          </p>
        </div>
        <ol className={styles.processList}>
          {stainingProcess.map((step) => (
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
            {stainingApplications.map((application) => (
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
          <h2 id="resource-title">Want the technical details?</h2>
          <p>
            The Brick Industry Association explains how staining and other treatments change
            brick’s appearance. Its guide also covers checking the wall and using sample panels
            before starting the work.
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
        <h2>Show us what you’d like to change.</h2>
        <p>
          Send a photo of the whole wall, a few close-ups, and the project location. If there’s
          an HOA color or LRV requirement, include that too. We’ll take a look and talk you through the options.
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
