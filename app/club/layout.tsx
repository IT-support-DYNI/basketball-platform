import type { Metadata } from "next";
import { headers } from "next/headers";
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
 *  header middleware.ts stamps onto every request — see components/NavBar.tsx.
 *
 *  The home page (`/club` exactly) is the one exception within /club/* itself:
 *  it carries its own full nav + footer, styled to the newer "DYNI Blazers
 *  Landing" design (styles/dyni-landing/) — a different visual language
 *  (warm/editorial, italic display type) from PublicHeader/PublicFooter's
 *  Tailwind styling. Stacking both here would read as two different sites,
 *  so the home page opts out of this shared chrome and supplies its own;
 *  every other /club/* page (teams, roster, coaches, about, news, individual
 *  profiles) keeps it. */
export default function ClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";
  if (pathname === "/club") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
