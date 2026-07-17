import Image from "next/image";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { LocalBusinessSchema } from "@/components/local-business-schema";
import { featuredProject, projects } from "@/content/projects";
import { business, services } from "@/content/site";
import styles from "./home.module.css";

type ServiceIconName = "matching" | "staining" | "fireplace";

const homeServices = [
  {
    ...services[0],
    icon: "matching" as ServiceIconName,
    title: "Repair & addition matching",
    short: "Blend replacement brick and new work with the masonry already there.",
  },
  {
    ...services[1],
    icon: "staining" as ServiceIconName,
    title: "Brick & masonry staining",
    short: "Adjust tone while preserving the texture and variation of the material.",
  },
  {
    ...services[2],
    icon: "fireplace" as ServiceIconName,
    title: "Fireplace, stone & mortar",
    short: "Refine interior and exterior masonry with a specialist’s eye for color.",
  },
];

const closingSteps = [
  ["01", "Describe the project", "Share the location and a short note about the mismatch or color change."],
  ["02", "Include context and detail", "Send one photo from normal viewing distance and a few close-ups of the material."],
  ["03", "We’ll review the fit", "MCC will look over the surface and follow up with questions and next steps."],
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function ServiceIcon({ name }: { name: ServiceIconName }) {
  if (name === "staining") {
    return (
      <svg viewBox="0 0 32 32" role="presentation">
        <path d="M16 4.5c3.4 5.2 7 9.8 7 14a7 7 0 0 1-14 0c0-4.2 3.6-8.8 7-14Z" />
        <path d="M13 20.5a3.4 3.4 0 0 0 3 1.8" />
      </svg>
    );
  }

  if (name === "fireplace") {
    return (
      <svg viewBox="0 0 32 32" role="presentation">
        <path d="M5 26V7h22v19M3.5 26h25" />
        <path d="M10 26V15a6 6 0 0 1 12 0v11" />
        <path d="M16 24c-2.2 0-3.7-1.5-3.7-3.6 0-1.8 1.5-3.8 3.7-6.4 2.2 2.6 3.7 4.6 3.7 6.4 0 2.1-1.5 3.6-3.7 3.6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" role="presentation">
      <path d="M4 8h13v6H4zM19 8h9v6h-9zM9 17h14v6H9zM4 26h13v-6M19 20h9v6h-9" />
    </svg>
  );
}

function MaterialComparisonVisual() {
  return (
    <figure className={styles.materialVisual}>
      <div className={styles.materialPanel}>
        <div className={styles.materialPhoto}>
          <Image
            src="/images/education/paint-covered-masonry.webp"
            alt="A brick wall covered in one opaque warm red-brown paint layer across both brick and mortar."
            fill
            sizes="(max-width: 900px) 50vw, 30vw"
          />
        </div>
        <div className={styles.materialLabel}>
          <span>Painted brick</span>
          <p>One opaque surface across brick and mortar</p>
        </div>
      </div>

      <div className={styles.materialPanel}>
        <div className={styles.materialPhoto}>
          <Image
            src="/images/education/selective-color-correction.webp"
            alt="A color-corrected brick wall retaining natural red and brown variation, porous texture, and distinct mortar joints."
            fill
            sizes="(max-width: 900px) 50vw, 30vw"
          />
        </div>
        <div className={styles.materialLabel}>
          <span>Color-corrected brick</span>
          <p>Texture and brick-to-brick variation stay visible</p>
        </div>
      </div>

      <figcaption className="sr-only">
        Matched masonry photographs comparing an opaque painted surface with selectively adjusted
        brick tones that retain their visible texture and variation.
      </figcaption>
    </figure>
  );
}

export default function HomePage() {
  const fireplaceProject = projects[2];
  const sliderProject = projects[4];

  return (
    <>
      <LocalBusinessSchema />

      <section className={`hero home-shell ${styles.hero}`}>
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
              Request a Free Estimate <span aria-hidden="true">→</span>
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
          <div className={styles.heroBefore}>
            <Image
              src={featuredProject.before}
              alt={featuredProject.beforeAlt}
              fill
              loading="eager"
              sizes="(max-width: 900px) 38vw, 20vw"
            />
            <span>Before</span>
          </div>
          <div className={styles.heroAfter}>
            <Image
              src={featuredProject.after}
              alt={featuredProject.afterAlt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 900px) 58vw, 48vw"
            />
            <span>After</span>
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
              <span className={styles.serviceIcon} aria-hidden="true">
                <ServiceIcon name={service.icon} />
              </span>
              <span className={styles.serviceContent}>
                <span className={styles.serviceTitle}>{service.title}</span>
                <span className={styles.serviceCopy}>{service.short}</span>
              </span>
              <span className={styles.serviceArrow} aria-hidden="true">
                <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${styles.education} home-shell`} aria-labelledby="education-title">
        <div className={styles.educationMedia}>
          <MaterialComparisonVisual />
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

      <section className={`${styles.work} home-shell`} aria-labelledby="work-title">
        <div className={styles.workHeading}>
          <h2 id="work-title">See the match come together.</h2>
          <p>
            Drag across this repaired entry wall to compare the masonry before and after color
            matching, then explore more exterior, repair, and interior finish work.
          </p>
          <Link className="text-link" href="/gallery">
            View the full project gallery <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className={styles.workComparison}>
          <BeforeAfterSlider {...sliderProject} />
        </div>
        <Link
          className={styles.workCard}
          href={`/gallery#${fireplaceProject.slug}`}
        >
          <Image
            src={fireplaceProject.after}
            alt={fireplaceProject.afterAlt}
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 28vw"
          />
          <span>
            <small>Interior finish</small>
            {fireplaceProject.title}
          </span>
        </Link>
      </section>

      <section className={`${styles.closing} home-shell`} aria-labelledby="closing-title">
        <div className={styles.closingLead}>
          <h2 id="closing-title">Start with a few clear photos.</h2>
          <p>
            Tell us where the project is and what you’d like to blend or change. One wide view and
            a few close-ups give us the context to understand the surface.
          </p>
          <div className={styles.closingActions}>
            <Link className="button" href="/contact">
              Request an estimate <span aria-hidden="true">→</span>
            </Link>
            <a className="button button-dark-secondary" href={business.phoneHref}>
              Call {business.phoneDisplay}
            </a>
          </div>
          <p className={styles.closingArea}>
            Greater Cincinnati <span aria-hidden="true">·</span> Northern Kentucky{" "}
            <span aria-hidden="true">·</span> Southeast Indiana
          </p>
        </div>
        <div className={styles.closingProcess}>
          <p className={styles.closingProcessLabel} id="closing-process-title">
            What helps us get started
          </p>
          <ol className={styles.closingSteps} aria-labelledby="closing-process-title">
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
        </div>
      </section>
    </>
  );
}
