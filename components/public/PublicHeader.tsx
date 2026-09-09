"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Brandmark from "@/components/Brandmark";

const LINKS = [
  { href: "/club", label: "Home" },
  { href: "/club/teams", label: "Teams" },
  { href: "/club/roster", label: "Roster" },
  { href: "/club/coaches", label: "Coaches" },
  { href: "/club/about", label: "About" },
];

/** Header for the public club site — deliberately its own thing, not
 *  PrimaryNav wearing a costume. No account menu, no notification bell,
 *  nothing that assumes a logged-in member; just enough to get a visitor
 *  around the site and to the sign-in/registration flow.
 *
 *  Shrinks on scroll (a hair of Thuze/Paris-Basketball chrome) and carries
 *  its own mobile menu — the desktop-only nav here was a recorded gap in
 *  docs/DESIGN-MIGRATION.md §6; fixed alongside adopting this design pass. */
export default function PublicHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/club" ? pathname === "/club" : pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-40 border-b border-line bg-ground/90 backdrop-blur-md transition-[padding] duration-300 ${scrolled ? "py-1.5" : "py-3"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Brandmark size={scrolled ? "sm" : "md"} href="/club" className="transition-all duration-300" />
        <nav aria-label="Site" className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b pb-0.5 font-mono text-xs uppercase tracking-wider transition ${
                isActive(l.href) ? "border-flame text-ink" : "border-transparent text-ink-dim hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink-dim transition hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-br from-flame to-ember px-4 py-1.5 text-sm font-bold text-on-flame shadow-[0_0_18px_-3px_rgb(var(--flame)/0.55)] transition hover:brightness-110"
          >
            Join the club
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line text-ink transition hover:border-line-strong lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-line px-5 py-4 lg:hidden">
          <nav aria-label="Site" className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2.5 font-mono text-xs uppercase tracking-wider transition ${
                  isActive(l.href) ? "bg-flame/10 text-flame-ink" : "text-ink-dim hover:bg-surface hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <Link href="/login" className="flex-1 rounded-full border border-line px-4 py-2 text-center text-sm font-semibold text-ink-dim transition hover:text-ink">
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex-1 rounded-full bg-gradient-to-br from-flame to-ember px-4 py-2 text-center text-sm font-bold text-on-flame"
            >
              Join the club
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
