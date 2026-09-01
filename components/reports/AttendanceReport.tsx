"use client";

import { useCallback, useEffect, useState } from "react";

type Team = { id: number; name: string };
type Row = {
  playerId: number;
  name: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  recorded: number;
  percentage: number | null;
};
type Report = { events: number; players: Row[] };

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AttendanceReport({ teams }: { teams: Team[] }) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? 0);
  const [from, setFrom] = useState(isoDate(new Date(Date.now() - 90 * 864e5)));
  const [to, setTo] = useState(isoDate(new Date()));
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const q = useCallback(
    () =>
      `teamId=${teamId}&from=${new Date(from).toISOString()}&to=${new Date(`${to}T23:59:59`).toISOString()}`,
    [teamId, from, to],
  );

  useEffect(() => {
    if (!teamId) return;
    let off = false;
    setLoading(true);
    fetch(`/api/v1/reports/attendance?${q()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !off && setData(d))
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [teamId, q]);

  if (teams.length === 0) {
    return <p className="text-sm text-ink-dim">No teams to report on.</p>;
  }

  const field = "rounded-control border border-line bg-surface-2 px-3 py-2 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {teams.length > 1 && (
          <select value={teamId} onChange={(e) => setTeamId(Number(e.target.value))} className={field}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <label className="text-xs text-ink-dim">
          <span className="mb-1 block font-mono uppercase tracking-wider text-ink-faint">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
        </label>
        <label className="text-xs text-ink-dim">
          <span className="mb-1 block font-mono uppercase tracking-wider text-ink-faint">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={field} />
        </label>
        <a
          href={`/api/v1/reports/attendance?${q()}&format=csv`}
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-dim hover:text-ink"
        >
          Download CSV
        </a>
      </div>

      {data && (
        <p className="text-sm text-ink-dim">
          {data.events} event{data.events === 1 ? "" : "s"} in this window.
        </p>
      )}

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left font-display text-[11px] uppercase tracking-wider text-ink-dim">
              <th className="px-4 py-2.5">Player</th>
              <th className="px-4 py-2.5 text-right">Present</th>
              <th className="px-4 py-2.5 text-right">Late</th>
              <th className="px-4 py-2.5 text-right">Absent</th>
              <th className="px-4 py-2.5 text-right">Excused</th>
              <th className="px-4 py-2.5 text-right">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {(data?.players ?? []).map((r) => (
              <tr key={r.playerId} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink">{r.name}</td>
                <td className="px-4 py-2.5 text-right tabular text-ink-dim">{r.present}</td>
                <td className="px-4 py-2.5 text-right tabular text-ink-dim">{r.late}</td>
                <td className="px-4 py-2.5 text-right tabular text-ink-dim">{r.absent}</td>
                <td className="px-4 py-2.5 text-right tabular text-ink-dim">{r.excused}</td>
                <td className="px-4 py-2.5 text-right tabular font-semibold text-ink">
                  {r.percentage != null ? `${r.percentage}%` : "—"}
                </td>
              </tr>
            ))}
            {!loading && (data?.players ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-dim">No players on this roster.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-faint">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
