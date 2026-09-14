import type { Metadata } from "next";
import SafeguardingConcernForm from "@/app/club/_components/SafeguardingConcernForm";

export const metadata: Metadata = { title: "Safeguarding" };

const COMMITMENTS = [
  { title: "Vetted staff", body: "AccessNI checks and safeguarding training for every coach and volunteer on the floor." },
  { title: "Guardian consent", body: "Photos, profiles and video are opt-in per player, and reversible at any time." },
  {
    title: "A named lead, on request",
    body: "The club has a designated safeguarding lead — ask at registration or via the club's contact details for who to reach and how.",
  },
  { title: "Open sessions", body: "Parents and guardians are welcome to stay and watch any session, any age group." },
  {
    title: "Every report goes to admins only",
    body: "A concern raised below goes straight to the club's admin team — never to a coach, and never to another player or guardian.",
  },
  { title: "You can stay anonymous", body: "Only the description of what happened is required. A name and email are optional." },
];

export default function PublicSafeguardingPage() {
  return (
    <main>
      <section className="page-head page-head-dark">
        <div className="wrap">
          <p className="eyebrow">Safeguarding</p>
          <h1>Every coach vetted. Every concern heard.</h1>
          <p className="lead">
            Everything the club does to keep players safe, and one place to raise a concern if something isn&apos;t
            right — reviewed by admins only.
          </p>
        </div>
      </section>

      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          <h2 style={{ fontSize: "var(--type-display-1)" }}>What we hold ourselves to</h2>
          <div className="team-grid" style={{ marginTop: 28 }}>
            {COMMITMENTS.map((c) => (
              <div className="card" key={c.title}>
                <p className="card-label">{c.title}</p>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 var(--section-y)", borderTop: "var(--border-hairline)" }}>
        <div className="wrap reg-in" style={{ paddingTop: "var(--section-y)" }}>
          <div>
            <p className="eyebrow">Report a concern</p>
            <h2 style={{ fontSize: "var(--type-display-1)", marginTop: 12, maxWidth: "20ch" }}>
              Tell us what happened
            </h2>
            <p className="note" style={{ marginTop: 14, fontSize: "var(--type-small)", color: "var(--text-2)", maxWidth: "46ch" }}>
              This isn&apos;t a general contact form — it&apos;s for a safeguarding or welfare concern about a player,
              coach, volunteer or session. It goes straight to the club&apos;s admin team. If someone is in immediate
              danger, contact emergency services first.
            </p>
          </div>
          <SafeguardingConcernForm />
        </div>
      </section>
    </main>
  );
}
