import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { listPlayLibrary } from "@/lib/plays";
import { PLAY_TYPES, PLAY_TYPE_LABEL, type PlayType } from "@/lib/playbook";
import type { CourtDiagram } from "@/lib/training";
import PageHeader from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/states";
import PlaybookList from "@/components/shared/playbook/PlaybookList";

export const metadata = { title: "Plays" };

const input =
  "rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50";

export default async function CoachPlaysPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; archived?: string };
}) {
  const session = await getServerSession(authOptions);
  const { clubId } = await getTenantContext(session!);
  const type = PLAY_TYPES.includes(searchParams.type as PlayType) ? (searchParams.type as PlayType) : null;
  const archived = searchParams.archived === "1";
  const plays = await listPlayLibrary(clubId, { type, q: searchParams.q?.trim() || null, includeArchived: archived });
  const filtered = !!(type || searchParams.q || archived);

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Coach"
        title="Plays"
        lead="The club's shared play library. Draw a play once, then add it to your team's playbook so players can learn it."
        actions={<ButtonLink href="/coach/plays/new">New play</ButtonLink>}
      />

      <form className="flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-dim">
          Search
          <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Play name" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-dim">
          Type
          <select name="type" defaultValue={type ?? ""} className={input}>
            <option value="">All types</option>
            {PLAY_TYPES.map((t) => (
              <option key={t} value={t}>
                {PLAY_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-dim">
          <input type="checkbox" name="archived" value="1" defaultChecked={archived} /> Include archived
        </label>
        <button type="submit" className="rounded-control border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-line-strong">
          Filter
        </button>
      </form>

      {plays.length === 0 ? (
        <EmptyState
          title={filtered ? "No plays match" : "No plays yet"}
          description={filtered ? "Try a different search or type." : "Draw your first play and add it to your team's playbook."}
          action={filtered ? undefined : { label: "New play", href: "/coach/plays/new" }}
        />
      ) : (
        <PlaybookList
          basePath="/coach/plays"
          plays={plays.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            courtDiagram: p.courtDiagram as CourtDiagram | null,
            meta: [
              p.archivedAt ? "Archived" : null,
              p.assignments.length ? `On: ${p.assignments.map((a) => a.team.name).join(", ")}` : "Not on any team yet",
              p.createdBy?.name ? `by ${p.createdBy.name}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      )}
    </main>
  );
}
