import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProjectPair } from "@/components/project-pair";
import { projects, type Project } from "@/content/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Before-and-after masonry color correction work from Masonry Color Corrections LLC.",
};

function CaseStudyDetails({ project }: { project: Project }) {
  const details = [
    ["What happened", project.story.situation],
    ["MCC’s color work", project.story.colorWork],
    ["Finished result", project.story.result],
  ] as const;

  return (
    <div className={styles.caseStudy} aria-label={`${project.title} project details`}>
      {details.map(([label, text]) => (
        <article key={label}>
          <h3>{label}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}

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
            <p className={styles.projectSummary}>{featured.summary}</p>
            <CaseStudyDetails project={featured} />
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
                <p className={styles.projectSummary}>{project.summary}</p>
                <CaseStudyDetails project={project} />
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
