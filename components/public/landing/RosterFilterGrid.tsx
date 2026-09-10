"use client";

import { useMemo, useState } from "react";
import type { PublicPlayerCard } from "@/lib/public-site";
import TiltCard from "./TiltCard";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`chip${active ? " active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

/** Client-side filter over the whole approved roster — small enough (a
 *  club, not a league) that fetching it once and slicing it in the browser
 *  is simpler and snappier than paginated query params. */
export default function RosterFilterGrid({ players }: { players: PublicPlayerCard[] }) {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);

  const ageGroups = useMemo(
    () => Array.from(new Set(players.map((p) => p.ageGroup).filter((v): v is string => !!v))).sort(),
    [players],
  );
  const positions = useMemo(
    () => Array.from(new Set(players.map((p) => p.position).filter((v): v is string => !!v))).sort(),
    [players],
  );
  const positionLabel = (code: string) => players.find((p) => p.position === code)?.positionLabel ?? code;

  const filtered = players.filter(
    (p) => (!ageGroup || p.ageGroup === ageGroup) && (!position || p.position === position),
  );

  return (
    <div>
      {(ageGroups.length > 0 || positions.length > 0) && (
        <div className="chip-row">
          <span className="chip-label">Filter</span>
          <Chip active={ageGroup === null} onClick={() => setAgeGroup(null)}>
            All ages
          </Chip>
          {ageGroups.map((g) => (
            <Chip key={g} active={ageGroup === g} onClick={() => setAgeGroup(g === ageGroup ? null : g)}>
              {g}
            </Chip>
          ))}
          {positions.length > 0 && <span className="chip-sep" aria-hidden="true" />}
          {positions.map((code) => (
            <Chip key={code} active={position === code} onClick={() => setPosition(code === position ? null : code)}>
              {positionLabel(code)}
            </Chip>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="lead">
          {players.length === 0 ? "No player profiles are public yet — check back soon." : "No players match that filter."}
        </p>
      ) : (
        <div className="team-grid">
          {filtered.map((p, i) => (
            <TiltCard key={p.id} className="team" href={`/club/players/${p.id}`} delayMs={(i % 9) * 60}>
              <div className={`photo${p.photoUrl ? " has-img" : ""}`}>
                {p.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt="" />
                )}
              </div>
              {p.jerseyNumber != null && (
                <span className="team-jersey" aria-hidden="true">
                  {p.jerseyNumber}
                </span>
              )}
              <div className="team-top">
                <span className={`team-code${p.publicStatus === "Trialist" ? " trial" : ""}`}>
                  {p.jerseyNumber != null ? `#${p.jerseyNumber}` : "—"}
                </span>
                {p.publicStatus && (
                  <span className={`pill ${p.publicStatus === "Trialist" ? "pill-trial" : "pill-open"}`}>
                    {p.publicStatus}
                  </span>
                )}
              </div>
              <div className="team-body">
                <h3>{p.name}</h3>
                <div className="team-meta">
                  {p.positionLabel && <span>{p.positionLabel}</span>}
                  {p.team && <span>{p.team}</span>}
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
}
