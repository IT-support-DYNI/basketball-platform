import type { Metadata } from "next";
import { Architects_Daughter, Fraunces, IBM_Plex_Mono } from "next/font/google";

import "@/styles/dyni-landing/tokens.css";
import "@/styles/dyni-landing/landing.css";

// Self-hosted via next/font instead of a CSS @import from fonts.googleapis.com
// — the site's CSP (next.config.mjs) is 'self'-only for style-src/font-src,
// and even with an allowance added, a same-stylesheet @import that isn't the
// very first rule is silently dropped by the CSS spec once the local
// tokens/*.css files get bundled together. next/font sidesteps both: it
// downloads the font at build time and serves it same-origin.
const architectsDaughter = Architects_Daughter({ subsets: ["latin"], weight: "400", variable: "--nf-display" });
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
  variable: "--nf-quote",
});
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--nf-mono" });

import ScrollProgressBar from "@/components/public/landing/ScrollProgressBar";
import LandingNav from "@/components/public/landing/LandingNav";
import LandingFooter from "@/components/public/landing/LandingFooter";

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
 *  (styles/dyni-landing/) — nav, footer and scroll-progress bar live here so
 *  every page gets them for free instead of redeclaring them; a page that
 *  used the old Tailwind-styled PublicHeader/PublicFooter here would look
 *  like two different sites stitched together. */
export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`dyni-landing ${architectsDaughter.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}>
      <ScrollProgressBar />
      <LandingNav />
      {children}
      <LandingFooter />
    </div>
  );
}
