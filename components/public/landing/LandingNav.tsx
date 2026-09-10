"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggleButton from "./ThemeToggleButton";

const NAV_LINKS = [
  { href: "#top", label: "Home", current: true },
  { href: "#roster", label: "Players" },
  { href: "#coaches", label: "Coaches" },
  { href: "#moments", label: "Moments" },
  { href: "#news", label: "News" },
  { href: "#about", label: "About" },
];

/** The landing page's own header — sticky, translucent over whatever's
 *  scrolled beneath it (`.nav`'s `backdrop-filter: blur` + `color-mix`
 *  background in landing.css), and shrinking past a scroll threshold, same
 *  idea as components/public/PublicHeader.tsx's scroll treatment elsewhere
 *  on /club/*. */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-in">
        <a className="brand" href="#top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/dyni-blazers-crest.png" alt="DYNI Blazers" />
          <span className="wordmark">
            DYNI <span>Blazers</span>
          </span>
        </a>
        <nav className="nav-links" aria-label="Site">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} aria-current={l.current ? "page" : undefined}>
              {l.label}
            </a>
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
      </div>
    </header>
  );
}
