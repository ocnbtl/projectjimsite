import { pageMetadata } from "@/content/page-metadata";
import { TransitionLink as Link } from "@/components/page-transitions";
import { PageIntro } from "@/components/page-intro";
import { ProjectPair } from "@/components/project-pair";
import { projects, type Project } from "@/content/projects";
import styles from "./page.module.css";

export const metadata = pageMetadata("/gallery", {
  title: "Gallery",
  description: "Before-and-after masonry color correction work from Masonry Color Corrections LLC.",
});

function ProjectTags({ category }: { category: Project["category"] }) {
  return (
    <ul className="gallery-category" aria-label="Project categories">
      {category.split("·").map((tag) => (
        <li key={tag.trim()}>{tag.trim()}</li>
      ))}
    </ul>
  );
}

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
      <PageIntro route="/gallery" title="The result should read as part of the original work.">
        <div className={styles.introActions}>
          <a className="button" href="#finished-projects">
            Scroll down to view finished MCC projects
          </a>
          <Link className="button button-secondary" href="/masonry-staining">
            More detail on what we do
          </Link>
        </div>
      </PageIntro>

      <section className="gallery-grid shell" id="finished-projects" aria-label="MCC before-and-after projects">
        <article className={`gallery-feature ${styles.feature}`} id={featured.slug}>
          <div
            className={`gallery-feature-media ${styles.projectMedia} ${styles.landscapeMedia}`}
          >
            <ProjectPair {...featured} priority />
          </div>
          <div className="gallery-feature-copy">
            <h2>{featured.title}</h2>
            <ProjectTags category={featured.category} />
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
                <h2>{project.title}</h2>
                <ProjectTags category={project.category} />
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
