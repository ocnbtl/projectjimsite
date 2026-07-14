import type { Metadata } from "next";
import Link from "next/link";
import { MaterialStudy } from "@/components/material-study";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Masonry Color Corrections LLC, a masonry color matching specialist serving the Cincinnati area from Maineville, Ohio.",
};

export default function AboutPage() {
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
          <h2>Current name. Established history.</h2>
          <p>
            MCC is the current public identity of the business previously listed as Masonry Color
            Restoration, LLC. Its BBB history dates to 2013 and describes masonry staining and
            color matching for repairs and additions.
          </p>
          <p>
            Today, the work remains centered on helping visibly different masonry relate more
            naturally to the structure around it. The website will add the owner’s full biography,
            credentials, and project history after final client approval.
          </p>
          <Link className="button" href="/contact">
            Start a conversation
          </Link>
        </div>
        <MaterialStudy labels={false} />
      </section>
      <section className="values-section shell">
        <h2>What the work asks for.</h2>
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
