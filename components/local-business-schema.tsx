import { business, services } from "@/content/site";

const schema = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: business.name,
  url: `https://${business.domain}`,
  telephone: "+1-513-612-8421",
  email: business.email,
  description:
    "Precision masonry color mixing, staining, and matching for residential and commercial brick, stone, mortar, chimney, fireplace, repair, and addition projects.",
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
