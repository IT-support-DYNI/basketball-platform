import Image from "next/image";
import Link from "next/link";

type Size = "sm" | "md" | "lg";

/** Height of the mark in px. */
const HEIGHT_PX: Record<Size, number> = { sm: 32, md: 44, lg: 88 };
/** public/brand/dyni-logo-480.png is 480 x 209. */
const LOGO_RATIO = 480 / 209;

/**
 * The DYNI Blazers mark. With `wordmark` (the default) it is the full club
 * logo, ball and "DYNI BLAZERS" in one image; without it, just the ball
 * emblem, for tight spaces. `href` makes it a link (the app shell, and the
 * auth screens back to the club site); omit it for a static mark.
 */
export default function Brandmark({
  size = "md",
  href,
  wordmark = true,
  className = "",
}: {
  size?: Size;
  href?: string;
  wordmark?: boolean;
  className?: string;
}) {
  const h = HEIGHT_PX[size];
  const inner = (
    <span className={`flex items-center ${className}`}>
      {wordmark ? (
        <Image
          src="/brand/dyni-logo-480.png"
          alt="DYNI Blazers"
          width={Math.round(h * LOGO_RATIO)}
          height={h}
          priority
          className="flex-none"
        />
      ) : (
        <Image src="/brand/dyni-crest-256.png" alt="DYNI Blazers" width={h} height={h} priority className="flex-none" />
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="DYNI Blazers home">
        {inner}
      </Link>
    );
  }
  return inner;
}
