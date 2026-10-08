import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site-url";

const routes = [
  "",
  "/services",
  "/masonry-staining",
  "/gallery",
  "/about",
  "/contact",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    // Omit lastModified until real per-page content dates are maintained.
    // A deployment alone does not mean every page's content changed.
    changeFrequency: route === "" ? "monthly" : "yearly",
    priority: route === "" ? 1 : route === "/contact" ? 0.9 : 0.8,
  }));
}
