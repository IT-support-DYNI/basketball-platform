"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface TeamOption { id: number; name: string; }

export default function PostAnnouncementForm({ teams }: { teams: TeamOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id?.toString() ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, scope: "TEAM", teamId: Number(teamId) }),
      });

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "Something went wrong.");
        return;
      }

      setTitle("");
      setBody("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (teams.length === 0) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-court-500/30 transition hover:shadow-md">
        + Send Announcement
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-surface p-5 space-y-4">
      <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20">
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
      <textarea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50">
          {loading ? "Posting..." : "Post"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
