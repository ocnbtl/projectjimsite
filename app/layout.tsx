import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isLaunchReady, siteUrl } from "@/content/site-url";
import { business } from "@/content/site";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: new URL("/", siteUrl).toString() },
  title: {
    default: "Masonry Color Corrections LLC | Masonry Color Matching",
    template: "%s | Masonry Color Corrections LLC",
  },
  description: business.description,
  robots: isLaunchReady
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
  openGraph: {
    title: business.name,
    siteName: business.name,
    description: business.description,
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
        <AnalyticsProvider />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <AnalyticsConsent />
      </body>
    </html>
  );
}
