import Link from "next/link";

type BrandProps = {
  onClick?: () => void;
};

export function Brand({ onClick }: BrandProps = {}) {
  return (
    <Link
      className="brand"
      href="/"
      aria-label="Masonry Color Corrections home"
      onClick={onClick}
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 44 34" role="presentation">
          <path d="M0 0h28v8H0zM8 13h36v8H8zM0 26h28v8H0z" />
        </svg>
      </span>
      <span className="brand-name">
        <strong>Masonry Color</strong>
        <span>Corrections LLC</span>
      </span>
    </Link>
  );
}
