"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

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

export default function RegisterPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamsError, setTeamsError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/public/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch(() => setTeamsError("Couldn't load the team list — refresh to try again."));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!consentAccepted) {
      setError("You need to accept the club's registration terms to continue.");
      return;
    }
    if (!teamId) {
      setError("Choose a team.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          teamId: Number(teamId),
          position: position || undefined,
          jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
          dateOfBirth,
          contactPhone: contactPhone || undefined,
          guardianName: guardianName || undefined,
          guardianContact: guardianContact || undefined,
          consentAccepted: true,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong submitting your registration.");
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (!signInResult || signInResult.error) {
        router.push("/login");
        return;
      }

      router.push("/registration-status");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      width="lg"
      title="Register to join"
      subtitle="Submit your details below. An administrator reviews every registration before full access is granted — you can check your status as soon as you sign up."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-flame-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters."
          />
          <TextField label="Date of birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
          <Select label="Team" value={teamId} onChange={(e) => setTeamId(e.target.value)} required error={teamsError || undefined}>
            <option value="">Select a team…</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
                {team.ageGroup ? ` (${team.ageGroup})` : ""}
              </option>
            ))}
          </Select>
          <Select label="Position" hint="Optional" value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="">Not sure yet</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <TextField label="Jersey number" hint="Optional" type="number" min={0} max={99} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} />
          <TextField label="Your phone" hint="Optional" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          <TextField label="Parent / guardian name" hint="If under 18" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
          <TextField label="Parent / guardian contact" hint="If under 18" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-ink-dim">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 accent-flame"
            required
          />
          <span>
            I agree to the club&apos;s code of conduct and consent to my (or my child&apos;s) information being processed
            for team administration, in line with the club&apos;s privacy notice.
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
