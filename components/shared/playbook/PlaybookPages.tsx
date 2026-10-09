import Link from "next/link";
import { notFound } from "next/navigation";
import type { Session } from "next-auth";

import { listPlaybook, playbookPlay, playbookTeamIds } from "@/lib/plays";
import type { CourtDiagram } from "@/lib/training";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/states";
import PlaybookList from "./PlaybookList";
import PlayView from "./PlayView";

/**
 * The team playbook for a player (`/player/playbook`) or a guardian
 * (`/guardian/playbook`). Both read through playbookTeamIds, so each only ever
 * sees plays assigned to their own (or their children's) current teams.
 */
export async function PlaybookIndex({ session, basePath }: { session: Session; basePath: string }) {
  const teamIds = await playbookTeamIds(session);
  const plays = await listPlaybook(teamIds);
  const guardian = session.user.role === "GUARDIAN";
  const multiTeam = teamIds.length > 1;

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow={guardian ? "Guardian" : "Player"}
        title="Playbook"
        lead={
          guardian
            ? "The plays your child's coach has shared with their team."
            : "The plays your coach wants the team to know. Learn the calls and your job in each one."
        }
      />
      {plays.length === 0 ? (
        <EmptyState
          title="No plays yet"
          description={
            teamIds.length === 0
              ? guardian
                ? "Plays appear here once your child is on a team."
                : "Plays appear here once you're on a team."
              : "Your coach hasn't added any plays yet. You'll get a notification when they do."
          }
        />
      ) : (
        <PlaybookList
          basePath={basePath}
          plays={plays.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            courtDiagram: p.courtDiagram as CourtDiagram | null,
            meta: multiTeam ? p.assignments.map((a) => a.team.name).join(", ") : undefined,
          }))}
        />
      )}
    </main>
  );
}

export async function PlaybookPlay({ session, id, basePath }: { session: Session; id: string; basePath: string }) {
  const play = await playbookPlay(await playbookTeamIds(session), Number(id));
  if (!play) notFound();

  return (
    <main className="flex flex-col gap-6">
      <PageHeader eyebrow="Playbook" title={play.name} />
      <PlayView
        play={{
          name: play.name,
          type: play.type,
          notes: play.notes,
          courtDiagram: play.courtDiagram as CourtDiagram | null,
          teams: play.assignments.map((a) => a.team.name),
          updatedAt: play.updatedAt,
        }}
      />
      <Link href={basePath} className="text-sm font-semibold text-ink-dim hover:text-ink">
        ← Back to playbook
      </Link>
    </main>
  );
}
