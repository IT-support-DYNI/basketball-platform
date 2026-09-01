"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface TeamOption {
  id: number;
  name: string;
}

export default function ReviewRegistrationForm({
  playerId,
  teams,
  defaultTeamId,
}: {
  playerId: number;
  teams: TeamOption[];
  defaultTeamId: number | null;
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(defaultTeamId?.toString() ?? teams[0]?.id?.toString() ?? "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function submit(decision: "APPROVE" | "REJECT" | "REQUEST_CHANGES") {
    setError("");
    if (decision === "APPROVE" && !teamId) {
      setError("Choose a team before approving.");
      return;
    }
    setLoading(decision);
    try {
      const res = await fetch(`/api/v1/registrations/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note: note || undefined,
          teamId: decision === "APPROVE" ? Number(teamId) : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const noteId = `review-note-${playerId}`;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-control border border-line bg-surface-2 p-4">
      <div className="max-w-xs">
        <Select label="Assign to team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="text-sm font-semibold text-ink">
          Note to the applicant
        </label>
        <p className="text-xs text-ink-dim">Required for reject / request changes, optional for approve.</p>
        <textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-flame/50"
        />
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={loading === "APPROVE"} disabled={!!loading} onClick={() => submit("APPROVE")}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={loading === "REQUEST_CHANGES"}
          disabled={!!loading}
          onClick={() => submit("REQUEST_CHANGES")}
        >
          Request changes
        </Button>
        <Button
          size="sm"
          variant="destructive"
          loading={loading === "REJECT"}
          disabled={!!loading}
          onClick={() => submit("REJECT")}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
