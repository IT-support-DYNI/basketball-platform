"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTeamForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ageGroup: ageGroup || undefined, description: description || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }

      setName("");
      setAgeGroup("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-court-500/30 transition hover:shadow-md"
      >
        + Create Team
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-surface p-5 space-y-4">
      <input
        type="text"
        placeholder="Team name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      />
      <input
        type="text"
        placeholder="Age group (e.g. U16)"
        value={ageGroup}
        onChange={(e) => setAgeGroup(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      />

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50">
          {loading ? "Creating..." : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
