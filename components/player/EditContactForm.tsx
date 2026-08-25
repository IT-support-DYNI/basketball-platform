"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditContactForm({ playerId, initialPhone }: { playerId: number; initialPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactPhone: phone }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Your phone number"
        className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      />
      <button type="submit" disabled={saving} className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? "Saving..." : "Save"}
      </button>
      {saved && <span className="text-sm text-emerald-700">Saved ✓</span>}
    </form>
  );
}
