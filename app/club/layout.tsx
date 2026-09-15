import type { Metadata } from "next";
import localFont from "next/font/local";

import "@/app/club/_styles/tokens.css";
import "@/app/club/_styles/landing.css";

// Self-hosted as static files (next/font/local) rather than next/font/google
// — two reasons. First, the one this comment originally covered: the site's
// CSP (next.config.mjs) is 'self'-only for style-src/font-src, and even with
// an allowance added, a same-stylesheet @import that isn't the very first
// rule is silently dropped by the CSS spec once the local tokens/*.css files
// get bundled together, so a plain <link>/@import to fonts.googleapis.com
// was never going to work cleanly. Second: next/font/google still means
// fetching from Google's servers at every cold build/dev-compile — a hard
// dependency on reaching fonts.gstatic.com at exactly that moment, which on
// a flaky/filtered connection means every page compile hangs through several
// retries before falling back to a system font. Bundling the actual woff2
// files (app/fonts/, shared with the root layout) removes that network
// round-trip entirely.
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-italic-400.woff2", weight: "400", style: "italic" },
    { path: "../fonts/fraunces-italic-600.woff2", weight: "600", style: "italic" },
  ],
  variable: "--nf-quote",
});
const ibmPlexMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-mono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--nf-mono",
});
const inter = localFont({
  src: [
    { path: "../fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/inter-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--nf-body",
});
// The site's one display face — bold, condensed, italic (matching
// dyni-blazers' voice). Used for every heading as well as the player/coach
// profile "stat card" banners (an NBA.com-style player-page layout), which
// share the same broadcast-scoreboard read as the rest of the site now.
const bigShouldersDisplay = localFont({
  src: [
    { path: "../fonts/big-shoulders-display-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/big-shoulders-display-800.woff2", weight: "800", style: "normal" },
    { path: "../fonts/big-shoulders-display-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--nf-condensed",
});

import ScrollProgressBar from "@/app/club/_components/ScrollProgressBar";
import LandingNav from "@/app/club/_components/LandingNav";
import LandingFooter from "@/app/club/_components/LandingFooter";

// The root layout (app/layout.tsx) already defines the "%s · DYNI Blazers"
// template — redeclaring it here made a page with no title of its own read
// "DYNI Blazers · DYNI Blazers" in the tab (Next applies the nearest
// template, then the root's, in sequence). Description-only override.
export const metadata: Metadata = {
  description: "DYNI Blazers basketball club — teams, players and coaches.",
};

/** The public club site's own shell — separate from the internal app's
 *  layout on purpose. No AppContainer, no PrimaryNav: a visitor here has no
 *  account and shouldn't see chrome built for one. NavBar (rendered from the
 *  root layout above this) suppresses itself on /club/* via the pathname
 *  header middleware.ts stamps onto every request — see components/NavBar.tsx.
 *
 *  Every /club/* page shares the same "DYNI Blazers Landing" design
 *  (app/club/_styles/, app/club/_components/) — nav, footer and scroll-progress bar live here so
 *  every page gets them for free instead of redeclaring them; a page that
 *  used the old Tailwind-styled PublicHeader/PublicFooter here would look
 *  like two different sites stitched together. */
export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`dyni-landing ${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable} ${bigShouldersDisplay.variable}`}
    >
      <ScrollProgressBar />
      <LandingNav />
      {children}
      <LandingFooter />
    </div>
  );
}
