import { business, services } from "@/content/site";
import { siteUrl } from "@/content/site-url";

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": new URL("/#business", siteUrl).toString(),
  name: business.name,
  url: siteUrl,
  telephone: "+1-513-612-8421",
  email: business.email,
  description: `${business.description} MCC does not lay brick or perform structural masonry repair.`,
  logo: new URL("/images/brand/mcc-logo-transparent.png", siteUrl).toString(),
  sameAs: [business.facebookUrl],
  areaServed: [
    { "@type": "State", name: "Ohio" },
    { "@type": "State", name: "Kentucky" },
    { "@type": "State", name: "Indiana" },
    { "@type": "State", name: "West Virginia" },
    { "@type": "State", name: "Michigan" },
    { "@type": "State", name: "Texas" },
    { "@type": "State", name: "Arizona" },
    { "@type": "State", name: "New Mexico" },
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": new URL("/#website", siteUrl).toString(),
            name: business.name,
            alternateName: "Masonry Color Corrections",
            url: new URL("/", siteUrl).toString(),
            publisher: { "@id": schema["@id"] },
          }),
        }}
      />
    </>
  );
}
