import Link from "next/link";
import { AnalyticsPreferencesButton } from "@/components/analytics-consent";
import { Brand } from "@/components/brand";
import { business, navigation } from "@/content/site";

const footerNavigation = [
  ...navigation.slice(0, 3),
  { label: "What MCC does", href: "/masonry-staining" },
  ...navigation.slice(3),
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Brand />
          <p>
            Post-construction color staining and matching for installed brick, mortar, and select
            compatible materials.
          </p>
        </div>
        <div>
          <p className="footer-label">Navigate</p>
          <nav className="footer-nav" aria-label="Footer navigation">
            {footerNavigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="footer-contact">
          <p className="footer-label">Start a conversation</p>
          <a href={business.phoneHref}>{business.phoneDisplay}</a>
          <a href={business.emailHref}>{business.email}</a>
          <p>{business.location}</p>
          <p>Serving the Midwest and Southwest</p>
          <a
            className="footer-social-link"
            href={business.facebookUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Masonry Color Corrections LLC on Facebook"
            title="MCC on Facebook"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path
                fill="currentColor"
                d="M16 8.05A8 8 0 1 0 6.75 16v-5.63H4.72V8.05h2.03V6.28c0-2.02 1.2-3.13 3.02-3.13.87 0 1.78.16 1.78.16v1.96h-1c-1 0-1.3.62-1.3 1.25v1.53h2.22l-.36 2.32H9.25V16A8 8 0 0 0 16 8.05Z"
              />
            </svg>
          </a>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} {business.name}</span>
          <div className="footer-legal-links">
            <Link href="/privacy">Privacy</Link>
            <AnalyticsPreferencesButton className="footer-privacy-button" />
            <span>Website by Madagin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
