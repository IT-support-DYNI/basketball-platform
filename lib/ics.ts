import type { EventStatus, EventType } from "@prisma/client";

import { EVENT_TYPE_LABEL } from "./events";

/**
 * Minimal RFC 5545 iCalendar output — enough for calendar apps to subscribe to a
 * personal feed or import a single event. Times are emitted in UTC.
 */

const PRODID = "-//DYNI Blazers//Schedule//EN";

export type IcsEvent = {
  id: number;
  type: EventType;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  status: EventStatus;
  venue?: { name: string; address: string | null } | null;
  locationText?: string | null;
  updatedAt: Date;
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Date → `20260901T170000Z` */
function toIcsUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function esc(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Fold lines to 75 octets per RFC 5545 (continuation lines start with a space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

function vevent(e: IcsEvent, now: Date): string[] {
  const location = e.venue
    ? [e.venue.name, e.venue.address].filter(Boolean).join(", ")
    : (e.locationText ?? "");
  const descParts = [EVENT_TYPE_LABEL[e.type]];
  if (e.description) descParts.push(e.description);

  const lines = [
    "BEGIN:VEVENT",
    `UID:event-${e.id}@dyniblazers`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(e.startAt)}`,
    `DTEND:${toIcsUtc(e.endAt)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(descParts.join(" — "))}`,
    `LAST-MODIFIED:${toIcsUtc(e.updatedAt)}`,
    `STATUS:${e.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED"}`,
  ];
  if (location) lines.push(`LOCATION:${esc(location)}`);
  lines.push("END:VEVENT");
  return lines;
}

export function buildCalendar(events: IcsEvent[], name: string): string {
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
    ...events.flatMap((e) => vevent(e, now)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
