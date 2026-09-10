import type { Metadata } from "next";

import { getPublicPlayers } from "@/lib/public-site";
import RosterFilterGrid from "@/components/public/landing/RosterFilterGrid";

export const metadata: Metadata = { title: "Roster" };

export default async function PublicRosterPage() {
  const players = await getPublicPlayers(500);

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Roster</p>
          <h1>The squad.</h1>
          <p className="lead">
            Every profile here is published with the player&apos;s — and for juniors, their guardian&apos;s —
            explicit permission. Players who haven&apos;t opted in simply don&apos;t appear.
          </p>
        </div>
      </section>
      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          <RosterFilterGrid players={players} />
        </div>
      </section>
    </main>
  );
}
