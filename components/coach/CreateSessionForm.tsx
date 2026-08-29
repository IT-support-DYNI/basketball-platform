"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { EVENT_TYPES } from "@/lib/contracts/event";
import { EVENT_TYPE_LABEL } from "@/lib/events";

interface Option {
  id: number;
  name: string;
}

export default function CreateSessionForm({
  teams,
  venues,
}: {
  teams: Option[];
  venues: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id?.toString() ?? "");
  const [type, setType] = useState<string>("TRAINING");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:30");
  const [venueId, setVenueId] = useState("");
  const [locationText, setLocationText] = useState("");
  const [description, setDescription] = useState("");
  const [repeats, setRepeats] = useState(false);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [recurInterval, setRecurInterval] = useState("1");
  const [untilDate, setUntilDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const startAt = new Date(`${date}T${startTime}`).toISOString();
      const endAt = new Date(`${date}T${endTime}`).toISOString();

      const recurrence = repeats
        ? {
            frequency,
            interval: Math.max(1, Number(recurInterval) || 1),
            byWeekday: frequency === "WEEKLY" ? [new Date(`${date}T${startTime}`).getDay()] : [],
            ...(untilDate ? { until: new Date(`${untilDate}T23:59`).toISOString() } : {}),
          }
        : undefined;

      const res = await fetch("/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: Number(teamId),
          type,
          title,
          startAt,
          endAt,
          venueId: venueId ? Number(venueId) : undefined,
          locationText: locationText || undefined,
          description: description || undefined,
          recurrence,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }

      setTitle("");
      setDate("");
      setLocationText("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (teams.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-court-500/30 transition hover:shadow-md"
      >
        + Create Event
      </button>
    );
  }

  const field =
    "rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-surface p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={field}>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>
          ))}
        </select>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className={field} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={field} />
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={field} />
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={field} />
        <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className={field}>
          <option value="">No venue — free text</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Location (if no venue)"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          className={field}
        />
      </div>
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={`w-full ${field}`}
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={repeats} onChange={(e) => setRepeats(e.target.checked)} className="h-4 w-4 accent-court-600" />
        Repeats
      </label>
      {repeats && (
        <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-3">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={field}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            every
            <input type="number" min={1} max={12} value={recurInterval} onChange={(e) => setRecurInterval(e.target.value)} className={`w-16 ${field}`} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            until
            <input type="date" value={untilDate} onChange={(e) => setUntilDate(e.target.value)} className={field} />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50">
          {loading ? "Creating..." : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
