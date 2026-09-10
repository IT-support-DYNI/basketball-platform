import type { Metadata } from "next";

import "@/styles/dyni-landing/tokens.css";
import "@/styles/dyni-landing/landing.css";

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
    <div className="dyni-landing">
      <ScrollProgressBar />
      <LandingNav />
      {children}
      <LandingFooter />
    </div>
  );
}
