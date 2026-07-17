import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { projects } from "@/content/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Masonry Color Corrections LLC, a masonry color matching specialist serving the Cincinnati area from Maineville, Ohio.",
};

export default function AboutPage() {
  const entryProject = projects[4];

  return (
    <>
      <PageIntro title="A specialist’s eye for color, variation, and fit.">
        <p>
          Masonry Color Corrections LLC focuses on the visual problems that can remain after a
          repair, addition, replacement, or material change is structurally complete.
        </p>
      </PageIntro>

      <section className="about-grid shell">
        <div className="about-copy">
          <h2>Color isn’t one flat value.</h2>
          <p>
            Existing masonry carries variation from brick to brick, through mortar joints,
            texture, absorbency, and changing light. MCC compares a repair, addition, or changed
            area with the surrounding field, then mixes and tests target tones for selective
            color correction or broader staining when the masonry can accept the treatment. The
            goal is to bring the distracting difference back into the larger material relationship
            without flattening the surface into one uniform color.
          </p>
          <p>
            For more than 10 years, MCC has served residential and commercial clients across
            Greater Cincinnati, Northern Kentucky, and Southeast Indiana from its base in
            Maineville near Mason.
          </p>
          <Link className="button" href="/contact">
            Start a conversation <span aria-hidden="true">→</span>
          </Link>
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
