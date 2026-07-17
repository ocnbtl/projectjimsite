import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProjectPair } from "@/components/project-pair";
import { projects } from "@/content/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Before-and-after masonry color correction work from Masonry Color Corrections LLC.",
};

const galleryProjectSummaries: Record<string, string> = {
  "02":
    "After a car drove through the wall, the damaged masonry was repaired. MCC’s matching work then brought the new brick into the darker, varied wall around it so the repair blended back into the original masonry.",
};

export default function GalleryPage() {
  const [featured, ...moreProjects] = projects;

  return (
    <>
      <PageIntro title="The result should read as part of the original work.">
        <p className={styles.introCue}>
          Browse completed MCC projects
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M7 14l5 5 5-5" />
          </svg>
        </p>
      </PageIntro>

      <section className="gallery-grid shell" aria-label="MCC before-and-after projects">
        <article className={`gallery-feature ${styles.feature}`} id={featured.slug}>
          <div
            className={`gallery-feature-media ${styles.projectMedia} ${styles.landscapeMedia}`}
          >
            <ProjectPair {...featured} priority />
          </div>
          <div className="gallery-feature-copy">
            <p className="gallery-number">Project {featured.number}</p>
            <h2>{featured.title}</h2>
            <p className="gallery-category">{featured.category}</p>
            <p>{featured.summary}</p>
          </div>
        </article>

        <div className={`gallery-secondary ${styles.secondary}`}>
          {moreProjects.map((project) => (
            <article
              className="gallery-card"
              id={project.slug}
              key={project.slug}
            >
              <div
                className={`gallery-card-media ${styles.projectMedia} ${
                  project.orientation === "portrait" ? "" : styles.landscapeMedia
                }`}
              >
                <ProjectPair {...project} />
              </div>
              <div className="gallery-card-copy">
                <p className="gallery-number">Project {project.number}</p>
                <h2>{project.title}</h2>
                <p className="gallery-category">{project.category}</p>
                <p>{galleryProjectSummaries[project.number] ?? project.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="plain-cta shell">
        <h2 className={styles.ctaTitle}>
          <span className={styles.ctaLead}>Have a mismatch</span>{" "}
          <span className={styles.ctaTail}>like this?</span>
        </h2>
        <p>Share one wide view and a few close-ups so MCC can understand the full color relationship.</p>
        <Link className="button" href="/contact">
          Request an estimate <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
