"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { CATEGORY_LABEL, NOTIFICATION_CATEGORIES } from "@/lib/notification-categories";

type Item = {
  id: number;
  category: string;
  title: string;
  message: string;
  linkPath: string | null;
  isRead: boolean;
  createdAt: string;
};
type Prefs = Record<string, { email: boolean; push: boolean }>;

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yst = new Date(Date.now() - 864e5);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yst.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
};

export default function NotificationsFeed({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [filter, setFilter] = useState<string>("");
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    fetch("/api/v1/notifications/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then(setPrefs);
  }, []);

  const shown = useMemo(() => (filter ? items.filter((i) => i.category === filter) : items), [items, filter]);
  const groups = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of shown) {
      const k = dayLabel(i.createdAt);
      (m.get(k) ?? m.set(k, []).get(k)!).push(i);
    }
    return [...m.entries()];
  }, [shown]);

  const unread = items.filter((i) => !i.isRead).length;

  async function markRead(id: number) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
    await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
  }
  async function markAll() {
    setItems((p) => p.map((i) => ({ ...i, isRead: true })));
    await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
  }
  async function setPref(category: string, channel: "email" | "push", value: boolean) {
    setPrefs((p) => (p ? { ...p, [category]: { ...p[category], [channel]: value } } : p));
    await fetch("/api/v1/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, [channel]: value }),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("")}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold", filter === "" ? "border-flame/40 bg-flame/15 text-flame-ink" : "border-line text-ink-dim")}
          >
            All
          </button>
          {NOTIFICATION_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn("rounded-full border px-3 py-1 text-xs font-semibold", filter === c ? "border-flame/40 bg-flame/15 text-flame-ink" : "border-line text-ink-dim")}
            >
              {CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          {unread > 0 && (
            <button onClick={markAll} className="text-flame-ink hover:underline">Mark all {unread} read</button>
          )}
          <button onClick={() => setShowPrefs((v) => !v)} className="text-ink-dim hover:text-ink">
            {showPrefs ? "Hide settings" : "Settings"}
          </button>
        </div>
      </div>

      {showPrefs && prefs && (
        <div className="rounded-card border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">How you're notified</p>
          <p className="mt-0.5 text-xs text-ink-faint">In-app is always on. Email needs the club to have set up a mail provider.</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="py-1">Category</th>
                <th className="py-1 text-center">Push</th>
                <th className="py-1 text-center">Email</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_CATEGORIES.map((c) => (
                <tr key={c} className="border-t border-line">
                  <td className="py-2 text-ink-dim">{CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]}</td>
                  <td className="py-2 text-center">
                    <input type="checkbox" checked={prefs[c]?.push ?? false} onChange={(e) => setPref(c, "push", e.target.checked)} className="h-4 w-4 accent-flame" />
                  </td>
                  <td className="py-2 text-center">
                    <input type="checkbox" checked={prefs[c]?.email ?? false} onChange={(e) => setPref(c, "email", e.target.checked)} className="h-4 w-4 accent-flame" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-dim">Nothing here.</p>
      ) : (
        groups.map(([day, list]) => (
          <div key={day}>
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-faint">{day}</p>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {list.map((n) => {
                const inner = (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className={cn("text-sm", n.isRead ? "text-ink-dim" : "font-semibold text-ink")}>{n.title}</p>
                      <p className="text-xs text-ink-faint">{n.message}</p>
                    </div>
                    <div className="flex flex-none items-center gap-2 whitespace-nowrap text-xs text-ink-faint">
                      {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-flame" />}
                    </div>
                  </div>
                );
                return (
                  <li key={n.id} onClick={() => !n.isRead && markRead(n.id)}>
                    {n.linkPath ? (
                      <Link href={n.linkPath} className="block hover:bg-surface-2">{inner}</Link>
                    ) : (
                      <div className="cursor-default">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
