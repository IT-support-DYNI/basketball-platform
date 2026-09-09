import Link from "next/link";
import Brandmark from "@/components/Brandmark";

const SITE_LINKS = [
  { href: "/club/teams", label: "Teams" },
  { href: "/club/roster", label: "Roster" },
  { href: "/club/coaches", label: "Coaches" },
  { href: "/club/about", label: "About" },
  { href: "/club/news", label: "News" },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Brandmark size="sm" />
            <p className="mt-4 text-sm text-ink-faint">
              Junior players&apos; profiles and photos are shown here only once a guardian and the club have both
              approved it — nothing about a young player appears on this page by default.
            </p>
          </div>
          <nav aria-label="Site" className="flex flex-wrap gap-x-6 gap-y-2">
            {SITE_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="font-mono text-xs uppercase tracking-wider text-ink-dim hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/register" className="font-semibold text-flame-ink hover:underline">
              Register interest
            </Link>
            <Link href="/login" className="text-ink-dim hover:text-ink">
              Member sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
