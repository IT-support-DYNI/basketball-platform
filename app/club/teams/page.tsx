import type { Metadata } from "next";
import Link from "next/link";

import { getPublicTeams } from "@/lib/public-site";

export const metadata: Metadata = { title: "Teams" };

export default async function PublicTeamsPage() {
  const teams = await getPublicTeams();

  return (
    <main>
      <section className="page-head page-head-dark">
        <div className="wrap">
          <p className="eyebrow">Teams &amp; programs</p>
          <h1>One club, one standard.</h1>
          <p className="lead">
            Every squad runs the same session structure and the same development framework. What changes is the
            level, not the care.
          </p>
        </div>
      </section>

      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          {teams.length === 0 ? (
            <p className="lead">Teams will appear here once the club sets them up.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {teams.map((t) => (
                <div className="card" key={t.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "var(--type-display-3)" }}>{t.name}</h3>
                    {t.description && <p style={{ marginTop: 6 }}>{t.description}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 20, flex: "none", textAlign: "right" }}>
                    {t.ageGroup && <span className="mono" style={{ fontSize: "var(--type-label-sm)", color: "var(--text-3)" }}>{t.ageGroup}</span>}
                    <span className="mono" style={{ fontSize: "var(--type-label-sm)", color: "var(--text-3)" }}>
                      {t.memberCount} {t.memberCount === 1 ? "player" : "players"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: "0 0 var(--section-y)" }}>
        <div className="wrap card" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <p style={{ fontSize: "var(--type-display-3)", fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 800, textTransform: "uppercase", color: "var(--text-1)" }}>
              Ready to find your team?
            </p>
            <p style={{ marginTop: 4 }}>Registration is reviewed by the club before anyone gets access.</p>
          </div>
          <Link className="btn btn-primary" href="/register">
            Start registration
          </Link>
        </div>
      </section>
    </main>
  );
}
