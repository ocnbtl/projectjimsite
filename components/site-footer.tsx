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
            Helping repairs, additions, and mismatched masonry blend in for more than 10 years.
          </p>
        </div>
        <div data-nosnippet>
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
        <div className="footer-legal" data-nosnippet>
          <span>© {new Date().getFullYear()} {business.name}</span>
          <div className="footer-legal-links">
            <Link href="/privacy">Privacy</Link>
            <AnalyticsPreferencesButton className="footer-privacy-button" />
            <span>Website by Madagin</span>
            <a className="footer-office-link" href="https://office.masonrycolorcorrections.com" aria-label="MCC team sign in" title="Team sign in" rel="nofollow">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
