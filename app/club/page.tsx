import type { Metadata } from "next";
import Link from "next/link";

import "@/styles/dyni-landing/tokens.css";
import "@/styles/dyni-landing/landing.css";

import { getClubStats, getPublicPlayers, getPublicCoaches } from "@/lib/public-site";
import ScrollProgressBar from "@/components/public/landing/ScrollProgressBar";
import LandingNav from "@/components/public/landing/LandingNav";
import HeroCarousel, { type HeroSlide } from "@/components/public/landing/HeroCarousel";
import Ticker from "@/components/public/landing/Ticker";
import StatCount from "@/components/public/landing/StatCount";
import TiltCard from "@/components/public/landing/TiltCard";
import RegisterInterestForm from "@/components/public/landing/RegisterInterestForm";
import RevealBlock from "@/components/public/landing/RevealBlock";

// Bypasses the root layout's "%s · DYNI Blazers" template for a one-off
// exact title, rather than doubling up ("… · DYNI Blazers · DYNI Blazers").
export const metadata: Metadata = {
  title: { absolute: "DYNI Blazers — A club, not an academy" },
  description: "A community basketball club run by Diverse Youth Northern Ireland. Junior to senior, one club.",
};

const HERO_SLIDES: HeroSlide[] = [
  {
    label: "Hero 01 — Culture",
    eyebrow: "A club, not an academy",
    words: ["Everyone", "develops", "here."],
    lead: "Juniors through seniors on the same floor, to the same standards. No trial-and-cut, no season on the bench — if you turn up, you get coached.",
    tabTitle: "The culture",
    ctas: [
      { label: "Start registration", href: "/register", primary: true },
      { label: "What we're about", href: "#about" },
    ],
  },
  {
    label: "Hero 02 — Teams",
    eyebrow: "Junior to senior · one club",
    words: ["Every", "squad,", "one", "floor."],
    lead: "From our youngest juniors to the senior squad, everyone trains out of the same hall, with the same coaching staff and the same expectations.",
    tabTitle: "Every squad",
    ctas: [
      { label: "Meet the players", href: "#roster" },
      { label: "Full roster", href: "/club/roster" },
    ],
  },
  {
    label: "Hero 03 — Trials",
    eyebrow: "Open trials",
    words: ["Come", "down", "and", "play."],
    lead: "Bring trainers and a water bottle — we'll sort the rest. Cost is never the reason someone can't play; see our cost breakdown below.",
    tabTitle: "Open trials",
    ctas: [
      { label: "Register for trials", href: "/register", primary: true },
      { label: "What it costs", href: "#cost" },
    ],
  },
  {
    label: "Hero 04 — Coaches",
    eyebrow: "Our coaches",
    words: ["Real", "coaching,", "every", "session."],
    lead: "Every coach on our roster is here every week, not just for match day — meet the people who'll actually be running your sessions.",
    tabTitle: "Our coaches",
    ctas: [
      { label: "Meet the coaches", href: "#coaches" },
      { label: "Safeguarding", href: "#safeguarding" },
    ],
  },
];

const TICKER_FACTS = [
  "A club, not an academy",
  "Everyone develops",
  "Qualified coaches, every session",
  "Nobody sits on the bench for a season",
  "Cost is never the reason",
  "Junior to senior, one club",
];

const CULTURE_POINTS = [
  {
    n: "01",
    title: "Everyone develops",
    body: "Every player gets a development plan and feedback they can actually act on — not a score in a coach's notebook.",
  },
  {
    n: "02",
    title: "No pressure",
    body: "We play to win, but nobody's future is decided young. Miss a week for exams or work and your place is still here.",
  },
  {
    n: "03",
    title: "Nobody sits on the bench for a season",
    body: "If you're in a squad, you play. Rotation is planned in the session, not decided by who shouts loudest.",
  },
];

const MOMENTS = [
  { caption: "Match day", big: true },
  { caption: "Training session" },
  { caption: "Juniors on the floor" },
  { caption: "Free-throw drill" },
  { caption: "Open trials" },
  { caption: "Senior squad" },
  { caption: "Club moment", wide: true },
];

const SAFE_CARDS = [
  { title: "Vetted staff", body: "AccessNI checks and safeguarding training for every coach and volunteer on the floor." },
  { title: "Guardian consent", body: "Photos, profiles and video are opt-in per player, and reversible at any time." },
  {
    title: "A named lead, on request",
    body: "The club has a designated safeguarding lead — ask at registration or via the club's contact details for who to reach and how.",
  },
  { title: "Open sessions", body: "Parents and guardians are welcome to stay and watch any session, any age group." },
];

