import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

const VALUES = [
  { title: "Everyone develops", body: "Minutes are earned. Coaching isn't. Every player on the roster gets a plan and a review, top of the rotation or bottom." },
  { title: "Families see the work", body: "Session plans, attendance and feedback are shared, not locked in a coach's head. You should never have to guess how it's going." },
  { title: "Safeguarding first", body: "Trained staff on every court. Nothing about a junior player is published without a guardian approving it." },
  { title: "Cost is never the reason", body: "Hardship support exists, it's quiet, and asking for it changes nothing about how a player is treated." },
];

export default function PublicAboutPage() {
  return (
    <main>
      <section className="page-head page-head-dark">
        <div className="wrap">
          <p className="eyebrow">About the club</p>
          <h1>A club, not an academy pipeline.</h1>
          <p className="lead">
            We&apos;re run by Diverse Youth Northern Ireland — a community basketball club running juniors through
            seniors out of one gym. Some of our players will go on to play at a high level. Most won&apos;t — and the
            season should be worth it either way.
          </p>
        </div>
      </section>

      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          <h2 style={{ fontSize: "var(--type-display-1)" }}>What we hold ourselves to</h2>
          <div className="team-grid" style={{ marginTop: 28 }}>
            {VALUES.map((v) => (
              <div className="card" key={v.title}>
                <h3 style={{ fontSize: "var(--type-display-3)" }}>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 var(--section-y)" }}>
        <div className="wrap" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="card">
            <p className="card-label">Where we play</p>
            <p>This is where the club&apos;s venue name, address and parking notes go — ask the club to add its real details here.</p>
          </div>
          <div className="card">
            <p className="card-label">Get in touch</p>
            <p>This is where the club&apos;s contact email and safeguarding lead go — ask the club to add its real details here.</p>
            <Link className="btn btn-primary btn-sm" href="/register" style={{ marginTop: 14 }}>
              Register interest
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
