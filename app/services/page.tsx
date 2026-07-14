import type { Metadata } from "next";
import Link from "next/link";
import { MaterialStudy } from "@/components/material-study";
import { PageIntro } from "@/components/page-intro";
import { services } from "@/content/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Masonry color matching and staining services for repairs, additions, brick, fireplaces, stone, and mortar in the Cincinnati area.",
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro title="Masonry color solutions for work that stands out.">
        <p>
          The right approach depends on the material, the amount of change, previous coatings, and
          how the new work relates to the original masonry. Photos are the best place to start.
        </p>
        <Link className="button" href="/contact">
          Request an estimate
        </Link>
      </PageIntro>
      <section className="service-detail-list shell">
        {services.map((service, index) => (
          <article className="service-detail" key={service.number}>
            <div className="service-detail-copy">
              <span>{service.number}</span>
              <h2>{service.title}</h2>
              <p>{service.detail}</p>
              <p>{service.short}</p>
              <Link className="text-link" href="/contact">
                Ask about this service <span aria-hidden="true">→</span>
              </Link>
            </div>
            <MaterialStudy compact labels={index === 0} />
          </article>
        ))}
      </section>
      <section className="plain-cta shell">
        <h2>Not sure which service fits?</h2>
        <p>Send photos of the full area and the mismatch. MCC can help identify the next step.</p>
        <Link className="button" href="/contact">
          Start with photos
        </Link>
      </section>
    </>
  );
}
