import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ProjectPlaceholder } from "@/components/project-placeholder";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Before-and-after masonry color correction work from Masonry Color Corrections LLC.",
};

const studies = [
  {
    project: 1 as const,
    title: "Repair blending",
    description:
      "The intended photography will show the repair from the same angle before and after selective color matching.",
  },
  {
    project: 2 as const,
    title: "Commercial facade matching",
    description:
      "A wider view will demonstrate how corrected replacement masonry relates to the full elevation.",
  },
  {
    project: 3 as const,
    title: "Fireplace and stone",
    description:
      "Close and room-scale photographs will document how the adjusted stone and mortar sit within the original interior palette.",
  },
];

export default function GalleryPage() {
  return (
    <>
      <PageIntro title="Before, after, and the space between.">
        <p>
          Each launch project will pair original MCC photographs from the same angle and explain
          what changed, which material was involved, and what the color correction needed to
          accomplish.
        </p>
      </PageIntro>
      <section className="gallery-grid shell" aria-label="Gallery design preview">
        <p className="preview-note">
          Design preview: the images below communicate the intended subject, crop, and before-and-after
          structure. They are not MCC projects and will be replaced by authorized original photography.
        </p>
        {studies.map((study) => (
          <article className="gallery-item" key={study.title}>
            <ProjectPlaceholder project={study.project} title={study.title} />
            <div>
              <h2>{study.title}</h2>
              <p>{study.description}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="plain-cta shell">
        <h2>Have a mismatch like this?</h2>
        <p>Share photos from normal viewing distance and close up.</p>
        <Link className="button" href="/contact">
          Request an estimate
        </Link>
      </section>
    </>
  );
}
