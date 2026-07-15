import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isLaunchReady, siteUrl } from "@/content/site-url";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Masonry Color Corrections LLC | Cincinnati Masonry Color Matching",
    template: "%s | Masonry Color Corrections LLC",
  },
  description:
    "Color staining and matching for brick repairs, additions, and mismatched masonry in the Cincinnati area.",
  robots: isLaunchReady
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
  openGraph: {
    title: "Masonry Color Corrections LLC",
    description:
      "Color staining and matching for brick repairs, additions, and mismatched masonry in the Cincinnati area.",
    images: [
      {
        url: "/images/projects/addition-after.jpeg",
        width: 1242,
        height: 929,
        alt: "Completed brick addition color integration by Masonry Color Corrections LLC",
      },
    ],
    url: siteUrl,
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={manrope.variable}>
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
