import Link from "next/link";
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
          <p>Serving the Cincinnati area</p>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} {business.name}</span>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
