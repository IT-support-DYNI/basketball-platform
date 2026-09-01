"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { EVENT_TYPE_LABEL } from "@/lib/events";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/toast";
import RsvpControl from "./RsvpControl";

type EventType = keyof typeof EVENT_TYPE_LABEL;

type ApiEvent = {
  id: number;
  type: EventType;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED";
  team: { id: number; name: string } | null;
  venue: { id: number; name: string; address: string | null } | null;
  locationText?: string | null;
  recurrenceId?: number | null;
};

const ACCENT: Record<string, string> = {
  TRAINING: "bg-flame/15 text-flame-ink border-flame/30",
  MATCH: "bg-info/15 text-info border-info/30",
  TOURNAMENT: "bg-info/15 text-info border-info/30",
  TEAM_MEETING: "bg-ember/15 text-ember border-ember/30",
  FITNESS_TEST: "bg-ember/15 text-ember border-ember/30",
  REGISTRATION_DEADLINE: "bg-warning/15 text-warning border-warning/30",
  PAYMENT_DEADLINE: "bg-warning/15 text-warning border-warning/30",
};
const accentFor = (t: string) => ACCENT[t] ?? "bg-surface-3 text-ink-dim border-line";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = "January February March April May June July August September October November December".split(" ");

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
/** Monday of the week containing `d`. */
function weekStart(d: Date) {
  const r = startOfDay(d);
  const shift = (r.getDay() + 6) % 7; // 0 = Monday
  return addDays(r, -shift);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

type View = "month" | "week" | "agenda";

export default function CalendarView({
  manageBasePath,
  feedUrl,
  canRsvp = false,
}: {
  /** e.g. "/coach/training" — event chips link to `${manageBasePath}/${id}`. Null = no per-event page. */
  manageBasePath: string | null;
  feedUrl: string | null;
  /** Show the RSVP control in the event dialog (players, and staff who attend). */
  canRsvp?: boolean;
}) {
  const toast = useToast();
  const notify = (title: string, tone?: "success" | "danger") => toast({ title, tone });
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApiEvent | null>(null);

  const range = useMemo(() => {
    if (view === "month") {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const gridStart = weekStart(first);
      return { from: gridStart, to: addDays(gridStart, 42) };
    }
    if (view === "week") {
      const s = weekStart(anchor);
      return { from: s, to: addDays(s, 7) };
    }
    return { from: startOfDay(anchor), to: addDays(anchor, 60) };
  }, [view, anchor]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/events?from=${range.from.toISOString()}&to=${range.to.toISOString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ApiEvent[]) => {
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => !cancelled && setEvents([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const byDay = useMemo(() => {
    const map = new Map<string, ApiEvent[]>();
    for (const e of events) {
      const key = startOfDay(new Date(e.startAt)).toDateString();
      (map.get(key) ?? map.set(key, []).get(key)!).push(e);
    }
    for (const list of map.values()) list.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return map;
  }, [events]);

  const move = useCallback(
    (dir: -1 | 0 | 1) => {
      setAnchor((prev) => {
        if (dir === 0) return startOfDay(new Date());
        if (view === "month") return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
        if (view === "week") return addDays(prev, dir * 7);
        return addDays(prev, dir * 14);
      });
    },
    [view],
  );

  const label =
    view === "month"
      ? `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
      : view === "week"
        ? `Week of ${weekStart(anchor).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
        : "Agenda";

  return (
    <div className="rounded-card border border-line bg-surface">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} aria-label="Previous" className="flex h-8 w-8 items-center justify-center rounded-full text-ink-dim hover:bg-surface-2 hover:text-ink">‹</button>
          <button onClick={() => move(0)} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-dim hover:text-ink">Today</button>
          <button onClick={() => move(1)} aria-label="Next" className="flex h-8 w-8 items-center justify-center rounded-full text-ink-dim hover:bg-surface-2 hover:text-ink">›</button>
          <span className="ml-2 font-display text-sm font-bold uppercase tracking-tight text-ink">{label}</span>
          {loading && <span className="ml-2 text-xs text-ink-faint">loading…</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-line p-0.5 text-xs font-semibold">
            {(["month", "week", "agenda"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn("rounded-full px-3 py-1 capitalize transition", view === v ? "bg-flame/15 text-flame-ink" : "text-ink-dim hover:text-ink")}
              >
                {v}
              </button>
            ))}
          </div>
          {feedUrl && (
            <button
              onClick={() => {
                navigator.clipboard?.writeText(feedUrl).then(
                  () => notify("Subscription link copied", "success"),
                  () => notify("Couldn't copy the link", "danger"),
                );
              }}
              className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-dim hover:text-ink"
            >
              Subscribe
            </button>
          )}
        </div>
      </div>

      {view === "month" && <MonthGrid anchor={anchor} byDay={byDay} onSelect={setSelected} />}
      {view === "week" && <WeekGrid anchor={anchor} byDay={byDay} onSelect={setSelected} />}
      {view === "agenda" && <AgendaList events={events} onSelect={setSelected} />}

      {selected && (
        <EventDialog
          event={selected}
          manageBasePath={manageBasePath}
          canRsvp={canRsvp}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Chip({ e, onSelect }: { e: ApiEvent; onSelect: (e: ApiEvent) => void }) {
  return (
    <button
      onClick={() => onSelect(e)}
      className={cn(
        "block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] font-medium",
        accentFor(e.type),
        e.status === "CANCELLED" && "line-through opacity-60",
      )}
      title={`${e.title} · ${hhmm(e.startAt)}`}
    >
      {hhmm(e.startAt)} {e.title}
    </button>
  );
}

function MonthGrid({
  anchor,
  byDay,
  onSelect,
}: {
  anchor: Date;
  byDay: Map<string, ApiEvent[]>;
  onSelect: (e: ApiEvent) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = weekStart(first);
  const today = new Date();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[38rem]">
        <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          {DOW.map((d) => (
            <div key={d} className="py-1.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const list = byDay.get(day.toDateString()) ?? [];
            const otherMonth = day.getMonth() !== anchor.getMonth();
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[6rem] border-b border-r border-line p-1 last:border-r-0",
                  otherMonth && "bg-surface-2/40",
                )}
              >
                <div
                  className={cn(
                    "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    sameDay(day, today) ? "bg-flame font-bold text-on-flame" : otherMonth ? "text-ink-faint" : "text-ink-dim",
                  )}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {list.slice(0, 3).map((e) => (
                    <Chip key={e.id} e={e} onSelect={onSelect} />
                  ))}
                  {list.length > 3 && (
                    <p className="px-1 text-[10px] font-semibold text-ink-faint">+{list.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekGrid({
  anchor,
  byDay,
  onSelect,
}: {
  anchor: Date;
  byDay: Map<string, ApiEvent[]>;
  onSelect: (e: ApiEvent) => void;
}) {
  const start = weekStart(anchor);
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[44rem] grid-cols-7">
        {days.map((day, i) => {
          const list = byDay.get(day.toDateString()) ?? [];
          return (
            <div key={i} className="min-h-[10rem] border-r border-line p-2 last:border-r-0">
              <div className={cn("mb-2 text-xs font-semibold", sameDay(day, today) ? "text-flame-ink" : "text-ink-dim")}>
                {DOW[i]} {day.getDate()}
              </div>
              <div className="space-y-1">
                {list.map((e) => (
                  <Chip key={e.id} e={e} onSelect={onSelect} />
                ))}
                {list.length === 0 && <p className="text-[11px] text-ink-faint">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaList({ events, onSelect }: { events: ApiEvent[]; onSelect: (e: ApiEvent) => void }) {
  if (events.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-ink-dim">Nothing scheduled in this window.</p>;
  }
  const groups = new Map<string, ApiEvent[]>();
  for (const e of events) {
    const key = startOfDay(new Date(e.startAt)).toDateString();
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(e);
  }
  return (
    <ul className="divide-y divide-line">
      {[...groups.entries()].map(([key, list]) => (
        <li key={key} className="px-4 py-3">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-ink-faint">
            {new Date(key).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <ul className="space-y-1.5">
            {list.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => onSelect(e)}
                  className="flex w-full items-center gap-3 rounded-control border border-line bg-surface-2 px-3 py-2 text-left text-sm hover:border-line-strong"
                >
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase", accentFor(e.type))}>
                    {EVENT_TYPE_LABEL[e.type]}
                  </span>
                  <span className={cn("flex-1 font-medium text-ink", e.status === "CANCELLED" && "line-through opacity-60")}>
                    {e.title}
                  </span>
                  <span className="tabular text-xs text-ink-dim">{hhmm(e.startAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function EventDialog({
  event,
  manageBasePath,
  canRsvp,
  onClose,
}: {
  event: ApiEvent;
  manageBasePath: string | null;
  canRsvp: boolean;
  onClose: () => void;
}) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const isDeadline = start.getTime() === end.getTime();
  const showRsvp = canRsvp && event.team != null && !isDeadline && event.status !== "CANCELLED";
  // Check-in opens 2h before the event and closes 1h after it ends.
  const now = Date.now();
  const showCheckIn =
    canRsvp &&
    !manageBasePath && // players only — staff manage via the event page
    event.team != null &&
    !isDeadline &&
    event.status !== "CANCELLED" &&
    now >= start.getTime() - 2 * 3600e3 &&
    now <= end.getTime() + 3600e3;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={event.title} description={EVENT_TYPE_LABEL[event.type]}>
        <dl className="space-y-2 text-sm">
          <Row label="When">
            {start.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            {!isDeadline && (
              <>
                {" · "}
                {start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}–
                {end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </>
            )}
          </Row>
          {event.team && <Row label="Team">{event.team.name}</Row>}
          {(event.venue || event.locationText) && (
            <Row label="Where">
              {event.venue?.name ?? event.locationText}
              {event.venue?.address ? `, ${event.venue.address}` : ""}
            </Row>
          )}
          {event.status !== "SCHEDULED" && <Row label="Status">{event.status}</Row>}
          {event.recurrenceId && <Row label="Repeats">Part of a recurring series</Row>}
          {event.description && <Row label="Details">{event.description}</Row>}
        </dl>

        {showRsvp && (
          <div className="mt-4">
            <RsvpControl eventId={event.id} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {showCheckIn && (
            <Link
              href={`/checkin/${event.id}`}
              className="rounded-full bg-flame px-4 py-2 text-sm font-bold text-on-flame"
            >
              Check in
            </Link>
          )}
          <a
            href={`/api/v1/events/${event.id}/ics`}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-dim hover:text-ink"
          >
            Add to my calendar
          </a>
          {manageBasePath && (
            <Link
              href={`${manageBasePath}/${event.id}`}
              className="rounded-full bg-flame px-4 py-2 text-sm font-bold text-on-flame"
            >
              Manage
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-16 flex-none font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
