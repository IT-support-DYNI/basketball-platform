"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Highlight = { id: number; title: string; url: string; uploaded?: boolean };

/** A YouTube/Vimeo-style watch icon — kept generic since a linked highlight
 *  can point anywhere the player has it hosted. */
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-none text-flame-on-bg" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
    </svg>
  );
}

/**
 * A player's highlight reel — either a link to video they already have
 * hosted elsewhere (YouTube, Vimeo, Hudl…), rendered as a plain outbound
 * link, or a clip uploaded straight to storage, rendered inline. In edit
 * mode (the player's own profile) they can add and remove their own
 * entries; everyone else just sees the list, gated the same way bio/photo
 * already are (club-visible always, public only once a guardian/admin has
 * approved it — see lib/player-profile-view.ts).
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [highlights, setHighlights] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addHighlight(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "upload" && !file) {
      setError("Choose a video file first.");
      return;
    }
    setBusy(true);
    try {
      let body: Record<string, unknown>;

      if (mode === "upload" && file) {
        const urlRes = await fetch(`/api/v1/players/${playerId}/highlight-upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type || "video/mp4" }),
        });
        const urlBody = await urlRes.json();
        if (!urlRes.ok) {
          setError(urlBody.error ?? "Couldn't start the upload.");
          return;
        }
        let putRes: Response;
        try {
          putRes = await fetch(urlBody.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "video/mp4" },
            body: file,
          });
        } catch {
          setError("Upload failed. Please try again, or contact your site administrator if this keeps happening.");
          return;
        }
        if (!putRes.ok) {
          setError("Upload failed. Please try again, or contact your site administrator if this keeps happening.");
          return;
        }
        body = { title, storageKey: urlBody.key };
      } else {
        body = { title, url };
      }

      const res = await fetch(`/api/v1/players/${playerId}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resBody = await res.json();
      if (!res.ok) {
        setError(resBody.error ?? "Couldn't add that clip.");
        return;
      }
      setHighlights((prev) => [resBody, ...prev]);
      setTitle("");
      setUrl("");
      setFile(null);
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
            className="text-xs font-semibold text-flame-on-bg hover:underline"
          >
            + Add a clip
          </button>
        )}
      </div>

      {highlights.length === 0 && !adding && (
        <p className="mt-2 text-sm text-ink-dim">
          {editable ? "Add a highlight — link to where it's hosted, or upload the clip directly." : "No highlights yet."}
        </p>
      )}

      {highlights.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {highlights.map((h) => (
            <li key={h.id} className="rounded-control border border-line bg-surface-2 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                {h.uploaded ? (
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                    <PlayIcon />
                    <span className="truncate">{h.title}</span>
                  </span>
                ) : (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink hover:text-flame-on-bg"
                  >
                    <PlayIcon />
                    <span className="truncate">{h.title}</span>
                  </a>
                )}
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
              </div>
              {h.uploaded && (
                // eslint-disable-next-line jsx-a11y/media-has-caption -- player-uploaded clip, no caption track exists
                <video controls preload="none" src={h.url} className="mt-2 w-full max-w-sm rounded-control bg-black" />
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form onSubmit={addHighlight} className="mt-3 flex flex-col gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode("link")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "link" ? "border-flame/40 bg-flame/10 text-flame-on-bg" : "border-line text-ink-dim hover:text-ink"}`}
            >
              Paste a link
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "upload" ? "border-flame/40 bg-flame/10 text-flame-on-bg" : "border-line text-ink-dim hover:text-ink"}`}
            >
              Upload a video
            </button>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={'Title — e.g. "U16 vs Northgate — 24pts"'}
            required
            maxLength={80}
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-flame-ink"
          />
          {mode === "link" ? (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              placeholder="https://youtube.com/..."
              required
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-flame-ink"
            />
          ) : (
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm"
            />
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-full bg-flame px-4 py-1.5 text-xs font-bold text-on-flame disabled:opacity-50">
              {busy ? (mode === "upload" ? "Uploading…" : "Adding…") : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setFile(null);
                setUrl("");
              }}
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-ink-dim hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
