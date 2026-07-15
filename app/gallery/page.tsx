import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProjectPair } from "@/components/project-pair";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Before-and-after masonry color correction work from Masonry Color Corrections LLC.",
};

export default function GalleryPage() {
  const [featured, ...moreProjects] = projects;

  return (
    <>
      <PageIntro title="The result should read as part of the original work.">
        <p>
          Browse completed MCC projects across broad color shifts, localized repair blending,
          exterior walls, and interior finish details.
        </p>
      </PageIntro>

      <section className="gallery-grid shell" aria-label="MCC before-and-after projects">
        <article className="gallery-feature" id={featured.slug}>
          <div className="gallery-feature-media">
            <ProjectPair {...featured} priority />
          </div>
          <div className="gallery-feature-copy">
            <p className="gallery-number">Project {featured.number}</p>
            <h2>{featured.title}</h2>
            <p className="gallery-category">{featured.category}</p>
            <p>{featured.summary}</p>
          </div>
        </article>

        <div className="gallery-secondary">
          {moreProjects.map((project) => (
            <article className="gallery-card" id={project.slug} key={project.slug}>
              <div className="gallery-card-media">
                <ProjectPair {...project} />
              </div>
              <div className="gallery-card-copy">
                <p className="gallery-number">Project {project.number}</p>
                <h2>{project.title}</h2>
                <p className="gallery-category">{project.category}</p>
                <p>{project.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="plain-cta shell">
        <h2>Have a mismatch like this?</h2>
        <p>Share one wide view and a few close-ups so MCC can understand the full color relationship.</p>
        <Link className="button" href="/contact">
          Request an estimate <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
