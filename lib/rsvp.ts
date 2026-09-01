import type { RsvpResponse } from "@prisma/client";

/**
 * RSVP (AvailabilityResponse) rules. Kept separate from attendance: an RSVP is
 * an intention captured ahead of time, not a record of what happened.
 */

export const RSVP_LABEL: Record<RsvpResponse, string> = {
  ATTENDING: "Going",
  NOT_ATTENDING: "Not going",
  UNSURE: "Unsure",
};

type RsvpEvent = {
  status: string;
  startAt: Date;
  endAt: Date;
  rsvpDeadline: Date | null;
  capacity: number | null;
};

/** Whether the RSVP window is open, and if not, why. */
export function rsvpWindowState(event: RsvpEvent, now: Date = new Date()): { open: boolean; reason?: string } {
  if (event.status === "CANCELLED") return { open: false, reason: "This event was cancelled." };
  if (event.endAt < now) return { open: false, reason: "This event has already taken place." };
  if (event.rsvpDeadline && event.rsvpDeadline < now) {
    return { open: false, reason: "The RSVP deadline has passed — contact your coach." };
  }
  return { open: true };
}

/** Capacity view given the current number of "attending" responses. */
export function capacityState(
  event: RsvpEvent,
  attendingCount: number,
): { limited: boolean; full: boolean; remaining: number | null } {
  if (event.capacity == null) return { limited: false, full: false, remaining: null };
  const remaining = Math.max(0, event.capacity - attendingCount);
  return { limited: true, full: remaining === 0, remaining };
}

export type RsvpCounts = { attending: number; notAttending: number; unsure: number; noResponse: number };

export function tallyResponses(
  responses: { response: RsvpResponse }[],
  expectedCount: number,
): RsvpCounts {
  const attending = responses.filter((r) => r.response === "ATTENDING").length;
  const notAttending = responses.filter((r) => r.response === "NOT_ATTENDING").length;
  const unsure = responses.filter((r) => r.response === "UNSURE").length;
  return {
    attending,
    notAttending,
    unsure,
    noResponse: Math.max(0, expectedCount - responses.length),
  };
}
