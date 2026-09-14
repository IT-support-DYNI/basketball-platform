import type { Metadata } from "next";
import { Big_Shoulders_Display, Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";

import "@/app/club/_styles/tokens.css";
import "@/app/club/_styles/landing.css";

// Self-hosted via next/font instead of a CSS @import from fonts.googleapis.com
// — the site's CSP (next.config.mjs) is 'self'-only for style-src/font-src,
// and even with an allowance added, a same-stylesheet @import that isn't the
// very first rule is silently dropped by the CSS spec once the local
// tokens/*.css files get bundled together. next/font sidesteps both: it
// downloads the font at build time and serves it same-origin.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  variable: "--nf-quote",
});
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--nf-mono" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--nf-body" });
// The site's one display face — bold, condensed, italic (matching
// dyni-blazers' voice). Used for every heading as well as the player/coach
// profile "stat card" banners (an NBA.com-style player-page layout), which
// share the same broadcast-scoreboard read as the rest of the site now.
const bigShouldersDisplay = Big_Shoulders_Display({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--nf-condensed" });

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
