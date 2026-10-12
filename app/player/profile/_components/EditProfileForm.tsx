"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  contactPhone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  nationality: string | null;
  heightCm: number | null;
  weightKg: number | null;
  preferredHand: string | null;
  bio: string | null;
  quote: string | null;
  hasPreviousClub: boolean | null;
  previousClubs: string | null;
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
    weightKg: initial.weightKg?.toString() ?? "",
    preferredHand: initial.preferredHand ?? "",
    bio: initial.bio ?? "",
    quote: initial.quote ?? "",
    hasPreviousClub: initial.hasPreviousClub == null ? "" : initial.hasPreviousClub ? "yes" : "no",
    previousClubs: initial.previousClubs ?? "",
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
        weightKg: v.weightKg ? Number(v.weightKg) : undefined,
        preferredHand: v.preferredHand || undefined,
        bio: v.bio || undefined,
        quote: v.quote.trim() || null,
        ...(v.hasPreviousClub
          ? {
              hasPreviousClub: v.hasPreviousClub === "yes",
              previousClubs: v.hasPreviousClub === "yes" ? v.previousClubs.trim() : null,
            }
          : {}),
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
      <fieldset className="space-y-2 rounded-control border border-flame/25 bg-flame/[0.04] p-4">
        <legend className="px-1 font-mono text-[11px] uppercase tracking-wider text-flame-on-bg">Your bio</legend>
        <p className="text-xs text-ink-faint">
          Shown at the top of your profile. Club members and coaches see this, and, if the club approves
          your profile as public, so could anyone scouting for talent. Make it count.
        </p>
        <textarea
          value={v.bio}
          onChange={on("bio")}
          rows={4}
          maxLength={1000}
          placeholder="Position, playing style, what you're working on, achievements: your call."
          className={field}
        />
        <p className="text-right text-[11px] text-ink-faint">{v.bio.length}/1000</p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Your quote</legend>
        <p className="text-xs text-ink-faint">
          One line in your own words, shown under your name on your profile. It only appears on the public
          club site once the club has approved it.
        </p>
        <label className="block text-xs text-ink-dim">
          Quote
          <input
            value={v.quote}
            onChange={on("quote")}
            maxLength={140}
            placeholder="e.g. Hard work beats talent when talent doesn't work hard."
            className={field}
          />
        </label>
        <p className="text-right text-[11px] text-ink-faint">{v.quote.length}/140</p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Club history</legend>
        <p id="club-history-q" className="text-xs text-ink-dim">
          Have you played for another club before? <span className="text-ink-faint">(required)</span>
        </p>
        <div role="radiogroup" aria-labelledby="club-history-q" className="flex flex-wrap gap-4 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input type="radio" name="hasPreviousClub" value="yes" checked={v.hasPreviousClub === "yes"} onChange={on("hasPreviousClub")} required className="h-4 w-4 accent-flame" />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="hasPreviousClub" value="no" checked={v.hasPreviousClub === "no"} onChange={on("hasPreviousClub")} required className="h-4 w-4 accent-flame" />
            No, this is my first club
          </label>
        </div>
        {v.hasPreviousClub === "yes" && (
          <label className="block text-xs text-ink-dim">
            Which club, and when? (e.g. Belfast Star U14, 2023 to 2025)
            <input value={v.previousClubs} onChange={on("previousClubs")} required minLength={2} maxLength={300} className={field} />
          </label>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">About you</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink-dim">Date of birth<input type="date" value={v.dateOfBirth} onChange={on("dateOfBirth")} className={field} /></label>
          <label className="text-xs text-ink-dim">Country<input value={v.nationality} onChange={on("nationality")} className={field} /></label>
          <label className="text-xs text-ink-dim">Height (cm)<input type="number" min={80} max={260} value={v.heightCm} onChange={on("heightCm")} className={field} /></label>
          <label className="text-xs text-ink-dim">Weight (kg)<input type="number" min={20} max={200} value={v.weightKg} onChange={on("weightKg")} className={field} /></label>
          <label className="text-xs text-ink-dim">Preferred hand
            <select value={v.preferredHand} onChange={on("preferredHand")} className={field}>
              <option value="">Not set</option>
              <option value="RIGHT">Right</option>
              <option value="LEFT">Left</option>
              <option value="AMBIDEXTROUS">Both</option>
            </select>
          </label>
        </div>
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
