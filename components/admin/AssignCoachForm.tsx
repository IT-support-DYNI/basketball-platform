"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface CoachOption {
  coachProfileId: number;
  name: string;
  email: string;
}

export default function AssignCoachForm({ teamId, options }: { teamId: number; options: CoachOption[] }) {
  const router = useRouter();
  const [coachProfileId, setCoachProfileId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!coachProfileId) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/coaches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachProfileId: Number(coachProfileId) }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }

      setCoachProfileId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (options.length === 0) {
    return <p className="text-sm text-slate-500">No unassigned coaches — add one from Users first.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <select
        value={coachProfileId}
        onChange={(e) => setCoachProfileId(e.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      >
        <option value="">Select a coach...</option>
        {options.map((c) => (
          <option key={c.coachProfileId} value={c.coachProfileId}>
            {c.name} ({c.email})
          </option>
        ))}
      </select>
      <button type="submit" disabled={loading || !coachProfileId} className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? "Assigning..." : "Assign"}
      </button>
      {error && <p className="text-sm text-rose-700">{error}</p>}
    </form>
  );
}
