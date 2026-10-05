import type { Metadata } from "next";

import ClubImg from "@/app/club/_components/ClubImg";
import { CLUB_PHOTOS, photoSrc } from "@/lib/club-photos";

export const metadata: Metadata = {
  title: "Moments",
  description: "Photos from DYNI Blazers training sessions — drills, scrimmages and the people who make the club.",
};

/** Every club photo (lib/club-photos.ts) in a masonry layout: each photo keeps
 *  its own aspect ratio (nothing cropped, no heads cut off) and CSS columns
 *  pack them with no holes. Each tile opens the full-size image. */
export default function PublicMomentsPage() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Blazers moments</p>
          <h1>The team, on and off the court.</h1>
          <p className="lead">From the club&apos;s training sessions — drills, scrimmages and the people on the floor.</p>
        </div>
      </section>
      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          <div className="masonry">
            {CLUB_PHOTOS.map((p) => (
              <figure className="tile" key={p.slug}>
                <a className="tile-link" href={photoSrc(p.slug, 1600)} target="_blank" rel="noopener">
                  <span className="photo has-img">
                    <ClubImg slug={p.slug} sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw" />
                  </span>
                  <span className="sr-only"> (opens full size in a new tab)</span>
                </a>
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
