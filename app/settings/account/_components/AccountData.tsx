"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/toast";

export default function AccountData() {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/account/export");
      if (!res.ok) {
        toast({ title: "Couldn't prepare your export", tone: "danger" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        "dyni-blazers-account.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Your data has been downloaded", tone: "success" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card as="section">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Download your data</h2>
        <p className="mt-1 text-sm text-ink-dim">
          A JSON file with your profile, team history, RSVPs, attendance, evaluations, messages you
          sent, and the record of actions on your account.
        </p>
        <Button variant="secondary" className="mt-4" loading={exporting} onClick={exportData}>
          Download my data
        </Button>
      </Card>

      <DeleteAccountCard onDeleted={() => signOut({ callbackUrl: "/login" })} toast={toast} />
    </div>
  );
}

function DeleteAccountCard({
  onDeleted,
  toast,
}: {
  onDeleted: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't delete your account.");
        return;
      }
      toast({ title: "Your account has been closed", tone: "neutral" });
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="section" className="border-danger/30">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-danger">Close your account</h2>
      <p className="mt-1 text-sm text-ink-dim">
        Your personal details are erased. Club records that others rely on — attendance, evaluations,
        messages you sent — are kept but no longer show your name. This can&rsquo;t be undone.
      </p>

      {!open ? (
        <Button variant="destructive" className="mt-4" onClick={() => setOpen(true)}>
          Close my account…
        </Button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {error && <Alert tone="danger">{error}</Alert>}
          <TextField
            label="Your password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Type DELETE to confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoCapitalize="characters"
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              loading={busy}
              disabled={confirm !== "DELETE" || password.length === 0}
              onClick={submit}
            >
              Permanently close my account
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
