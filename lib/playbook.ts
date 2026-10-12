import { PLAY_TYPES } from "./contracts/playbook";
import { ForbiddenError } from "./api/errors";

/** Client-safe labels for plays: no DB imports. */

export type PlayType = (typeof PLAY_TYPES)[number];

export const PLAY_TYPE_LABEL: Record<PlayType, string> = {
  OFFENCE: "Offence",
  DEFENCE: "Defence",
  INBOUND: "Inbounds",
  PRESS_BREAK: "Press break",
  SPECIAL: "Special situations",
};

export { PLAY_TYPES };

/** Plays grouped by type, in PLAY_TYPES order, empty groups dropped. */
export function groupByType<T extends { type: string }>(plays: T[]): [PlayType, T[]][] {
  return PLAY_TYPES.map((t) => [t, plays.filter((p) => p.type === t)] as [PlayType, T[]]).filter(
    ([, list]) => list.length > 0,
  );
}

/**
 * Pure: work out which assignments to add and remove. Only teams in
 * `manageable` can be touched; a request for any other team is refused, and
 * assignments on other teams (another coach's) are never removed. An archived
 * play can be taken off teams but not put on new ones.
 */
export function planAssignmentChange(input: {
  current: number[];
  requested: number[];
  manageable: number[];
  archived: boolean;
}): { toAdd: number[]; toRemove: number[] } {
  const manageable = new Set(input.manageable);
  const wanted = new Set(input.requested);
  const current = new Set(input.current);
  for (const teamId of wanted) {
    if (!manageable.has(teamId)) throw new ForbiddenError("You can only add plays to teams you coach.");
  }
  const toAdd = [...wanted].filter((t) => !current.has(t));
  if (input.archived && toAdd.length > 0) {
    throw new ForbiddenError("Restore this play before adding it to a team.");
  }
  const toRemove = [...current].filter((t) => manageable.has(t) && !wanted.has(t));
  return { toAdd, toRemove };
}
