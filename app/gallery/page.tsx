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
        <li key={tag.trim()}>{tag.trim().toLowerCase()}</li>
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
      {details.map(([label, text], index) => (
        <section key={label} aria-labelledby={`${project.slug}-detail-${index}`}>
          <h3 id={`${project.slug}-detail-${index}`}>{label}</h3>
          <p>{text}</p>
        </section>
      ))}
    </div>
  );
}

export default function GalleryPage() {
  const panelTones = ["charcoal", "clay", "ivory"] as const;

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

      <section className={`${styles.gallery} home-shell`} id="finished-projects" aria-label="MCC before-and-after projects">
        {projects.map((project, index) => (
          <article
            className={styles.projectPanel}
            data-project-panel={panelTones[index % panelTones.length]}
            id={project.slug}
            aria-labelledby={`${project.slug}-title`}
            key={project.slug}
          >
            <header className={styles.projectHeading}>
              <h2 id={`${project.slug}-title`}>{project.title}</h2>
              <ProjectTags category={project.category} />
              <p className={styles.projectSummary}>{project.summary}</p>
            </header>
            <div className={`${styles.projectMedia} ${project.orientation === "portrait" ? "" : styles.landscapeMedia}`}>
              <ProjectPair {...project} priority={index === 0} />
            </div>
            <CaseStudyDetails project={project} />
          </article>
        ))}
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
