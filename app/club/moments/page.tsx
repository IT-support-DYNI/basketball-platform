import type { Metadata } from "next";

import ClubImg from "@/app/club/_components/ClubImg";
import { CLUB_PHOTOS, photoSrc } from "@/lib/club-photos";

export const metadata: Metadata = {
  title: "Moments",
  description: "Photos from DYNI Blazers training sessions — drills, scrimmages and the people who make the club.",
};

/** Every club photo (lib/club-photos.ts). Portrait shots take a tall tile so
 *  the grid's short rows don't crop faces; every few landscape shots get a
 *  wide tile for rhythm. Each tile opens the full-size image. */
export default function PublicMomentsPage() {
  let landscapeCount = 0;
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
          <div className="gal-grid">
            {CLUB_PHOTOS.map((p) => {
              const portrait = p.height > p.width;
              const wide = !portrait && landscapeCount++ % 3 === 0;
              return (
                <figure className={`tile${portrait ? " tall" : ""}${wide ? " wide" : ""}`} key={p.slug}>
                  <a className="tile-link" href={photoSrc(p.slug, 1600)} target="_blank" rel="noopener">
                    <span className="photo has-img">
                      <ClubImg
                        slug={p.slug}
                        sizes={wide ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 50vw, 25vw"}
                      />
                    </span>
                    <span className="sr-only"> (opens full size in a new tab)</span>
                  </a>
                  <figcaption>{p.caption}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
