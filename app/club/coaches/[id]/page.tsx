import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { getPublicCoach } from "@/lib/public-site";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const coach = await getPublicCoach(Number(params.id));
  return { title: coach ? coach.name : "Coach" };
}

export default async function PublicCoachPage({ params }: { params: { id: string } }) {
  const coachId = Number(params.id);
  if (!Number.isInteger(coachId)) notFound();

  const coach = await getPublicCoach(coachId);
  if (!coach) notFound();

  const initials = coach.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <main>
      <section style={{ paddingTop: 28 }}>
        <div className="wrap">
          <Link className="back-link" href="/club/coaches">
            ← Back to coaching staff
          </Link>
        </div>
      </section>

      <div className="profile-banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="profile-banner-crest" src="/brand/dyni-blazers-crest.png" alt="" />
        <div className="profile-banner-body">
          <div className="profile-banner-photo">
            {coach.photoUrl ? (
              <div className="photo has-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coach.photoUrl} alt="" />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--photo-ground)",
                  color: "var(--photo-text)",
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 800,
                  fontSize: "2.5rem",
                }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className="profile-banner-info">
            <p className="profile-banner-meta">DYNI Blazers | Coaching staff</p>
            <h1 className="profile-banner-name">{coach.name}</h1>
          </div>
        </div>
      </div>

      <div className="profile-stat-bar">
        <div className="profile-stat">
          <span className="l">Role</span>
          <span className="v">{coach.roleLine ?? "Coach"}</span>
        </div>
      </div>

      {coach.bio ? (
        <section style={{ padding: "20px 0 var(--section-y)" }}>
          <div className="wrap">
            <div className="card">
              <p className="card-label">About</p>
              <p>{coach.bio}</p>
            </div>
          </div>
        </section>
      ) : (
        <div style={{ paddingBottom: "var(--section-y)" }} />
      )}
    </main>
  );
}
