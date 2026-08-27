"use client";

import { useState } from "react";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  linkPath: string | null;
}

export default function NotificationsList({ initial }: { initial: NotificationItem[] }) {
  const [notifications, setNotifications] = useState(initial);

  async function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {unreadCount > 0 && (
        <button type="button" onClick={markAllRead} className="mb-4 text-sm font-semibold text-court-700 hover:text-court-800">
          Mark all {unreadCount} as read
        </button>
      )}

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-surface">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${n.isRead ? "text-slate-500" : "bg-court-50/60 font-medium text-slate-900"}`}
          >
            <div>
              <p>{n.title}</p>
              <p className="text-xs opacity-75">{n.message}</p>
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
              {!n.isRead && (
                <button type="button" onClick={() => markRead(n.id)} className="text-xs font-semibold text-court-700 hover:text-court-800">
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
        {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">Nothing yet.</li>}
      </ul>
    </div>
  );
}
