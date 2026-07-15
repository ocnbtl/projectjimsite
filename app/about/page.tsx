import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { projects } from "@/content/projects";

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
          <h2>Color is not one flat value.</h2>
          <p>
            Existing masonry carries variation from unit to unit, across mortar joints, and under
            changing light. MCC studies those relationships, mixes the target tones, and refines
            the work in context rather than treating the surface as one uniform color.
          </p>
          <p>
            Based in Maineville near Mason, MCC serves residential and commercial projects across
            Greater Cincinnati, Northern Kentucky, and Southeast Indiana.
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
            sizes="(max-width: 900px) 100vw, 52vw"
          />
          <figcaption>
            <span>Completed MCC project</span>
            {entryProject.title}
          </figcaption>
        </figure>
      </section>

      <section className="values-section shell" aria-labelledby="values-title">
        <div className="values-heading">
          <h2 id="values-title">What the work asks for.</h2>
          <p>Precision comes from judging the adjusted area as part of the full surface.</p>
        </div>
        <div className="values-list">
          <article>
            <span>01</span>
            <h3>Observation</h3>
            <p>Color is judged in context, under the light and from the distance that matter.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Restraint</h3>
            <p>The goal is not to cover every difference. It is to correct the difference that distracts.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Fit</h3>
            <p>The finished area should feel related to the building rather than added on top of it.</p>
          </article>
        </div>
      </section>
    </>
  );
}
