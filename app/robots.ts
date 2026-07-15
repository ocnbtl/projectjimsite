import type { MetadataRoute } from "next";
import { isLaunchReady, siteUrl } from "@/content/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      ...(isLaunchReady ? { allow: "/" } : { disallow: "/" }),
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
