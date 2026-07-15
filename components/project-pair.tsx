import Image from "next/image";
import type { Project } from "@/content/projects";
import styles from "./project-pair.module.css";

type ProjectPairProps = Pick<
  Project,
  "title" | "before" | "after" | "beforeAlt" | "afterAlt" | "orientation"
> & {
  variant?: "gallery" | "compact";
  priority?: boolean;
};

export function ProjectPair({
  title,
  before,
  after,
  beforeAlt,
  afterAlt,
  orientation = "landscape",
  variant = "gallery",
  priority = false,
}: ProjectPairProps) {
  const rootClassName = [styles.pair, styles[variant], styles[orientation]].join(" ");

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
          sizes="(max-width: 900px) 50vw, 36vw"
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
          sizes="(max-width: 900px) 50vw, 36vw"
        />
        <span className={styles.label}>After</span>
      </div>
      <figcaption className="sr-only">Before and after views of {title} by MCC.</figcaption>
    </figure>
  );
}
