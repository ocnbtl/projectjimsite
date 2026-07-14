import type { MetadataRoute } from "next";

const routes = ["", "/services", "/gallery", "/about", "/contact", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://masonrycolorcorrections.com${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "monthly" : "yearly",
    priority: route === "" ? 1 : route === "/contact" ? 0.9 : 0.8,
  }));
}
