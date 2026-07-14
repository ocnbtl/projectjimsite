import Image from "next/image";
import type { Project } from "@/content/projects";
import styles from "./project-pair.module.css";

type ProjectPairProps = Pick<
  Project,
  "before" | "after" | "beforeAlt" | "afterAlt" | "orientation"
> & {
  variant?: "gallery" | "compact" | "hero";
  priority?: boolean;
  className?: string;
};

export function ProjectPair({
  before,
  after,
  beforeAlt,
  afterAlt,
  orientation = "landscape",
  variant = "gallery",
  priority = false,
  className,
}: ProjectPairProps) {
  const rootClassName = [
    styles.pair,
    styles[variant],
    styles[orientation],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={rootClassName}>
      <div className={`${styles.frame} ${styles.before}`}>
        <Image
          className={styles.image}
          src={before}
          alt={beforeAlt}
          fill
          priority={priority}
          loading={priority ? "eager" : undefined}
          sizes={
            variant === "hero"
              ? "(max-width: 860px) 82vw, 38vw"
              : "(max-width: 860px) 100vw, 36vw"
          }
        />
        <span className={styles.label}>Before</span>
      </div>
      <div className={`${styles.frame} ${styles.after}`}>
        <Image
          className={styles.image}
          src={after}
          alt={afterAlt}
          fill
          priority={priority}
          loading={priority ? "eager" : undefined}
          sizes={
            variant === "hero"
              ? "(max-width: 860px) 82vw, 38vw"
              : "(max-width: 860px) 100vw, 36vw"
          }
        />
        <span className={styles.label}>After</span>
      </div>
      <figcaption className="sr-only">Before and after views of an MCC masonry project.</figcaption>
    </figure>
  );
}
