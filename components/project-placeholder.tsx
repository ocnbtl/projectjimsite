import styles from "./project-placeholder.module.css";

type ProjectPlaceholderProps = {
  project: 1 | 2 | 3;
  title: string;
};

export function ProjectPlaceholder({ project, title }: ProjectPlaceholderProps) {
  return (
    <div
      className={`material-study ${styles.placeholder} ${styles[`project${project}`]}`}
      role="img"
      aria-label={`${title} design placeholder showing a before and after masonry color correction`}
    >
      <div className={`${styles.frame} ${styles.before}`}>
        <span>Before</span>
      </div>
      <div className={`${styles.frame} ${styles.after}`}>
        <span>After</span>
      </div>
      <p className={styles.notice}>
        Concept imagery — replace with original MCC project photography before launch.
      </p>
    </div>
  );
}
