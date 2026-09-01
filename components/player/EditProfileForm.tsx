"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  contactPhone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  nationality: string | null;
  heightCm: number | null;
  preferredHand: string | null;
  bio: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  guardianName: string | null;
  guardianContact: string | null;
  medicalNotes: string | null;
  welfareNotes: string | null;
};

const field =
  "w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-flame-ink";

export default function EditProfileForm({ playerId, initial }: { playerId: number; initial: Initial }) {
  const router = useRouter();
  const [v, setV] = useState({
    contactPhone: initial.contactPhone ?? "",
    dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.slice(0, 10) : "",
    address: initial.address ?? "",
    nationality: initial.nationality ?? "",
    heightCm: initial.heightCm?.toString() ?? "",
    preferredHand: initial.preferredHand ?? "",
    bio: initial.bio ?? "",
    emergencyContactName: initial.emergencyContactName ?? "",
    emergencyContactPhone: initial.emergencyContactPhone ?? "",
    emergencyContactRelation: initial.emergencyContactRelation ?? "",
    guardianName: initial.guardianName ?? "",
    guardianContact: initial.guardianContact ?? "",
    medicalNotes: initial.medicalNotes ?? "",
    welfareNotes: initial.welfareNotes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const on = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        contactPhone: v.contactPhone || undefined,
        dateOfBirth: v.dateOfBirth || null,
        address: v.address || undefined,
        nationality: v.nationality || undefined,
        heightCm: v.heightCm ? Number(v.heightCm) : undefined,
        preferredHand: v.preferredHand || undefined,
        bio: v.bio || undefined,
        emergencyContactName: v.emergencyContactName || undefined,
        emergencyContactPhone: v.emergencyContactPhone || undefined,
        emergencyContactRelation: v.emergencyContactRelation || undefined,
        guardianName: v.guardianName || undefined,
        guardianContact: v.guardianContact || undefined,
        medicalNotes: v.medicalNotes || undefined,
        welfareNotes: v.welfareNotes || undefined,
      };
      const res = await fetch(`/api/v1/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "Couldn't save.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">About you</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink-dim">Date of birth<input type="date" value={v.dateOfBirth} onChange={on("dateOfBirth")} className={field} /></label>
          <label className="text-xs text-ink-dim">Nationality<input value={v.nationality} onChange={on("nationality")} className={field} /></label>
          <label className="text-xs text-ink-dim">Height (cm)<input type="number" min={80} max={260} value={v.heightCm} onChange={on("heightCm")} className={field} /></label>
          <label className="text-xs text-ink-dim">Preferred hand
            <select value={v.preferredHand} onChange={on("preferredHand")} className={field}>
              <option value="">—</option>
              <option value="RIGHT">Right</option>
              <option value="LEFT">Left</option>
              <option value="AMBIDEXTROUS">Both</option>
            </select>
          </label>
        </div>
        <label className="block text-xs text-ink-dim">Short bio<textarea value={v.bio} onChange={on("bio")} rows={2} className={field} /></label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Contact</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink-dim">Your phone<input type="tel" value={v.contactPhone} onChange={on("contactPhone")} className={field} /></label>
          <label className="text-xs text-ink-dim">Address<input value={v.address} onChange={on("address")} className={field} /></label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Emergency contact & guardian</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-ink-dim">Emergency name<input value={v.emergencyContactName} onChange={on("emergencyContactName")} className={field} /></label>
          <label className="text-xs text-ink-dim">Emergency phone<input type="tel" value={v.emergencyContactPhone} onChange={on("emergencyContactPhone")} className={field} /></label>
          <label className="text-xs text-ink-dim">Relationship<input value={v.emergencyContactRelation} onChange={on("emergencyContactRelation")} className={field} /></label>
          <label className="text-xs text-ink-dim">Guardian name<input value={v.guardianName} onChange={on("guardianName")} className={field} /></label>
          <label className="text-xs text-ink-dim">Guardian phone<input type="tel" value={v.guardianContact} onChange={on("guardianContact")} className={field} /></label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Wellbeing</legend>
        <p className="text-xs text-ink-faint">Only you, the club administrator and the relevant club officer can see these.</p>
        <label className="block text-xs text-ink-dim">Medical notes (allergies, conditions, medication)<textarea value={v.medicalNotes} onChange={on("medicalNotes")} rows={2} className={field} /></label>
        <label className="block text-xs text-ink-dim">Welfare notes<textarea value={v.welfareNotes} onChange={on("welfareNotes")} rows={2} className={field} /></label>
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-flame px-5 py-2 text-sm font-bold text-on-flame disabled:opacity-50">
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sm text-success">Saved ✓</span>}
      </div>
    </form>
  );
}
