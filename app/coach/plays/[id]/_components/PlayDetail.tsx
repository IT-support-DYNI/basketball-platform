"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/toast";
import PlayView from "@/components/shared/playbook/PlayView";
import type { CourtDiagram } from "@/lib/training";
import PlayForm from "@/app/coach/plays/_components/PlayForm";

export type CoachPlay = {
  id: number;
  name: string;
  type: string;
  notes: string | null;
  courtDiagram: CourtDiagram | null;
  archived: boolean;
  createdByName: string | null;
  updatedAt: string;
  /** Every team the play is on, including ones this coach doesn't run. */
  assignedTeams: { id: number; name: string }[];
  canEdit: boolean;
};

export default function PlayDetail({
  play,
  myTeams,
}: {
  play: CoachPlay;
  /** Teams this coach (or admin) can put the play on. */
  myTeams: { id: number; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const assignedIds = new Set(play.assignedTeams.map((t) => t.id));
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(myTeams.filter((t) => assignedIds.has(t.id)).map((t) => t.id)),
  );
  const myTeamIds = new Set(myTeams.map((t) => t.id));
  const otherTeams = play.assignedTeams.filter((t) => !myTeamIds.has(t.id));
  const dirty = myTeams.some((t) => selected.has(t.id) !== assignedIds.has(t.id));

  async function saveTeams() {
    setBusy(true);
    const res = await fetch(`/api/v1/plays/${play.id}/assignments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamIds: [...selected] }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: body.error ?? "Couldn't update the teams", tone: "danger" });
      return;
    }
    const added = body.added?.length ?? 0;
    toast({
      title: added ? `Added to ${added} team${added === 1 ? "" : "s"}. Players have been notified.` : "Teams updated",
      tone: "success",
    });
    router.refresh();
  }

  async function setArchived(archived: boolean) {
    setBusy(true);
    const res = await fetch(`/api/v1/plays/${play.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    setBusy(false);
    if (res.ok) {
      toast({ title: archived ? "Play archived. Teams no longer see it." : "Play restored", tone: archived ? "warning" : "success" });
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      toast({ title: b.error ?? "Couldn't update the play", tone: "danger" });
    }
  }

  async function makeCopy() {
    setBusy(true);
    const res = await fetch("/api/v1/plays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${play.name} (copy)`.slice(0, 120),
        type: play.type,
        notes: play.notes ?? undefined,
        courtDiagram: play.courtDiagram,
      }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: body.error ?? "Couldn't copy the play", tone: "danger" });
      return;
    }
    router.push(`/coach/plays/${body.id}`);
  }

  if (editing) {
    return (
      <Card as="section">
        <PlayForm
          initial={{ id: play.id, name: play.name, type: play.type, notes: play.notes ?? "", courtDiagram: play.courtDiagram }}
          onCancel={() => setEditing(false)}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PlayView
        play={{
          name: play.name,
          type: play.type,
          notes: play.notes,
          courtDiagram: play.courtDiagram,
          teams: [],
          updatedAt: play.updatedAt,
        }}
      />

      <Card as="section">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Team playbooks</h2>
        {play.archived ? (
          <p className="mt-1.5 text-sm text-ink-dim">This play is archived, so no team can see it. Restore it to add it to a team.</p>
        ) : myTeams.length === 0 ? (
          <p className="mt-1.5 text-sm text-ink-dim">You&apos;re not assigned to a team yet. Ask an admin to add you to a team&apos;s staff.</p>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-ink-dim">
              Players on a ticked team, and their guardians, can see this play straight away and get a notification.
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {myTeams.map((t) => (
                <Checkbox
                  key={t.id}
                  label={t.name}
                  checked={selected.has(t.id)}
                  onCheckedChange={(on) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      if (on) next.add(t.id);
                      else next.delete(t.id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
            <Button className="mt-4" size="sm" onClick={saveTeams} loading={busy} disabled={!dirty}>
              Save teams
            </Button>
          </>
        )}
        {otherTeams.length > 0 && (
          <p className="mt-3 text-xs text-ink-faint">Also in the playbook of: {otherTeams.map((t) => t.name).join(", ")}</p>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {play.canEdit && (
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {play.archived ? (
              <Button variant="ghost" disabled={busy} onClick={() => setArchived(false)}>
                Restore
              </Button>
            ) : (
              <Button variant="ghost" disabled={busy} onClick={() => setArchived(true)}>
                Archive
              </Button>
            )}
          </>
        )}
        <Button variant="ghost" disabled={busy} onClick={makeCopy}>
          Make a copy
        </Button>
        <Link href="/coach/plays" className="text-sm font-semibold text-ink-dim hover:text-ink">
          ← All plays
        </Link>
      </div>
      {!play.canEdit && play.createdByName && (
        <p className="text-xs text-ink-faint">
          Created by {play.createdByName}. Only they can edit it; make a copy to change your own version.
        </p>
      )}
    </div>
  );
}
