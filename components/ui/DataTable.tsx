"use client";

import { useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { EmptyState } from "./states";

export type Column<T> = {
  key: string;
  header: string;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Hide this column when collapsed to stacked cards on small screens. */
  hideOnStack?: boolean;
};

/**
 * Sortable table that collapses to a stack of cards below `md`, per the brief's
 * "responsive tables" requirement. Presentational only — pagination and
 * server-side sorting are the caller's concern.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: { title: string; description?: string };
  caption?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={empty?.title ?? "Nothing here yet"} description={empty?.description} />;
  }

  return (
    <>
      {/* Table — md and up */}
      <div className="hidden overflow-x-auto rounded-card border border-line md:block">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "px-3 py-2.5 font-display text-[11px] font-semibold uppercase tracking-wider text-ink-dim",
                      col.align === "right" ? "text-right" : "text-left",
                    )}
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 transition hover:text-ink"
                      >
                        {col.header}
                        <span className="text-flame">{active ? (sort!.dir === "asc" ? "▲" : "▼") : ""}</span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 py-2.5 text-ink",
                      col.align === "right" ? "text-right tabular" : "text-left",
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked cards — below md */}
      <div className="flex flex-col gap-2 md:hidden">
        {sorted.map((row) => (
          <div key={rowKey(row)} className="rounded-card border border-line bg-surface p-3">
            {columns
              .filter((c) => !c.hideOnStack)
              .map((col) => (
                <div key={col.key} className="flex justify-between gap-3 py-1 text-sm">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                    {col.header}
                  </span>
                  <span className="text-right text-ink">{col.cell(row)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
