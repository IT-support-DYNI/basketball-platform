import type { Metadata } from "next";

import { getPublicCoaches } from "@/lib/public-site";
import TiltCard from "@/components/public/landing/TiltCard";

export const metadata: Metadata = { title: "Coaching staff" };

export default async function PublicCoachesPage() {
  const coaches = await getPublicCoaches(500);

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Coaching staff</p>
          <h1>The people on the floor.</h1>
          <p className="lead">Shown here only once a coach opts in to a public profile.</p>
        </div>
      </section>
      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          {coaches.length === 0 ? (
            <p className="lead">No coach profiles are public yet — check back soon.</p>
          ) : (
            <div className="coach-grid">
              {coaches.map((c, i) => (
                <TiltCard key={c.id} className="coach" href={`/club/coaches/${c.id}`} delayMs={(i % 9) * 70}>
                  <div className={`photo${c.photoUrl ? " has-img" : ""}`}>
                    {c.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photoUrl} alt="" />
                    )}
                  </div>
                  <h3>{c.name}</h3>
                  {c.roleLine && <p className="role">{c.roleLine}</p>}
                  {c.bio && <p className="bio">{c.bio}</p>}
                </TiltCard>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
