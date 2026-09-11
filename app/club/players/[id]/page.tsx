import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { getPublicPlayer } from "@/lib/public-site";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const player = await getPublicPlayer(Number(params.id));
  return { title: player ? player.name : "Player" };
}

export default async function PublicPlayerPage({ params }: { params: { id: string } }) {
  const playerId = Number(params.id);
  if (!Number.isInteger(playerId)) notFound();

  const player = await getPublicPlayer(playerId);
  if (!player) notFound();

  const initials = player.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <main>
      <section style={{ paddingTop: 28 }}>
        <div className="wrap">
          <Link className="back-link" href="/club/roster">
            ← Back to roster
          </Link>
        </div>
      </section>

      <div className="profile-banner">
        {player.jerseyNumber != null && <span className="profile-banner-jersey">{player.jerseyNumber}</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="profile-banner-crest" src="/brand/dyni-blazers-crest.png" alt="" />
        <div className="profile-banner-body">
          <div className="profile-banner-photo">
            {player.photoUrl ? (
              <div className="photo has-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={player.photoUrl} alt="" />
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
            <p className="profile-banner-meta">
              {[player.team ?? "DYNI Blazers", player.jerseyNumber != null ? `#${player.jerseyNumber}` : null, player.positionLabel]
                .filter(Boolean)
                .join(" | ")}
            </p>
            <h1 className="profile-banner-name">{player.name}</h1>
            {player.publicStatus && (
              <span className={`pill ${player.publicStatus === "Trialist" ? "pill-trial" : "pill-open"}`}>{player.publicStatus}</span>
            )}
          </div>
        </div>
      </div>

      <div className="profile-stat-bar">
        <div className="profile-stat">
          <span className="l">Position</span>
          <span className="v">{player.positionLabel ?? "—"}</span>
        </div>
        <div className="profile-stat">
          <span className="l">Team</span>
          <span className="v">{player.team ?? "—"}</span>
        </div>
        <div className="profile-stat">
          <span className="l">Age group</span>
          <span className="v">{player.ageGroup ?? "—"}</span>
        </div>
        <div className="profile-stat">
          <span className="l">Status</span>
          <span className="v">{player.publicStatus ?? "—"}</span>
        </div>
      </div>

      {player.bio && (
        <section style={{ paddingTop: 20 }}>
          <div className="wrap">
            <div className="card">
              <p className="card-label">About</p>
              <p>{player.bio}</p>
            </div>
          </div>
        </section>
      )}

      {player.highlights.length > 0 && (
        <section style={{ padding: "20px 0 var(--section-y)" }}>
          <div className="wrap">
            <div className="card">
              <p className="card-label">Highlights</p>
              <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {player.highlights.map((h) => (
                  <li key={h.id}>
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        border: "var(--border-hairline)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 14px",
                        fontSize: "var(--type-small)",
                        fontWeight: 500,
                        color: "var(--text-1)",
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, flex: "none", color: "var(--accent)" }} aria-hidden="true">
                        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
                      </svg>
                      {h.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {!player.bio && player.highlights.length === 0 && <div style={{ paddingBottom: "var(--section-y)" }} />}
    </main>
  );
}
