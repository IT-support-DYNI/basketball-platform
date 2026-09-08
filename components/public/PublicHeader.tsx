import Link from "next/link";
import Brandmark from "@/components/Brandmark";

const LINKS = [
  { href: "/club#teams", label: "Teams" },
  { href: "/club#players", label: "Players" },
  { href: "/club#coaches", label: "Coaches" },
];

/** Header for the public club site — deliberately its own thing, not
 *  PrimaryNav wearing a costume. No account menu, no notification bell,
 *  nothing that assumes a logged-in member; just enough to get a visitor
 *  around a handful of sections and to the sign-in/registration flow. */
export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Brandmark size="sm" href="/club" />
        <nav aria-label="Site" className="hidden items-center gap-6 sm:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="font-mono text-xs uppercase tracking-wider text-ink-dim transition hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink-dim transition hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-br from-flame to-ember px-4 py-1.5 text-sm font-bold text-on-flame shadow-[0_0_18px_-3px_rgb(var(--flame)/0.55)] transition hover:brightness-110"
          >
            Join the club
          </Link>
        </div>
      </div>
    </header>
  );
}
