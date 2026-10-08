import { pageMetadata } from "@/content/page-metadata";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { projects } from "@/content/projects";
import styles from "./page.module.css";

export const metadata = pageMetadata("/about", {
  title: "About",
  description:
    "Learn about Masonry Color Corrections LLC, a Cincinnati-based masonry color matching specialist serving the Midwest and Southwest.",
});

export default function AboutPage() {
  const entryProject = projects[4];

  return (
    <>
      <PageIntro title="A specialist’s eye for color, variation, and fit.">
        <p>
          A repair can be well built and still stand out. Masonry Color Corrections LLC helps
          new brick, mortar, and additions blend with what’s already there. Your mason or builder
          handles the construction; we take care of the color afterward.
        </p>
      </PageIntro>

      <section className="about-grid shell">
        <div className="about-copy">
          <h2>Color isn’t one flat value.</h2>
          <p>
            Look closely at an older wall and you’ll see several colors, not just one. We study
            those differences, mix and test colors against the brick and mortar, and check
            whether the surface can accept the treatment. The aim is a match that keeps the
            wall’s character, rather than covering it with one flat color.
          </p>
          <p>
            For more than 10 years, MCC has served residential and commercial clients across Ohio,
            Kentucky, Indiana, West Virginia, and Michigan from its base in Cincinnati. MCC is also
            expanding into Texas and the Southwest.
          </p>
          <div className="about-actions">
            <Link className="button" href="/contact">
              Start a conversation <span aria-hidden="true">→</span>
            </Link>
            <Link className="text-link" href="/masonry-staining">
              Learn how the color work is done <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <figure className="about-visual">
          <Image
            src={entryProject.after}
            alt={entryProject.afterAlt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 52vw"
          />
          <figcaption>
            <span>Completed MCC project</span>
            {entryProject.title}
          </figcaption>
        </figure>
      </section>

      <section className={`${styles.projectReview} shell`} aria-labelledby="project-review-title">
        <div className={styles.reviewIntro}>
          <p className={styles.eyebrow}>A useful first look</p>
          <h2 id="project-review-title">Help us see what changed.</h2>
          <p>
            A project review is more useful when the mismatch is shown as part of the wall,
            fireplace, chimney, or other surface around it.
          </p>
        </div>
        <div className={styles.reviewList}>
          <article>
            <span>01</span>
            <div>
              <h3>Show the whole surface</h3>
              <p>
                A wide photo shows how the problem relates to the surrounding masonry. Close-ups
                help show the brick face, mortar, texture, and color variation.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Tell us what changed</h3>
              <p>
                Note whether the area is a repair, an addition, replacement material, a broader
                color shift, or a surface with a previous coating.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Choose the right approach for the surface</h3>
              <p>
                Brick, block, stone, mortar, absorbency, existing coatings, and surface condition
                all affect which color-correction direction makes sense.
              </p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
