import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Masonry Color Corrections home">
      <span className="brand-initials" aria-hidden="true">
        MCC
      </span>
      <span className="brand-name">
        Masonry Color
        <br />
        Corrections LLC
      </span>
    </Link>
  );
}
