import type { Metadata } from "next";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

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
 *  header middleware.ts stamps onto every request — see components/NavBar.tsx. */
export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
