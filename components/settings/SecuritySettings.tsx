"use client";

import { useCallback, useEffect, useState } from "react";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

type MfaStatus = { enabled: boolean; recoveryCodesRemaining: number; recommended: boolean };
type SessionRow = { id: number; current: boolean; userAgent: string | null; createdAt: string; lastSeenAt: string };

export default function SecuritySettings() {
  const toast = useToast();
  const [mfa, setMfa] = useState<MfaStatus | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  const load = useCallback(async () => {
    const [m, s] = await Promise.all([
      fetch("/api/v1/auth/mfa").then((r) => r.json()),
      fetch("/api/v1/auth/sessions").then((r) => r.json()),
    ]);
    setMfa(m);
    setSessions(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <MfaCard status={mfa} onChange={load} toast={toast} />
      <SessionsCard sessions={sessions} onChange={load} toast={toast} />
    </div>
  );
}

/* ----------------------------- MFA ----------------------------- */

function MfaCard({
  status,
  onChange,
  toast,
}: {
  status: MfaStatus | null;
  onChange: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [enrolling, setEnrolling] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  if (!status) return <LoadingState rows={2} label="Loading two-factor status" />;

  async function startSetup() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/mfa/setup", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't start setup.");
        return;
      }
      setEnrolling(body);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That code didn't match.");
        return;
      }
      setRecovery(body.recoveryCodes);
      setEnrolling(null);
      setCode("");
      onChange();
      toast({ title: "Two-factor authentication is on", tone: "success" });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    const entered = window.prompt("Enter a current 6-digit code (or a recovery code) to turn two-factor off:");
    if (!entered) return;
    const res = await fetch("/api/v1/auth/mfa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: entered }),
    });
    if (res.ok) {
      onChange();
      setRecovery(null);
      toast({ title: "Two-factor authentication turned off", tone: "warning" });
    } else {
      const body = await res.json().catch(() => ({}));
      toast({ title: body.error ?? "That code didn't match", tone: "danger" });
    }
  }

  return (
    <Card as="section">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          Two-factor authentication
        </h2>
        {status.enabled ? (
          <Badge tone="success">On</Badge>
        ) : status.recommended ? (
          <Badge tone="warning">Recommended</Badge>
        ) : (
          <Badge>Off</Badge>
        )}
      </div>

      {status.recommended && !status.enabled && (
        <Alert tone="warning" className="mt-3">
          You&apos;re an administrator — please turn this on. It protects the whole club&apos;s data if your password is ever stolen.
        </Alert>
      )}

      {recovery && (
        <Alert tone="info" className="mt-3">
          <p className="font-semibold">Save your recovery codes now — they won&apos;t be shown again.</p>
          <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
            {recovery.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </Alert>
      )}

      {status.enabled ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-ink-dim">
            {status.recoveryCodesRemaining} recovery code{status.recoveryCodesRemaining === 1 ? "" : "s"} left.
          </p>
          <Button variant="destructive" size="sm" onClick={disable} className="self-start">
            Turn off
          </Button>
        </div>
      ) : enrolling ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-ink-dim">
            Add this account to an authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code it shows.
          </p>
          <div className="rounded-control border border-line bg-surface-2 p-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Setup key</p>
            <p className="mt-1 select-all break-all font-mono text-sm text-ink">{formatSecret(enrolling.secret)}</p>
            <a
              href={enrolling.otpauthUri}
              className="mt-2 inline-block text-xs font-semibold text-flame-ink hover:underline"
            >
              Open in an app on this device
            </a>
          </div>
          <TextField
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex gap-2">
            <Button size="sm" loading={busy} onClick={confirm}>
              Confirm &amp; turn on
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEnrolling(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
          <Button size="sm" loading={busy} onClick={startSetup}>
            Set up two-factor authentication
          </Button>
        </div>
      )}
    </Card>
  );
}

/* --------------------------- Sessions --------------------------- */

function SessionsCard({
  sessions,
  onChange,
  toast,
}: {
  sessions: SessionRow[] | null;
  onChange: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  if (!sessions) return <LoadingState rows={3} label="Loading sessions" />;

  async function revoke(id: number) {
    const res = await fetch(`/api/v1/auth/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      onChange();
      toast({ title: "Device signed out", tone: "success" });
    }
  }

  async function revokeOthers() {
    const res = await fetch("/api/v1/auth/sessions/revoke-others", { method: "POST" });
    if (res.ok) {
      const body = await res.json();
      onChange();
      toast({ title: `Signed out ${body.revoked} other device${body.revoked === 1 ? "" : "s"}`, tone: "success" });
    }
  }

  return (
    <Card as="section">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Signed-in devices</h2>
        {sessions.length > 1 && (
          <Button size="sm" variant="secondary" onClick={revokeOthers}>
            Sign out all other devices
          </Button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-line">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">
                {describeUserAgent(s.userAgent)}
                {s.current && <Badge tone="flame" className="ml-2">This device</Badge>}
              </p>
              <p className="text-xs text-ink-faint">
                last active {new Date(s.lastSeenAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            {!s.current && (
              <Button size="sm" variant="ghost" onClick={() => revoke(s.id)}>
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ----------------------------- utils ----------------------------- */

function formatSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

function describeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const os =
    /Windows/.test(ua) ? "Windows" :
    /iPhone|iPad|iOS/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" : "device";
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "browser";
  return `${browser} on ${os}`;
}
