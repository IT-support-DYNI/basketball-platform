import Link from "next/link";

/**
 * Shared player/coach card for the public site (home, roster, coaches).
 * `display: block` on the Link is load-bearing — see app/club/page.tsx git
 * history for the ghost-box bug an implicit `display: inline` caused here.
 */
export default function PersonCard({
  href,
  name,
  photoUrl,
  line,
  bio,
  jerseyNumber,
}: {
  href: string;
  name: string;
  photoUrl: string | null;
  line: string | null;
  bio: string | null;
  /** Renders as a large faint watermark digit, top-right — players only. */
  jerseyNumber?: number | null;
}) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-card border border-line bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-flame/40 hover:shadow-[0_16px_36px_-16px_rgb(var(--flame)/0.35)]"
    >
      {jerseyNumber != null && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-6 select-none font-condensed text-[120px] font-bold leading-none text-flame/[0.09]"
        >
          {jerseyNumber}
        </span>
      )}
      <div className="relative flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-16 w-16 flex-none rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gradient-to-br from-flame to-ember font-condensed text-xl font-bold text-on-flame">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-ink">{name}</p>
          {line && <p className="font-mono text-[11px] uppercase tracking-wider text-flame-ink">{line}</p>}
        </div>
      </div>
      {bio && <p className="relative mt-3 line-clamp-2 text-sm text-ink-dim">{bio}</p>}
      <span className="relative mt-3 inline-block text-xs font-semibold text-flame-ink opacity-0 transition group-hover:opacity-100">
        View profile →
      </span>
    </Link>
  );
}
