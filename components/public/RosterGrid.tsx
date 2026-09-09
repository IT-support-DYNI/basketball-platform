"use client";

import { useMemo, useState } from "react";
import type { PublicPlayerCard } from "@/lib/public-site";
import PersonCard from "@/components/public/PersonCard";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
        active
          ? "border-transparent bg-gradient-to-br from-flame to-ember text-on-flame"
          : "border-line bg-surface text-ink-dim hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Client-side filter, not a server round-trip — the whole approved roster
 *  is small enough (a club, not a league) that fetching it once and slicing
 *  it in the browser is simpler and snappier than paginated query params. */
export default function RosterGrid({ players }: { players: PublicPlayerCard[] }) {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);

  const ageGroups = useMemo(
    () => Array.from(new Set(players.map((p) => p.ageGroup).filter((v): v is string => !!v))).sort(),
    [players],
  );
  const positions = useMemo(
    () =>
      Array.from(new Set(players.map((p) => p.position).filter((v): v is string => !!v))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [players],
  );
  const positionLabel = (code: string) => players.find((p) => p.position === code)?.positionLabel ?? code;

  const filtered = players.filter(
    (p) => (!ageGroup || p.ageGroup === ageGroup) && (!position || p.position === position),
  );

  return (
    <div>
      {(ageGroups.length > 0 || positions.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">Filter</span>
          <Chip active={ageGroup === null} onClick={() => setAgeGroup(null)}>
            All ages
          </Chip>
          {ageGroups.map((g) => (
            <Chip key={g} active={ageGroup === g} onClick={() => setAgeGroup(g === ageGroup ? null : g)}>
              {g}
            </Chip>
          ))}
          {positions.length > 0 && <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />}
          {positions.map((code) => (
            <Chip key={code} active={position === code} onClick={() => setPosition(code === position ? null : code)}>
              {positionLabel(code)}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <PersonCard
            key={p.id}
            href={`/club/players/${p.id}`}
            name={p.name}
            photoUrl={p.photoUrl}
            line={[p.positionLabel, p.team].filter(Boolean).join(" · ") || null}
            bio={p.bio}
            jerseyNumber={p.jerseyNumber}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-sm text-ink-dim">
          {players.length === 0 ? "No player profiles are public yet — check back soon." : "No players match that filter."}
        </p>
      )}
    </div>
  );
}
