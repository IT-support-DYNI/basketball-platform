import type { Metadata } from "next";

export const metadata: Metadata = { title: "Moments" };

/** No real photo pipeline exists for a gallery yet, so — same principle as
 *  the News empty state — this shows the design's own honest "photo will be
 *  inserted here" placeholder rather than inventing specific past events. */
const MOMENTS = [
  { caption: "Match day" },
  { caption: "Training session" },
  { caption: "Juniors on the floor" },
  { caption: "Free-throw drill" },
  { caption: "Open trials" },
  { caption: "Senior squad" },
  { caption: "Academy session" },
  { caption: "Club social" },
  { caption: "Warm-up" },
];

export default function PublicMomentsPage() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Blazers moments</p>
          <h1>The team, on and off the court.</h1>
          <p className="lead">Photos will appear here as the club adds them.</p>
        </div>
      </section>
      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          <div className="gal-grid">
            {MOMENTS.map((m) => (
              <figure className="tile" key={m.caption}>
                <div className="photo"></div>
                <figcaption>{m.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
