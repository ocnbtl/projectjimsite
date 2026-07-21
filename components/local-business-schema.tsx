import { business, services } from "@/content/site";
import { siteUrl } from "@/content/site-url";

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: business.name,
  url: siteUrl,
  telephone: "+1-513-612-8421",
  email: business.email,
  description:
    "Post-construction color mixing, staining, and matching for installed brick, mortar, masonry repairs, additions, and select compatible materials. MCC does not lay brick or perform structural masonry repair.",
  areaServed: [
    { "@type": "AdministrativeArea", name: "Greater Cincinnati" },
    { "@type": "AdministrativeArea", name: "Northern Kentucky" },
    { "@type": "AdministrativeArea", name: "Southeast Indiana" },
  ],
  makesOffer: services.map((service) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: service.title,
      description: service.short,
    },
  })),
};

export function LocalBusinessSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
