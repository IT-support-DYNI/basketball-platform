"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TeamOption { id: number; name: string; }

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

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-slate-700">Assign to team:</label>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-court-500">
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <textarea
        placeholder="Note to the applicant (required for reject/request changes, optional for approve)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      />

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!!loading} onClick={() => submit("APPROVE")}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading === "APPROVE" ? "Approving..." : "Approve"}
        </button>
        <button type="button" disabled={!!loading} onClick={() => submit("REQUEST_CHANGES")}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading === "REQUEST_CHANGES" ? "Sending..." : "Request changes"}
        </button>
        <button type="button" disabled={!!loading} onClick={() => submit("REJECT")}
          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading === "REJECT" ? "Rejecting..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
