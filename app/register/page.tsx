"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";

interface TeamOption {
  id: number;
  name: string;
  ageGroup: string | null;
}
type Mode = "self" | "guardian";
type Data = Record<string, string>;

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

const STEP_TITLES: Record<Mode, string[]> = {
  self: ["Your account", "About you", "Your team", "Agreement", "Review"],
  guardian: ["Your account", "Your child", "Their team", "Agreement", "Review"],
};

export default function RegisterPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [ready, setReady] = useState(false);

  const [mode, setMode] = useState<Mode>("self");
  const [step, setStep] = useState(0); // 0 = the email/mode entry screen
  const [d, setD] = useState<Data>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: { target: { value: string } }) => setD((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    fetch("/api/v1/public/teams")
      .then((r) => r.json())
      .then(setTeams)
      .catch(() => {});
    fetch("/api/v1/registration/draft")
      .then((r) => (r.ok ? r.json() : null))
      .then((view) => {
        if (view) {
          setMode(view.mode);
          setD({ ...(view.data ?? {}), email: view.email });
          setStep(Math.min(Math.max(view.currentStep, 1), 5));
        }
      })
      .finally(() => setReady(true));
  }, []);

  async function api(method: string, path: string, body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
    return json;
  }

  async function startDraft(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const view = await api("POST", "/api/v1/registration/draft", { email: d.email, mode });
      setD({ ...view.data, email: d.email });
      setStep(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function next(fields: string[]) {
    setError("");
    setBusy(true);
    try {
      const patch = Object.fromEntries(fields.map((k) => [k, d[k] ?? ""]));
      await api("PATCH", "/api/v1/registration/draft", { currentStep: step + 1, data: patch });
      setStep(step + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await api("POST", "/api/v1/registration/draft/submit");
      const email = mode === "self" ? d.email : d.email;
      const password = mode === "self" ? d.password : d.guardianPassword;
      const r = await signIn("credentials", { email, password, redirect: false });
      if (!r || r.error) return router.push("/login");
      router.push(mode === "self" ? "/registration-status" : "/guardian");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const titles = STEP_TITLES[mode];

  const teamSelect = (
    <Select label="Team" value={d.teamId ?? ""} onChange={set("teamId")} required>
      <option value="">Select a team…</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}{t.ageGroup ? ` (${t.ageGroup})` : ""}
        </option>
      ))}
    </Select>
  );
  const positionSelect = (
    <Select label="Preferred position" hint="Optional" value={d.position ?? ""} onChange={set("position")}>
      <option value="">Not sure yet</option>
      {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
    </Select>
  );

  const review = useMemo(() => {
    const rows: [string, string | undefined][] =
      mode === "self"
        ? [
            ["Name", d.name],
            ["Email", d.email],
            ["Date of birth", d.dateOfBirth],
            ["Phone", d.contactPhone],
            ["Team", teams.find((t) => String(t.id) === d.teamId)?.name],
            ["Position", d.position],
          ]
        : [
            ["Guardian", d.guardianName],
            ["Guardian email", d.email],
            ["Relationship", d.relationshipLabel],
            ["Child", d.childName],
            ["Child DOB", d.childDateOfBirth],
            ["Child email", d.childEmail || "— (no login)"],
            ["Team", teams.find((t) => String(t.id) === d.teamId)?.name],
            ["Position", d.position],
          ];
    return rows.filter(([, v]) => v);
  }, [mode, d, teams]);

  return (
    <AuthShell
      width="lg"
      title="Register to join"
      subtitle="Your progress is saved as you go — you can leave and come back to finish."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-flame-ink hover:underline">Sign in</Link>
        </>
      }
    >
      {!ready ? (
        <p className="text-sm text-ink-dim">Loading…</p>
      ) : step === 0 ? (
        <form onSubmit={startDraft} className="flex flex-col gap-4">
          <div className="flex rounded-full border border-line p-0.5 text-sm font-semibold">
            {(["self", "guardian"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn("flex-1 rounded-full px-3 py-1.5 transition", mode === m ? "bg-flame/15 text-flame-ink" : "text-ink-dim hover:text-ink")}
              >
                {m === "self" ? "I'm the player (18+)" : "I'm a parent or guardian"}
              </button>
            ))}
          </div>
          <TextField
            label={mode === "self" ? "Your email" : "Your email (the guardian's)"}
            type="email"
            value={d.email ?? ""}
            onChange={set("email")}
            required
            autoComplete="email"
          />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" size="lg" fullWidth loading={busy}>Start</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-wider">
            {titles.map((t, i) => (
              <li key={t} className={cn(i + 1 === step ? "text-flame-ink" : i + 1 < step ? "text-ink-dim" : "text-ink-faint")}>
                {i + 1}. {t}
              </li>
            ))}
          </ol>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 5) return submit();
              const fieldsByStep: Record<number, string[]> =
                mode === "self"
                  ? { 1: ["name", "password"], 2: ["dateOfBirth", "contactPhone"], 3: ["teamId", "position"], 4: [] }
                  : {
                      1: ["guardianName", "guardianPassword", "guardianPhone", "relationshipLabel"],
                      2: ["childName", "childDateOfBirth", "childEmail"],
                      3: ["teamId", "position"],
                      4: [],
                    };
              next(fieldsByStep[step] ?? []);
            }}
            className="flex flex-col gap-4"
          >
            {mode === "self" && step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Full name" value={d.name ?? ""} onChange={set("name")} required />
                <TextField label="Password" type="password" value={d.password ?? ""} onChange={set("password")} required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
              </div>
            )}
            {mode === "self" && step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Date of birth" type="date" value={d.dateOfBirth ?? ""} onChange={set("dateOfBirth")} required />
                <TextField label="Your phone" hint="Optional" type="tel" value={d.contactPhone ?? ""} onChange={set("contactPhone")} />
              </div>
            )}

            {mode === "guardian" && step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Your full name" value={d.guardianName ?? ""} onChange={set("guardianName")} required />
                <TextField label="Password" type="password" value={d.guardianPassword ?? ""} onChange={set("guardianPassword")} required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
                <TextField label="Your phone" hint="Optional" type="tel" value={d.guardianPhone ?? ""} onChange={set("guardianPhone")} />
                <TextField label="Relationship to the player" value={d.relationshipLabel ?? "Parent"} onChange={set("relationshipLabel")} required />
              </div>
            )}
            {mode === "guardian" && step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Child's full name" value={d.childName ?? ""} onChange={set("childName")} required />
                <TextField label="Child's date of birth" type="date" value={d.childDateOfBirth ?? ""} onChange={set("childDateOfBirth")} required />
                <TextField label="Child's email" hint="Optional — leave blank if they won't have a login" type="email" value={d.childEmail ?? ""} onChange={set("childEmail")} autoComplete="off" />
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {teamSelect}
                {positionSelect}
              </div>
            )}

            {step === 4 && (
              <label className="flex items-start gap-2.5 text-sm text-ink-dim">
                <input type="checkbox" checked={d.consent === "yes"} onChange={(e) => setD((p) => ({ ...p, consent: e.target.checked ? "yes" : "" }))} className="mt-1 h-4 w-4 accent-flame" required />
                <span>
                  I agree to the club&apos;s code of conduct and consent to my (or my child&apos;s) information being
                  processed for team administration, in line with the club&apos;s privacy notice. The full documents
                  are shown once you sign in.
                </span>
              </label>
            )}

            {step === 5 && (
              <dl className="rounded-card border border-line bg-surface-2 p-4 text-sm">
                {review.map(([k, v]) => (
                  <div key={k} className="flex gap-3 py-1">
                    <dt className="w-32 flex-none font-mono text-[11px] uppercase tracking-wider text-ink-faint">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex items-center gap-3">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-dim hover:text-ink">
                  Back
                </button>
              )}
              <Button type="submit" loading={busy} disabled={step === 4 && d.consent !== "yes"}>
                {step === 5 ? "Submit registration" : "Continue"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
