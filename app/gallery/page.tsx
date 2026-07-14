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
  return (
    <>
      <PageIntro title="Before, after, and the space between.">
        <p>
          Authentic MCC project photography shows how broad color shifts and localized repairs can
          be brought back into relationship with the masonry around them. Each pair is presented
          without retouching.
        </p>
      </PageIntro>
      <section className="gallery-grid shell" aria-label="MCC before-and-after projects">
        {projects.map((project) => (
          <article className="gallery-item" id={project.slug} key={project.slug}>
            <div className="gallery-media">
              <ProjectPair {...project} />
            </div>
            <div className="gallery-copy">
              <p className="gallery-number">Project {project.number}</p>
              <h2>{project.title}</h2>
              <p className="gallery-category">{project.category}</p>
              <p>{project.summary}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="plain-cta shell">
        <h2>Have a mismatch like this?</h2>
        <p>Share one wide view and a few close-ups so MCC can understand the full color relationship.</p>
        <Link className="button" href="/contact">
          Request an estimate
        </Link>
      </section>
    </>
  );
}
