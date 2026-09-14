"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ReviewSafeguardingReportForm({
  reportId,
  currentStatus,
  currentNotes,
}: {
  reportId: number;
  currentStatus: string;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/safeguarding-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes: notes || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const notesId = `safeguarding-notes-${reportId}`;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-control border border-line bg-surface-2 p-4">
      <div className="max-w-xs">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="NEW">New</option>
          <option value="IN_REVIEW">In review</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={notesId} className="text-sm font-semibold text-ink">
          Internal review notes
        </label>
        <p className="text-xs text-ink-dim">Visible to admins only — never shown to the reporter.</p>
        <textarea
          id={notesId}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-flame/50"
        />
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div>
        <Button size="sm" loading={loading} disabled={loading} onClick={submit}>
          Save
        </Button>
      </div>
    </div>
  );
}
