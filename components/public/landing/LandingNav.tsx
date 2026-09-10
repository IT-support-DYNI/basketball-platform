"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggleButton from "./ThemeToggleButton";

const NAV_LINKS = [
  { href: "/club", label: "Home" },
  { href: "/club/roster", label: "Players" },
  { href: "/club/coaches", label: "Coaches" },
  { href: "/club/moments", label: "Moments" },
  { href: "/club/news", label: "News" },
  { href: "/club/about", label: "About" },
];

/** The landing design's header — shared across every /club/* page (rendered
 *  from app/club/layout.tsx). Sticky, translucent over whatever's scrolled
 *  beneath it (`.nav`'s `backdrop-filter: blur` + `color-mix` background in
 *  landing.css), shrinking past a scroll threshold, and — below 900px, where
 *  `.nav-links` hides — a hamburger opens a dropdown panel with the same
 *  links plus theme/sign-in/join, so mobile visitors (most of a real club
 *  site's traffic) still have a way to get around the site. */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/club" ? pathname === "/club" : pathname?.startsWith(href));

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-in">
        <Link className="brand" href="/club">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/dyni-blazers-crest.png" alt="DYNI Blazers" />
          <span className="wordmark">
            DYNI <span>Blazers</span>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Site">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-act">
          <ThemeToggleButton />
          <Link className="signin" href="/login">
            Sign in
          </Link>
          <Link className="btn btn-primary btn-sm" href="/register">
            Join the club
          </Link>
        </div>
        <button
          type="button"
          className="nav-burger"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="nav-mobile-panel">
          <nav aria-label="Site">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="nav-mobile-act">
            <ThemeToggleButton />
            <Link className="btn btn-secondary btn-sm" href="/login">
              Sign in
            </Link>
            <Link className="btn btn-primary btn-sm" href="/register">
              Join the club
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
