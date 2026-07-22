import Image from "next/image";
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
      <span className="brand-logo-frame">
        <Image
          className="brand-logo"
          src="/images/brand/mcc-facebook-logo.jpg"
          alt="MCC Masonry Color Corrections"
          width={2048}
          height={1228}
          priority
          sizes="(max-width: 600px) 142px, 184px"
        />
      </span>
    </Link>
  );
}
