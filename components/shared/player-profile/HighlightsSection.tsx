"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Highlight = { id: number; title: string; url: string };

/** A YouTube/Vimeo-style watch icon — kept generic since a highlight can
 *  point anywhere the player has it hosted. */
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-none text-flame-ink" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
    </svg>
  );
}

/**
 * A player's highlight reel — links out to video they already have hosted
 * elsewhere (YouTube, Vimeo, Hudl…), rendered as a plain outbound link, never
 * embedded. In edit mode (the player's own profile) they can add and remove
 * their own entries; everyone else just sees the list, gated the same way
 * bio/photo already are (club-visible always, public only once a guardian/
 * admin has approved it — see lib/player-profile-view.ts).
 */
export default function HighlightsSection({
  playerId,
  initial,
  editable,
}: {
  playerId: number;
  initial: Highlight[];
  editable: boolean;
}) {
  const router = useRouter();
  const [highlights, setHighlights] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addHighlight(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/players/${playerId}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't add that link — check the URL is valid.");
        return;
      }
      setHighlights((prev) => [body, ...prev]);
      setTitle("");
      setUrl("");
      setAdding(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeHighlight(id: number) {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    await fetch(`/api/v1/players/${playerId}/highlights/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (!editable && highlights.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Highlights</p>
        {editable && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs font-semibold text-flame-ink hover:underline"
          >
            + Add a clip
          </button>
        )}
      </div>

      {highlights.length === 0 && !adding && (
        <p className="mt-2 text-sm text-ink-dim">
          {editable ? "Add a link to a highlight clip — YouTube, Vimeo, Hudl, anywhere it's hosted." : "No highlights yet."}
        </p>
      )}

      {highlights.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {highlights.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface-2 px-3 py-2">
              <a
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink hover:text-flame-ink"
              >
                <PlayIcon />
                <span className="truncate">{h.title}</span>
              </a>
              {editable && (
                <button
                  type="button"
                  onClick={() => removeHighlight(h.id)}
                  aria-label={`Remove ${h.title}`}
                  className="flex-none text-xs font-semibold text-ink-faint hover:text-danger"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form onSubmit={addHighlight} className="mt-3 flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={'Title — e.g. "U16 vs Northgate — 24pts"'}
            required
            maxLength={80}
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-flame-ink"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://youtube.com/..."
            required
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-flame-ink"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-full bg-flame px-4 py-1.5 text-xs font-bold text-on-flame disabled:opacity-50">
              {busy ? "Adding…" : "Add"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-full px-4 py-1.5 text-xs font-semibold text-ink-dim hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
