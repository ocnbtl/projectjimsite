import Image from "next/image";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { LocalBusinessSchema } from "@/components/local-business-schema";
import { TestimonialMarquee } from "@/components/testimonial-marquee";
import { featuredProject, projects } from "@/content/projects";
import { business, services } from "@/content/site";
import styles from "./home.module.css";

type ServiceIconName = "matching" | "staining" | "materials";

// Re-enable only after the client supplies approved testimonial copy and attribution.
const testimonialsEnabled = false;

const homeServices = [
  {
    ...services[0],
    icon: "matching" as ServiceIconName,
    title: "Repair and addition matching",
    short: "Match the color after the mason or builder completes the new work.",
  },
  {
    ...services[1],
    icon: "staining" as ServiceIconName,
    title: "Brick & masonry staining",
    short: "Adjust tone while preserving the texture and variation of the material.",
  },
  {
    ...services[2],
    icon: "materials" as ServiceIconName,
    title: "Specialty material matching",
    short: "Help mortar and ceramic details blend in with the colors around them.",
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

// Lucide service icons; ISC license in public/licenses/lucide.txt.
function ServiceIcon({ name }: { name: ServiceIconName }) {
  if (name === "staining") {
    return (
      <svg viewBox="0 0 24 24" role="presentation" focusable="false">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    );
  }

  if (name === "materials") {
    return (
      <svg viewBox="0 0 24 24" role="presentation" focusable="false">
        <path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z" />
        <path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7" />
        <path d="M7 17h.01" />
        <path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M12 9v6M16 15v6M16 3v6M3 15h18M3 9h18M8 15v6M8 3v6" />
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
          <p>One solid coat over brick and mortar</p>
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
  const materialProject = projects[2];
  const sliderProject = projects[4];

  return (
    <>
      <LocalBusinessSchema />

      <section className={`hero home-shell ${styles.hero}`}>
        <div className={`hero-copy ${styles.heroCopy}`}>
          <h1>
            <span className={styles.heroHeadlineLine}>Make mismatched</span>
            <span className={styles.heroHeadlineLine}>
              masonry belong<span className={styles.heroDot}>.</span>
            </span>
          </h1>
          <p>
            New brick doesn’t always match the old. We mix and apply color to help repairs,
            additions, and mismatched mortar blend in, while keeping the texture you love.
          </p>
          <p className={styles.heroExperience}>
            10+ years of color matching. Based in Cincinnati, serving the Midwest and Southwest.
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
            <span className={styles.heroUtilityStates}>
              OH <span aria-hidden="true">·</span> KY <span aria-hidden="true">·</span> IN{" "}
              <span aria-hidden="true">·</span> WV <span aria-hidden="true">·</span> MI{" "}
              <span aria-hidden="true">·</span> TX <span aria-hidden="true">·</span> AZ{" "}
              <span aria-hidden="true">·</span> NM
            </span>
            <span className={styles.heroUtilityAudience}>
              <span className={styles.heroAudienceItem}>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                  <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />
                </svg>
                <span>Residential</span>
              </span>
              <span>and</span>
              <span className={styles.heroAudienceItem}>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                  <path d="M5 21V3h14v18M3 21h18M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-6h4v6" />
                </svg>
                <span>Commercial</span>
              </span>
            </span>
          </p>
        </div>

        <figure className={styles.heroVisual}>
          <div className={styles.heroBefore}>
            <Image
              src={featuredProject.before}
              alt={featuredProject.beforeAlt}
              fill
              loading="eager"
              sizes="(max-width: 900px) 38vw, 19vw"
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
              sizes="(max-width: 900px) 58vw, 34vw"
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
          <span
            className={`${styles.serviceSeam} ${styles.serviceSeamOne}`}
            data-service-seam="one"
            aria-hidden="true"
          />
          <span
            className={`${styles.serviceSeam} ${styles.serviceSeamTwo}`}
            data-service-seam="two"
            aria-hidden="true"
          />
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
              <p>We adjust the color while keeping the natural texture and variation.</p>
            </div>
          </div>
          <Link className="text-link" href="/masonry-staining">
            Understand masonry staining <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className={`${styles.work} home-shell`} aria-labelledby="work-title">
        <div className={styles.workHeading}>
          <h2 id="work-title">See the match come together.</h2>
          <p>
            Drag across this repaired entry wall to compare the masonry before and after color
            matching, then explore more exterior, post-repair, and specialty material work.
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
          href={`/gallery#${materialProject.slug}`}
        >
          <Image
            src={materialProject.after}
            alt={materialProject.afterAlt}
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 28vw"
          />
          <span>
            <small>Multi-material match</small>
            {materialProject.title}
          </span>
        </Link>
      </section>

      {testimonialsEnabled ? <TestimonialMarquee /> : null}

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
            <span>Serving Ohio, Kentucky, Indiana, West Virginia &amp; Michigan</span>
            <span>Expanding into Texas, Arizona &amp; New Mexico</span>
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
