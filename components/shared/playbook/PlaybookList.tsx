import Link from "next/link";

import { groupByType, PLAY_TYPE_LABEL } from "@/lib/playbook";
import { describeDiagram, type CourtDiagram } from "@/lib/training";

export type PlaybookListItem = {
  id: number;
  name: string;
  type: string;
  courtDiagram: CourtDiagram | null;
  /** Shown under the name: team names, author, "Archived"… */
  meta?: string;
};

/** Plays grouped by type as cards linking to `${basePath}/${id}`. */
export default function PlaybookList({ plays, basePath }: { plays: PlaybookListItem[]; basePath: string }) {
  return (
    <div className="flex flex-col gap-6">
      {groupByType(plays).map(([type, list]) => (
        <section key={type}>
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            {PLAY_TYPE_LABEL[type]} · {list.length}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.id}>
                <Link
                  href={`${basePath}/${p.id}`}
                  className="flex h-full flex-col rounded-card border border-line bg-surface p-4 transition hover:border-line-strong"
                >
                  <p className="font-semibold text-ink">{p.name}</p>
                  {p.meta && <p className="mt-1 text-sm text-ink-dim">{p.meta}</p>}
                  <p className="mt-3 text-xs text-ink-faint">{describeDiagram(p.courtDiagram)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
