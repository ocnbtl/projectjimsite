import Image from "next/image";
import Link from "next/link";
import { LocalBusinessSchema } from "@/components/local-business-schema";
import { ProjectPair } from "@/components/project-pair";
import { educationProject, featuredProject, projects } from "@/content/projects";
import { business, services } from "@/content/site";
import styles from "./home.module.css";

const homeServices = [
  {
    ...services[0],
    title: "Repair & addition matching",
    short: "Blend replacement brick and new work with the masonry already there.",
  },
  {
    ...services[1],
    title: "Brick & masonry staining",
    short: "Adjust tone while preserving the texture and variation of the material.",
  },
  {
    ...services[2],
    title: "Fireplace, stone & mortar",
    short: "Refine interior and exterior masonry with a specialist’s eye for color.",
  },
];

const closingSteps = [
  ["01", "Share the view", "Send a wide view, close-ups, and the project location."],
  ["02", "Study the surface", "MCC reviews the material, surrounding tones, and previous coatings."],
  ["03", "Refine the match", "The existing masonry guides the color direction and final review."],
] as const;

export default function HomePage() {
  const wallProject = projects[3];
  const fireplaceProject = projects[2];

  return (
    <>
      <LocalBusinessSchema />

      <section className={`hero ${styles.hero}`}>
        <div className={`hero-copy ${styles.heroCopy}`}>
          <h1>
            Make mismatched
            <br />
            {" "}masonry belong<span aria-hidden="true">.</span>
          </h1>
          <p>
            Precision color mixing, staining, and matching for repairs, additions, fireplaces,
            and masonry that no longer looks like part of the original work.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/contact">
              Request a project consultation <span aria-hidden="true">→</span>
            </Link>
            <a className="button button-secondary" href={business.phoneHref}>
              Call {business.phoneDisplay}
            </a>
          </div>
          <p className={styles.heroUtility}>
            Cincinnati tri-state area <span aria-hidden="true">·</span> Residential &amp;
            commercial
          </p>
        </div>

        <figure className={styles.heroVisual}>
          <div className={styles.heroAfter}>
            <Image
              src={featuredProject.after}
              alt={featuredProject.afterAlt}
              fill
              priority
              sizes="(max-width: 900px) 50vw, 58vw"
            />
            <span>After</span>
          </div>
          <div className={styles.heroBefore}>
            <Image
              src={featuredProject.before}
              alt={featuredProject.beforeAlt}
              fill
              sizes="(max-width: 900px) 50vw, 18vw"
            />
            <span>Before</span>
          </div>
          <figcaption className="sr-only">
            Before and after views of a large brick addition color integration project.
          </figcaption>
        </figure>

        <div className={styles.heroServices} aria-labelledby="home-services-title">
          <h2 className="sr-only" id="home-services-title">
            Masonry color services
          </h2>
          {homeServices.map((service) => (
            <Link href="/services" key={service.number}>
              <span className={styles.serviceNumber}>{service.number}</span>
              <span className={styles.serviceTitle}>{service.title}</span>
              <span className={styles.serviceCopy}>{service.short}</span>
              <span className={styles.serviceArrow} aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${styles.education} shell`} aria-labelledby="education-title">
        <div className={styles.educationMedia}>
          <ProjectPair {...educationProject} variant="compact" />
          <div className={styles.projectMeta}>
            <span>Selective correction</span>
            <p>{educationProject.title}</p>
          </div>
        </div>
        <div className={styles.educationCopy}>
          <h2 id="education-title">Change the color without hiding the masonry.</h2>
          <p>
            Paint covers a surface with one continuous layer. Color correction works more
            selectively, preserving the texture and variation that give masonry its character.
          </p>
          <div className={styles.comparison}>
            <div>
              <span>Paint covers</span>
              <p>A continuous surface layer can flatten brick-by-brick variation.</p>
            </div>
            <div>
              <span>Color correction</span>
              <p>Targeted shifts work with the visible character of the masonry.</p>
            </div>
          </div>
          <Link className="text-link" href="/services">
            See how the process works <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className={`${styles.work} shell`} aria-labelledby="work-title">
        <div className={styles.workHeading}>
          <h2 id="work-title">Real work. Original photographs.</h2>
          <p>
            Every image in the gallery comes from MCC project work and is shown without
            retouching.
          </p>
          <Link className="text-link" href="/gallery">
            View all five projects <span aria-hidden="true">→</span>
          </Link>
        </div>
        <Link className={`${styles.workCard} ${styles.workCardWide}`} href={`/gallery#${wallProject.slug}`}>
          <Image
            src={wallProject.after}
            alt={wallProject.afterAlt}
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 48vw"
          />
          <span>
            <small>Exterior brick</small>
            {wallProject.title}
          </span>
        </Link>
        <Link
          className={`${styles.workCard} ${styles.workCardTall}`}
          href={`/gallery#${fireplaceProject.slug}`}
        >
          <Image
            src={fireplaceProject.after}
            alt={fireplaceProject.afterAlt}
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 28vw"
          />
          <span>
            <small>Interior stone</small>
            {fireplaceProject.title}
          </span>
        </Link>
      </section>

      <section className={`${styles.closing} shell`} aria-labelledby="closing-title">
        <div className={styles.closingLead}>
          <h2 id="closing-title">Show us what does not match.</h2>
          <p>
            Send the location, a short description, and photos from close up and normal viewing
            distance.
          </p>
          <div className={styles.closingActions}>
            <Link className="button" href="/contact">
              Request an estimate <span aria-hidden="true">→</span>
            </Link>
            <a className="button button-dark-secondary" href={business.phoneHref}>
              Call {business.phoneDisplay}
            </a>
          </div>
        </div>
        <ol className={styles.closingSteps}>
          {closingSteps.map(([number, title, text]) => (
            <li key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className={styles.closingArea}>
          Greater Cincinnati <span aria-hidden="true">·</span> Northern Kentucky{" "}
          <span aria-hidden="true">·</span> Southeast Indiana
        </p>
      </section>
    </>
  );
}