const COST_ROWS = [
  { label: "Trials & taster sessions", value: "Free" },
  { label: "Juniors, per term", value: "£40" },
  { label: "Academy, per term", value: "£55" },
  { label: "Senior squads, per term", value: "£70" },
  { label: "Club kit", value: "Loaned" },
  { label: "Hardship fund", value: "Ask us" },
];

const FOOTER_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#roster", label: "Players" },
  { href: "#coaches", label: "Coaches" },
  { href: "#moments", label: "Moments" },
  { href: "#news", label: "News" },
  { href: "#about", label: "About" },
  { href: "#safeguarding", label: "Safeguarding" },
  { href: "#cost", label: "Costs" },
];

export default async function ClubLandingPage() {
  const [stats, players, coaches] = await Promise.all([getClubStats(), getPublicPlayers(6), getPublicCoaches(3)]);

  const statTiles = [
    { value: stats.teams, label: "Teams" },
    { value: stats.players, label: "Players" },
    { value: stats.coaches, label: "Coaches" },
    { value: stats.sessionsThisWeek, label: "Sessions this week" },
  ];

  return (
    <div className="dyni-landing">
      <ScrollProgressBar />

      <LandingNav />

      <main id="top">
        <HeroCarousel slides={HERO_SLIDES} />

        <Ticker facts={TICKER_FACTS} />

        <section className="stats" aria-label="Club by the numbers">
          <div className="wrap">
            <div className="stat-grid">
              {statTiles.map((s, i) => (
                <RevealBlock key={s.label} delayMs={i * 90} className="stat">
                  <div className="photo"></div>
                  <StatCount value={s.value} />
                  <p className="stat-l">{s.label}</p>
                </RevealBlock>
              ))}
            </div>
          </div>
        </section>

        <section className="culture" id="about">
          <div className="wrap culture-in">
            <RevealBlock className="photo"></RevealBlock>
            <RevealBlock delayMs={80}>
              <p className="eyebrow">Our culture</p>
              <h2>A club, not an academy</h2>
              <p className="lead" style={{ marginTop: 14 }}>
                We&apos;re run by Diverse Youth Northern Ireland, and we&apos;re a community club first. That decides
                everything else: who gets in, who gets minutes, and what a session looks like.
              </p>
              <ul className="culture-list">
                {CULTURE_POINTS.map((c) => (
                  <li key={c.n}>
                    <em>{c.n}</em>
                    <div>
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </RevealBlock>
          </div>
        </section>

        <section className="teams" id="roster">
          <div className="wrap">
            <RevealBlock className="head">
              <div>
                <p className="eyebrow">Meet the players</p>
                <h2>The squad, on and off the court</h2>
                <p className="lead">Junior players appear here only once a guardian and the club have both approved it.</p>
              </div>
              <Link className="btn btn-secondary btn-sm" href="/club/roster">
                Full roster
              </Link>
            </RevealBlock>
            {players.length === 0 ? (
              <p className="lead">No player profiles are public yet — check back soon.</p>
            ) : (
              <div className="team-grid">
                {players.map((p, i) => (
                  <TiltCard key={p.id} className="team" href={`/club/players/${p.id}`} delayMs={i * 70}>
                    <div className={`photo${p.photoUrl ? " has-img" : ""}`}>
                      {p.photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photoUrl} alt="" />
                      )}
                    </div>
                    {p.jerseyNumber != null && (
                      <span className="team-jersey" aria-hidden="true">
                        {p.jerseyNumber}
                      </span>
                    )}
                    <div className="team-top">
                      <span className={`team-code${p.publicStatus === "Trialist" ? " trial" : ""}`}>
                        {p.jerseyNumber != null ? `#${p.jerseyNumber}` : "—"}
                      </span>
                      {p.publicStatus && (
                        <span className={`pill ${p.publicStatus === "Trialist" ? "pill-trial" : "pill-open"}`}>
                          {p.publicStatus}
                        </span>
                      )}
                    </div>
                    <div className="team-body">
                      <h3>{p.name}</h3>
                      <div className="team-meta">
                        {p.positionLabel && <span>{p.positionLabel}</span>}
                        {p.team && <span>{p.team}</span>}
                      </div>
                    </div>
                  </TiltCard>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="coaches" id="coaches">
          <div className="wrap">
            <RevealBlock className="head">
              <div>
                <p className="eyebrow">Coaching staff</p>
                <h2>Qualified coaches, every session</h2>
              </div>
              <Link className="btn btn-secondary btn-sm" href="/club/coaches">
                All staff
              </Link>
            </RevealBlock>
            {coaches.length === 0 ? (
              <p className="lead">No coach profiles are public yet — check back soon.</p>
            ) : (
              <div className="coach-grid">
                {coaches.map((c, i) => (
                  <TiltCard key={c.id} className="coach" href={`/club/coaches/${c.id}`} delayMs={i * 90}>
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

        <section className="gallery" id="moments">
          <div className="wrap">
            <RevealBlock className="head">
              <div>
                <p className="eyebrow">Blazers moments</p>
                <h2>The team, on and off the court</h2>
              </div>
            </RevealBlock>
            <div className="gal-grid">
              {MOMENTS.map((m, i) => (
                <RevealBlock
                  key={m.caption}
                  as="figure"
                  delayMs={i * 60}
                  className={`tile${m.big ? " big" : ""}${m.wide ? " wide" : ""}`}
                >
                  <div className="photo"></div>
                  <figcaption>{m.caption}</figcaption>
                </RevealBlock>
              ))}
            </div>
          </div>
        </section>

        <section className="news" id="news">
          <div className="wrap">
            <RevealBlock className="head">
              <div>
                <p className="eyebrow">Club news</p>
                <h2>Nothing posted yet</h2>
              </div>
            </RevealBlock>
            <RevealBlock className="news-mod">
              <div className="news-panel">
                <p className="eyebrow">Club news</p>
                <p style={{ fontSize: "var(--type-small)", color: "rgba(246,233,214,.75)" }}>
                  The club hasn&apos;t shared any news or stories here yet. Check back soon.
                </p>
              </div>
            </RevealBlock>
          </div>
        </section>

        <section className="safe" id="safeguarding">
          <div className="wrap safe-in">
            <RevealBlock>
              <p className="eyebrow">Safeguarding</p>
              <h2>Nothing about a young player is public by default</h2>
              <p>
                Every coach is vetted and every junior profile is guardian-approved before it appears anywhere. If
                you want something taken down, one message to the club is enough.
              </p>
            </RevealBlock>
            <RevealBlock delayMs={80} className="safe-grid">
              {SAFE_CARDS.map((c) => (
                <div className="safe-card" key={c.title}>
                  <strong>{c.title}</strong>
                  <p>{c.body}</p>
                </div>
              ))}
            </RevealBlock>
          </div>
        </section>

        <section className="cost" id="cost">
          <div className="wrap cost-in">
            <RevealBlock>
              <p className="eyebrow">Cost transparency</p>
              <h2>
                Cost is never <em>the reason</em>
              </h2>
              <p className="lead" style={{ marginTop: 14 }}>
                Here&apos;s the whole picture, up front. If any of it is a problem, tell us — the hardship fund
                exists for exactly that and no one needs to explain themselves twice.
              </p>
              <p className="cost-note">Illustrative figures for the current term. Confirm with the club before registering.</p>
            </RevealBlock>
            <RevealBlock delayMs={80} className="cost-rows">
              {COST_ROWS.map((r) => (
                <div className="cost-row" key={r.label}>
                  <strong>{r.label}</strong>
                  <span>{r.value}</span>
                </div>
              ))}
            </RevealBlock>
          </div>
        </section>

        <section className="reg" id="register">
          <div className="wrap reg-in">
            <RevealBlock>
              <p className="live">
                <span className="dot-live" aria-hidden="true"></span>Open trials every term
              </p>
              <h2 style={{ marginTop: 16 }}>Come down, bring trainers, see if you like us</h2>
              <p className="note">
                Leave a name and a guardian email and we&apos;ll take you straight to registration for the right age
                group. Every application is reviewed by the club before full access is granted.
              </p>
            </RevealBlock>
            <RegisterInterestForm />
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-in">
            <div>
              <a className="brand" href="#top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/dyni-blazers-crest.png" alt="DYNI Blazers" />
                <span className="wordmark">
                  DYNI <span>Blazers</span>
                </span>
              </a>
              <p>A basketball club run by Diverse Youth Northern Ireland. Junior to senior, one club.</p>
            </div>
            <nav aria-label="Footer">
              {FOOTER_LINKS.map((l) => (
                <a key={l.label} href={l.href}>
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="foot-base">
            <span>© 2026 Diverse Youth Northern Ireland</span>
            <span>Belfast, Northern Ireland</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
