"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerProfileView } from "@/lib/player-profile-view";

type FlagKey = "profileListed" | "showPhoto" | "showBio" | "showStats" | "showHighlights";

interface Row {
  key: FlagKey;
  patchField: string;
  label: string;
  sublabel: string;
  /** Whether there's actually anything to show for this row right now — an
   *  admin can still publish an empty field, but the panel calls that out
   *  as "awaiting" rather than implying it's ready. */
  hasContent: boolean;
}

function StatusPill({ on, hasContent }: { on: boolean; hasContent: boolean }) {
  if (on) {
    return (
      <span className="rounded-full bg-success/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-success">
        Public
      </span>
    );
  }
  if (hasContent) {
    return (
      <span className="rounded-full bg-warning/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-warning">
        Awaiting club approval
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
      Not published
    </span>
  );
}

/**
 * "What the public can see" — read-only for the player it's about (so they
 * always know their own status), with real toggle controls only for an
 * admin. Publishing anything about a player to the public internet is
 * deliberately an admin-only call, same rule the app already applies to
 * publicProfileApproved itself — a player or coach can never flip these on
 * their own, no matter what content they've added.
 */
export default function PublicVisibilityPanel({ player }: { player: PlayerProfileView }) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<FlagKey | null>(null);
  const [error, setError] = useState("");
  const v = player.publicVisibility;
  const canManage = player.canManagePublicVisibility;

  const rows: Row[] = [
    {
      key: "profileListed",
      patchField: "publicProfileApproved",
      label: "Name and squad",
      sublabel: "Whether this player is listed on the public roster at all",
      hasContent: true,
    },
    {
      key: "showPhoto",
      patchField: "publicShowPhoto",
      label: "Photo",
      sublabel: "Their profile picture on the club site",
      hasContent: v.hasPhoto,
    },
    {
      key: "showBio",
      patchField: "publicShowBio",
      label: "Bio",
      sublabel: "The short story on their profile page",
      hasContent: v.hasBio,
    },
    {
      key: "showStats",
      patchField: "publicShowStats",
      label: "Season stats",
      sublabel: "Height, weight and hand",
      hasContent: true,
    },
    {
      key: "showHighlights",
      patchField: "publicShowHighlights",
      label: "Highlight links",
      sublabel: "Reels and external profiles",
      hasContent: v.hasHighlights,
    },
  ];

  async function toggle(row: Row, next: boolean) {
    setError("");
    setBusyKey(row.key);
    try {
      const res = await fetch(`/api/v1/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [row.patchField]: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't update that.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">What the public can see</p>
      <p className="mt-2 text-sm text-ink-dim">
        {canManage
          ? "This profile is private by default. Each row below is a separate decision, and for junior players every one of them also needs a guardian's approval before it goes live."
          : "Only an admin can publish something here — nothing you add or upload goes public on its own."}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {rows.map((row) => {
          const on = v[row.key];
          return (
            <div key={row.key} className="flex items-center justify-between gap-3 rounded-control bg-surface-2 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{row.label}</p>
                <p className="mt-0.5 text-xs text-ink-dim">{row.sublabel}</p>
              </div>
              <div className="flex flex-none items-center gap-3">
                <StatusPill on={on} hasContent={row.hasContent} />
                {canManage && (
                  <button
                    type="button"
                    onClick={() => toggle(row, !on)}
                    disabled={busyKey === row.key}
                    className="whitespace-nowrap text-xs font-semibold text-flame-ink hover:underline disabled:opacity-50"
                  >
                    {busyKey === row.key ? "…" : on ? "Make private" : "Publish"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
