"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  ["CODE_OF_CONDUCT", "Code of conduct"],
  ["PRIVACY_NOTICE", "Privacy notice"],
  ["MEDIA_CONSENT", "Photography & media"],
  ["MEDICAL_CONSENT", "Emergency medical treatment"],
  ["DATA_PROCESSING", "Data processing"],
  ["TRIP_CONSENT", "Trips & travel"],
  ["OTHER", "Other"],
] as const;

type Doc = {
  id: number;
  type: string;
  title: string;
  requiredForPlayers: boolean;
  active: boolean;
  currentVersion: { version: number; publishedAt: string } | null;
  acceptedCount: number;
};

const field = "w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm";

export default function ConsentManager({ docs }: { docs: Doc[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [nt, setNt] = useState({ type: "CODE_OF_CONDUCT", title: "", body: "", requiredForPlayers: true });
  const [publishFor, setPublishFor] = useState<number | null>(null);
  const [publishBody, setPublishBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(url: string, method: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Documents</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-dim hover:text-ink"
        >
          {creating ? "Cancel" : "+ New document"}
        </button>
      </div>

      {creating && (
        <form
          className="space-y-3 rounded-card border border-line bg-surface p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await call("/api/v1/consent-documents", "POST", nt)) {
              setCreating(false);
              setNt({ type: "CODE_OF_CONDUCT", title: "", body: "", requiredForPlayers: true });
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={nt.type} onChange={(e) => setNt({ ...nt, type: e.target.value })} className={field}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input required placeholder="Title" value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} className={field} />
          </div>
          <textarea
            required
            placeholder="Full text of the document…"
            value={nt.body}
            onChange={(e) => setNt({ ...nt, body: e.target.value })}
            rows={6}
            className={field}
          />
          <label className="flex items-center gap-2 text-sm text-ink-dim">
            <input type="checkbox" checked={nt.requiredForPlayers} onChange={(e) => setNt({ ...nt, requiredForPlayers: e.target.checked })} className="h-4 w-4 accent-flame" />
            Required — players must accept before using the app
          </label>
          <button disabled={busy} className="rounded-full bg-flame px-5 py-2 text-sm font-bold text-on-flame disabled:opacity-50">
            Publish
          </button>
        </form>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <ul className="space-y-3">
        {docs.map((d) => (
          <li key={d.id} className="rounded-card border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold text-ink">{d.title}</p>
                <p className="text-xs text-ink-faint">
                  {d.currentVersion ? `v${d.currentVersion.version}` : "no version"} ·{" "}
                  {d.acceptedCount} accepted{" "}
                  {!d.active && "· retired"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button
                  onClick={() => call(`/api/v1/consent-documents/${d.id}`, "PATCH", { requiredForPlayers: !d.requiredForPlayers })}
                  className="rounded-full border border-line px-3 py-1 text-ink-dim hover:text-ink"
                >
                  {d.requiredForPlayers ? "Required" : "Optional"}
                </button>
                <button
                  onClick={() => call(`/api/v1/consent-documents/${d.id}`, "PATCH", { active: !d.active })}
                  className="rounded-full border border-line px-3 py-1 text-ink-dim hover:text-ink"
                >
                  {d.active ? "Active" : "Retired"}
                </button>
                <button
                  onClick={() => { setPublishFor(publishFor === d.id ? null : d.id); setPublishBody(""); }}
                  className="rounded-full border border-line px-3 py-1 text-flame-ink"
                >
                  New version
                </button>
              </div>
            </div>

            {publishFor === d.id && (
              <form
                className="mt-3 space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await call(`/api/v1/consent-documents/${d.id}/versions`, "POST", { body: publishBody })) {
                    setPublishFor(null);
                  }
                }}
              >
                <textarea required value={publishBody} onChange={(e) => setPublishBody(e.target.value)} rows={5} className={field} placeholder="Updated text…" />
                <p className="text-xs text-warning">Publishing a new version asks every player to re-accept.</p>
                <button disabled={busy} className="rounded-full bg-flame px-4 py-1.5 text-xs font-bold text-on-flame disabled:opacity-50">
                  Publish version
                </button>
              </form>
            )}
          </li>
        ))}
        {docs.length === 0 && <li className="text-sm text-ink-dim">No documents yet.</li>}
      </ul>
    </div>
  );
}
