"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TeamOption { id: number; name: string; }

export default function AssignVideoForm({ videoId, teams }: { videoId: number; teams: TeamOption[] }) {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAssign() {
    if (!teamId) return;
    setLoading(true);
    try {
      await fetch(`/api/v1/videos/${videoId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: [Number(teamId)] }),
      });
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-court-500">
        <option value="">Assign to team...</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button type="button" onClick={handleAssign} disabled={loading || !teamId} className="rounded-full bg-flame px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
        {loading ? "..." : done ? "Assigned ✓" : "Assign"}
      </button>
    </div>
  );
}
