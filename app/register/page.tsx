"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

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
      setError("You must accept the club's registration terms to continue.");
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
        setError(body.error ?? "Something went wrong.");
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (!signInResult || signInResult.error) {
        // Account was created fine; sign-in just didn't complete automatically — send them to log in manually.
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
    <main className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-gradient-to-b from-orange-50 via-white to-white px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-court-500 to-court-700 text-lg shadow-sm shadow-court-500/30">
          🏀
        </span>
        <h1 className="mb-2 mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Register to join</h1>
        <p className="mb-6 text-slate-600">
          Submit your details below. An administrator reviews every registration before you get full access —
          you'll be able to check your status as soon as you sign up.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Date of birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Team</label>
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20">
                <option value="">Select a team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.ageGroup ? ` (${t.ageGroup})` : ""}</option>
                ))}
              </select>
              {teamsError && <p className="mt-1 text-xs text-rose-600">{teamsError}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Position (optional)</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20">
                <option value="">Not sure yet</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Jersey number (optional)</label>
              <input type="number" min={0} max={99} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Your phone (optional)</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Parent/guardian name (if under 18)</label>
              <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Parent/guardian contact</label>
              <input type="text" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} className="mt-1" required />
            <span>
              I agree to the club's code of conduct and consent to my (or my child's) information being processed
              for the purposes of team administration, in line with the club's privacy notice.
            </span>
          </label>

          {error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-court-500 to-court-700 px-4 py-2.5 font-bold text-white shadow-sm shadow-court-500/30 transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Submitting..." : "Submit registration"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link href="/login" className="font-semibold text-court-700 hover:text-court-800">Log in</Link>
        </p>
      </div>
    </main>
  );
}
