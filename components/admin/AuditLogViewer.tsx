"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AuditRow } from "@/lib/audit";

type Page = { items: AuditRow[]; page: number; pageSize: number; total: number; totalPages: number };

const selectClass =
  "rounded-control border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-flame/50";

export default function AuditLogViewer({
  initial,
  pageSize,
  actions,
  actors,
  entityTypes,
}: {
  initial: { items: AuditRow[]; total: number };
  pageSize: number;
  actions: string[];
  actors: { id: number; name: string }[];
  entityTypes: string[];
}) {
  const [rows, setRows] = useState<AuditRow[]>(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (action) qs.set("action", action);
    if (entityType) qs.set("entityType", entityType);
    if (actorUserId) qs.set("actorUserId", actorUserId);
    const res = await fetch(`/api/v1/audit?${qs}`);
    setLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as Page;
    setRows(data.items);
    setTotal(data.total);
  }, [page, pageSize, action, entityType, actorUserId]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    if (firstRender.current) return;
    setPage(1);
  }, [action, entityType, actorUserId]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClass} aria-label="Filter by action">
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a.toLowerCase().replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className={selectClass}
          aria-label="Filter by record type"
        >
          <option value="">All record types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={actorUserId}
          onChange={(e) => setActorUserId(e.target.value)}
          className={selectClass}
          aria-label="Filter by person"
        >
          <option value="">Anyone</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {(action || entityType || actorUserId) && (
          <button
            onClick={() => {
              setAction("");
              setEntityType("");
              setActorUserId("");
            }}
            className="text-sm font-semibold text-ink-dim hover:text-ink"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-ink-faint">{total} record{total === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Who</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Record</th>
            </tr>
          </thead>
          <tbody className={loading ? "opacity-50" : ""}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-dim">
                  Nothing matches those filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-dim">
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-ink">{r.actorName ?? "System"}</td>
                  <td className="px-4 py-2.5 text-ink">
                    {r.actionLabel}
                    {r.metadata?.note ? (
                      <span className="block text-xs text-ink-faint">“{String(r.metadata.note)}”</span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-faint">
                    {r.entityType}
                    {r.entityId != null ? ` #${r.entityId}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-control border border-line px-3 py-1.5 font-semibold text-ink-dim disabled:opacity-40"
          >
            ← Newer
          </button>
          <span className="text-ink-faint">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-control border border-line px-3 py-1.5 font-semibold text-ink-dim disabled:opacity-40"
          >
            Older →
          </button>
        </div>
      )}
    </div>
  );
}
