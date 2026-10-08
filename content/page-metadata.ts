import type { Metadata } from "next";
import { business } from "./site";
import { siteUrl } from "./site-url";

/** Keep each public page's canonical and sharing identity aligned. */
export function pageMetadata(path: string, metadata: Metadata): Metadata {
  const url = new URL(path, siteUrl).toString();
  const title = typeof metadata.title === "string"
    ? `${metadata.title} | ${business.name}`
    : business.name;

  return {
    ...metadata,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: business.name,
      title,
      description: metadata.description ?? undefined,
      url,
      images: [{
        url: "/images/projects/addition-after.jpeg",
        width: 1242,
        height: 929,
        alt: "Completed brick addition color integration by Masonry Color Corrections LLC",
      }],
    },
  };
}
