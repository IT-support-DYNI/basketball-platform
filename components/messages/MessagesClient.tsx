"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Conversation = {
  id: number;
  type: "TEAM" | "EVENT" | "GROUP" | "DIRECT";
  title: string;
  safeguarded: boolean;
  lastMessage: { body: string; author: string; at: string } | null;
  lastMessageAt: string;
  unread: number;
  viaGuardianship: boolean;
};

type Message = {
  id: number;
  authorUserId: number;
  author: string;
  body: string | null;
  deleted: boolean;
  edited: boolean;
  createdAt: string;
};

type View = {
  id: number;
  type: Conversation["type"];
  title: string;
  safeguarded: boolean;
  participants: { userId: number; name: string; role: string; viaGuardianship: boolean }[];
  messages: Message[];
};

type Contact = { id: number; name: string; role: string };

const LIST_POLL_MS = 15_000;
const THREAD_POLL_MS = 4_000;

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

async function getJSON<T>(url: string): Promise<T | null> {
  const r = await fetch(url);
  if (!r.ok) return null;
  return (await r.json()) as T;
}

export default function MessagesClient({
  meUserId,
  initialConversationId,
}: {
  meUserId: number;
  initialConversationId: number | null;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(initialConversationId);
  const [view, setView] = useState<View | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const lastMsgIdRef = useRef<number>(0);

  const refreshList = useCallback(async () => {
    const rows = await getJSON<Conversation[]>("/api/v1/conversations");
    if (rows) setConversations(rows);
  }, []);

  // Initial list + list polling.
  useEffect(() => {
    refreshList();
    const t = setInterval(refreshList, LIST_POLL_MS);
    return () => clearInterval(t);
  }, [refreshList]);

  const loadThread = useCallback(
    async (id: number, { incremental }: { incremental: boolean }) => {
      const after = incremental && lastMsgIdRef.current ? `?after=${lastMsgIdRef.current}` : "";
      const next = await getJSON<View>(`/api/v1/conversations/${id}${after}`);
      if (!next) return;
      setView((prev) => {
        if (!incremental || !prev || prev.id !== id) return next;
        const known = new Set(prev.messages.map((m) => m.id));
        const merged = [...prev.messages, ...next.messages.filter((m) => !known.has(m.id))];
        return { ...next, messages: merged };
      });
      const newest = next.messages.at(-1);
      if (newest && newest.id > lastMsgIdRef.current) lastMsgIdRef.current = newest.id;
    },
    [],
  );

  const openConversation = useCallback(
    async (id: number) => {
      setActiveId(id);
      setView(null);
      lastMsgIdRef.current = 0;
      setComposerError(null);
      await loadThread(id, { incremental: false });
      await fetch(`/api/v1/conversations/${id}/read`, { method: "POST" });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    },
    [loadThread],
  );

  // Open the initial conversation once the list is available.
  const openedInitial = useRef(false);
  useEffect(() => {
    if (openedInitial.current || activeId == null) return;
    openedInitial.current = true;
    openConversation(activeId);
  }, [activeId, openConversation]);

  // Thread polling for the active conversation.
  useEffect(() => {
    if (activeId == null) return;
    const t = setInterval(() => {
      loadThread(activeId, { incremental: true });
    }, THREAD_POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  // Keep the thread scrolled to the newest message.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [view?.messages.length, activeId]);

  async function send() {
    const body = draft.trim();
    if (!body || activeId == null || sending) return;
    setSending(true);
    setComposerError(null);
    const r = await fetch(`/api/v1/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      setComposerError(j?.error ?? "Couldn't send that message.");
      return;
    }
    setDraft("");
    await loadThread(activeId, { incremental: true });
    refreshList();
  }

  async function removeMessage(id: number) {
    const r = await fetch(`/api/v1/messages/${id}`, { method: "DELETE" });
    if (r.ok && activeId != null) {
      setView((prev) =>
        prev
          ? { ...prev, messages: prev.messages.map((m) => (m.id === id ? { ...m, body: null, deleted: true } : m)) }
          : prev,
      );
    }
  }

  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[19rem_1fr]">
        {/* Conversation list */}
        <aside
          className={cn(
            "flex-col rounded-card border border-line bg-surface",
            activeId != null ? "hidden md:flex" : "flex",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">
              Conversations {totalUnread > 0 && <span className="text-flame-ink">({totalUnread})</span>}
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-dim hover:text-ink"
            >
              New
            </button>
          </div>
          {conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-dim">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-line overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openConversation(c.id)}
                    className={cn(
                      "block w-full px-4 py-3 text-left hover:bg-surface-2",
                      c.id === activeId && "bg-surface-2",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", c.unread > 0 ? "font-semibold text-ink" : "text-ink-dim")}>
                        {c.title}
                      </span>
                      <span className="flex flex-none items-center gap-1.5">
                        {c.safeguarded && (
                          <span className="rounded-full bg-flame/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-flame-ink">
                            Safeguarded
                          </span>
                        )}
                        {c.unread > 0 && (
                          <span className="min-w-[1.25rem] rounded-full bg-flame px-1 text-center text-[11px] font-bold text-white">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-faint">
                      {c.lastMessage
                        ? `${c.lastMessage.author}: ${c.lastMessage.body}`
                        : "No messages yet"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Thread */}
        <section
          className={cn(
            "min-h-[28rem] flex-col rounded-card border border-line bg-surface",
            activeId == null ? "hidden md:flex" : "flex",
          )}
        >
          {activeId == null || !view ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-ink-dim">
              {activeId == null ? "Pick a conversation to start reading." : "Loading…"}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button
                  onClick={() => {
                    setActiveId(null);
                    setView(null);
                  }}
                  className="text-ink-dim hover:text-ink md:hidden"
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{view.title}</p>
                  <p className="truncate text-xs text-ink-faint">
                    {view.participants.length} {view.participants.length === 1 ? "person" : "people"}
                    {view.safeguarded && " · guardians included"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {view.messages.length === 0 && (
                  <p className="text-center text-sm text-ink-faint">No messages yet — say hello.</p>
                )}
                {view.messages.map((m) => {
                  const mine = m.authorUserId === meUserId;
                  return (
                    <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                      {!mine && <span className="px-1 text-[11px] font-semibold text-ink-faint">{m.author}</span>}
                      <div
                        className={cn(
                          "group max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                          m.deleted
                            ? "border border-dashed border-line text-ink-faint"
                            : mine
                              ? "bg-flame text-white"
                              : "bg-surface-2 text-ink",
                        )}
                      >
                        {m.deleted ? (
                          <span className="italic">Message removed</span>
                        ) : (
                          <span className="whitespace-pre-wrap break-words">{m.body}</span>
                        )}
                        <span
                          className={cn(
                            "ml-2 align-baseline text-[10px]",
                            mine && !m.deleted ? "text-white/70" : "text-ink-faint",
                          )}
                        >
                          {timeOf(m.createdAt)}
                          {m.edited && !m.deleted && " · edited"}
                        </span>
                        {mine && !m.deleted && (
                          <button
                            onClick={() => removeMessage(m.id)}
                            className="ml-2 hidden text-[10px] text-white/70 hover:text-white group-hover:inline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              <div className="border-t border-line p-3">
                {composerError && <p className="mb-1.5 text-xs text-red-500">{composerError}</p>}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Write a message…"
                    className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    className="rounded-xl bg-flame px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {showNew && (
        <NewConversationDialog
          onClose={() => setShowNew(false)}
          onCreated={async (id) => {
            setShowNew(false);
            await refreshList();
            openConversation(id);
          }}
        />
      )}
    </>
  );
}

function NewConversationDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conversationId: number) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getJSON<Contact[]>("/api/v1/conversations/contacts").then((c) => c && setContacts(c));
  }, []);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function create() {
    if (selected.size === 0 || busy) return;
    setBusy(true);
    setError(null);
    const isDirect = selected.size === 1;
    const r = await fetch("/api/v1/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: isDirect ? "DIRECT" : "GROUP",
        participantUserIds: [...selected],
        ...(isDirect ? {} : { name: name.trim() || "Group chat" }),
      }),
    });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      setError(j?.error ?? "Couldn't start that conversation.");
      return;
    }
    const j = (await r.json()) as { id: number };
    onCreated(j.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-card border border-line bg-surface p-5 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-extrabold uppercase text-ink">New conversation</p>
          <button onClick={onClose} className="text-ink-dim hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Pick one person for a direct message, or several for a group. Conversations with a young
          person automatically include their guardian.
        </p>

        {selected.size > 1 && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            maxLength={80}
            className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-flame/50"
          />
        )}

        <div className="mt-3 max-h-64 divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {contacts.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-faint">No one to message yet.</p>
          ) : (
            contacts.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 accent-flame"
                />
                <span className="text-sm text-ink">{c.name}</span>
                <span className="ml-auto text-[11px] uppercase tracking-wide text-ink-faint">{c.role}</span>
              </label>
            ))
          )}
        </div>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-dim">
            Cancel
          </button>
          <button
            onClick={create}
            disabled={selected.size === 0 || busy}
            className="rounded-xl bg-flame px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {selected.size === 1 ? "Start DM" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}
