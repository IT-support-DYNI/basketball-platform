"use client";

import { FormEvent, useEffect, useState } from "react";
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

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
type Mode = "self" | "guardian";

export default function RegisterPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamsError, setTeamsError] = useState("");
  const [mode, setMode] = useState<Mode>("self");

  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    teamId: "",
    position: "",
    dateOfBirth: "",
    contactPhone: "",
    // guardian mode
    guardianName: "",
    guardianEmail: "",
    guardianPassword: "",
    guardianPhone: "",
    relationshipLabel: "Parent",
    childName: "",
    childEmail: "",
    childDateOfBirth: "",
  });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    fetch("/api/v1/public/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch(() => setTeamsError("Couldn't load the team list — refresh to try again."));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!consentAccepted) return setError("You need to accept the club's registration terms to continue.");
    if (!f.teamId) return setError("Choose a team.");

    setLoading(true);
    try {
      const [url, payload, loginEmail, loginPassword] =
        mode === "self"
          ? [
              "/api/v1/register",
              {
                name: f.name,
                email: f.email,
                password: f.password,
                teamId: Number(f.teamId),
                position: f.position || undefined,
                dateOfBirth: f.dateOfBirth,
                contactPhone: f.contactPhone || undefined,
                consentAccepted: true,
              },
              f.email,
              f.password,
            ]
          : [
              "/api/v1/register/guardian",
              {
                guardianName: f.guardianName,
                guardianEmail: f.guardianEmail,
                guardianPassword: f.guardianPassword,
                guardianPhone: f.guardianPhone || undefined,
                relationshipLabel: f.relationshipLabel,
                childName: f.childName,
                childEmail: f.childEmail || undefined,
                childDateOfBirth: f.childDateOfBirth,
                teamId: Number(f.teamId),
                position: f.position || undefined,
                consentAccepted: true,
              },
              f.guardianEmail,
              f.guardianPassword,
            ];

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong submitting your registration.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      if (!signInResult || signInResult.error) {
        router.push("/login");
        return;
      }
      router.push(mode === "self" ? "/registration-status" : "/guardian");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const teamSelect = (
    <Select label="Team" value={f.teamId} onChange={set("teamId")} required error={teamsError || undefined}>
      <option value="">Select a team…</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
          {team.ageGroup ? ` (${team.ageGroup})` : ""}
        </option>
      ))}
    </Select>
  );
  const positionSelect = (
    <Select label="Preferred position" hint="Optional — the coach confirms this" value={f.position} onChange={set("position")}>
      <option value="">Not sure yet</option>
      {POSITIONS.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </Select>
  );

  return (
    <AuthShell
      width="lg"
      title="Register to join"
      subtitle="An administrator reviews every registration before full access is granted — you can check your status as soon as you sign up."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-flame-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-5 flex rounded-full border border-line p-0.5 text-sm font-semibold">
        {(["self", "guardian"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); }}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 transition",
              mode === m ? "bg-flame/15 text-flame-ink" : "text-ink-dim hover:text-ink",
            )}
          >
            {m === "self" ? "I'm the player (18+)" : "A parent or guardian is signing up"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "self" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" value={f.name} onChange={set("name")} required />
            <TextField label="Email" type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
            <TextField label="Password" type="password" value={f.password} onChange={set("password")} required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
            <TextField label="Date of birth" type="date" value={f.dateOfBirth} onChange={set("dateOfBirth")} required />
            {teamSelect}
            {positionSelect}
            <TextField label="Your phone" hint="Optional" type="tel" value={f.contactPhone} onChange={set("contactPhone")} />
          </div>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Your details (the guardian)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Your full name" value={f.guardianName} onChange={set("guardianName")} required />
              <TextField label="Your email" type="email" value={f.guardianEmail} onChange={set("guardianEmail")} required autoComplete="email" />
              <TextField label="Your password" type="password" value={f.guardianPassword} onChange={set("guardianPassword")} required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
              <TextField label="Your phone" hint="Optional" type="tel" value={f.guardianPhone} onChange={set("guardianPhone")} />
              <TextField label="Relationship to the player" value={f.relationshipLabel} onChange={set("relationshipLabel")} required />
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">Your child (the player)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Child's full name" value={f.childName} onChange={set("childName")} required />
              <TextField label="Child's date of birth" type="date" value={f.childDateOfBirth} onChange={set("childDateOfBirth")} required />
              <TextField label="Child's email" hint="Optional — leave blank if they won't have their own login" type="email" value={f.childEmail} onChange={set("childEmail")} autoComplete="off" />
              {teamSelect}
              {positionSelect}
            </div>
          </>
        )}

        <label className="flex items-start gap-2.5 text-sm text-ink-dim">
          <input type="checkbox" checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-flame" required />
          <span>
            I agree to the club&apos;s code of conduct and consent to my (or my child&apos;s) information being processed for
            team administration, in line with the club&apos;s privacy notice.
          </span>
        </label>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? "Submitting" : "Submit registration"}
        </Button>
      </form>
    </AuthShell>
  );
}
