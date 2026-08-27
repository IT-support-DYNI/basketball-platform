import Image from "next/image";
import Link from "next/link";

type Size = "sm" | "md" | "lg";

const CREST_PX: Record<Size, number> = { sm: 32, md: 44, lg: 88 };
const WORDMARK: Record<Size, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-3xl",
};

/**
 * The DYNI Blazers lockup: club crest + wordmark. `href` makes the whole thing a
 * link (used in the app shell); omit it for a static mark (used on auth screens).
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
  const px = CREST_PX[size];
  const inner = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/brand/dyni-crest-256.png"
        alt="DYNI Blazers"
        width={px}
        height={px}
        priority
        className="flex-none"
      />
      {wordmark && (
        <span
          className={`font-display font-extrabold uppercase leading-none tracking-tight text-ink ${WORDMARK[size]}`}
        >
          DYNI <span className="text-flame">Blazers</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="DYNI Blazers — home">
        {inner}
      </Link>
    );
  }
  return inner;
}
