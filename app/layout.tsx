import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL("https://masonrycolorcorrections.com"),
  title: {
    default: "Masonry Color Corrections LLC | Cincinnati Masonry Color Matching",
    template: "%s | Masonry Color Corrections LLC",
  },
  description:
    "Color staining and matching for brick repairs, additions, and mismatched masonry in the Cincinnati area.",
  openGraph: {
    title: "Masonry Color Corrections LLC",
    description:
      "Color staining and matching for brick repairs, additions, and mismatched masonry in the Cincinnati area.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
