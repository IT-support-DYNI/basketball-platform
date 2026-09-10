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

      <section style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="profile-hero">
            <div className="profile-hero-in">
              <div className="profile-photo">
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
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 800,
                      fontSize: "2rem",
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="eyebrow">{coach.roleLine ?? "Coach"}</p>
                <h1>{coach.name}</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

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
