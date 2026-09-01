"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";

type Item = {
  documentId: number;
  type: string;
  title: string;
  required: boolean;
  version: { id: number; version: number; body: string; publishedAt: string };
  acceptedAt: string | null;
  acceptedByGuardian: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  CODE_OF_CONDUCT: "Code of conduct",
  PRIVACY_NOTICE: "Privacy notice",
  MEDIA_CONSENT: "Photography & media",
  MEDICAL_CONSENT: "Emergency medical treatment",
  DATA_PROCESSING: "Data processing",
  TRIP_CONSENT: "Trips & travel",
  OTHER: "Club document",
};

export default function ConsentForm({
  items,
  playerProfileId,
  redirectTo,
}: {
  items: Item[];
  /** Set when a guardian is accepting for a child. */
  playerProfileId?: number;
  redirectTo: string;
}) {
  const router = useRouter();
  const pending = useMemo(() => items.filter((i) => i.acceptedAt == null), [items]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requiredPending = pending.filter((i) => i.required).map((i) => i.version.id);
  const allRequiredChecked = requiredPending.every((id) => checked.has(id));

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submit() {
    if (checked.size === 0) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/v1/consent/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionIds: [...checked], playerProfileId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't record your acceptance.");
        return;
      }
      if ((body.outstanding ?? 0) === 0) {
        router.push(redirectTo);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const accepted = item.acceptedAt != null;
        return (
          <article key={item.documentId} className="rounded-card border border-line bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-tight text-ink">{item.title}</p>
                <p className="text-xs text-ink-faint">
                  {TYPE_LABEL[item.type] ?? item.type} · v{item.version.version}
                  {item.required ? " · required" : " · optional"}
                </p>
              </div>
              {accepted ? (
                <span className="rounded-full border border-success/40 px-2.5 py-1 text-xs font-semibold text-success">
                  Accepted {new Date(item.acceptedAt!).toLocaleDateString()}
                  {item.acceptedByGuardian ? " (by guardian)" : ""}
                </span>
              ) : (
                <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={checked.has(item.version.id)}
                    onChange={() => toggle(item.version.id)}
                    className="h-4 w-4 accent-flame"
                  />
                  I accept
                </label>
              )}
            </header>
            <div className="max-h-64 overflow-y-auto whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-ink-dim">
              {item.version.body}
            </div>
          </article>
        );
      })}

      {error && <p className="text-sm text-danger">{error}</p>}

      {pending.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={busy || checked.size === 0}
            className={cn(
              "rounded-full bg-flame px-5 py-2.5 text-sm font-bold text-on-flame disabled:opacity-50",
            )}
          >
            {busy ? "Saving…" : `Accept ${checked.size || ""} selected`.trim()}
          </button>
          {requiredPending.length > 0 && !allRequiredChecked && (
            <p className="text-xs text-warning">
              You must accept every required document to continue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
