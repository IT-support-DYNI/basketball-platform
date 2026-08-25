"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface PlayerOption { id: number; name: string; }

export default function WriteFeedbackForm({ players }: { players: PlayerOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState(players[0]?.id?.toString() ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: Number(playerId), message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }

      setMessage("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (players.length === 0) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
        + Write Feedback
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20">
        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <textarea placeholder="Feedback message" value={message} onChange={(e) => setMessage(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50">
          {loading ? "Sending..." : "Send feedback"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
