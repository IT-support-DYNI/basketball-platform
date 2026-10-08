/**
 * The club's public photos (public/photos/club/). Each exists at two sizes —
 * `<slug>-1600.jpg` and `<slug>-800.jpg` — exported with every metadata block
 * stripped (the phone shots carried GPS coordinates) and the orientation
 * baked in. Media consent for everyone pictured was confirmed by the club
 * before these were added (Privacy Policy §8); if someone withdraws consent,
 * delete their photo's two files and its entry here.
 *
 * `width`/`height` are the 1600 version's, used for the intrinsic aspect
 * ratio so the page doesn't shift while images load.
 */

export type ClubPhoto = {
  slug: string;
  /** Describes what's visible — never names anyone. */
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export const CLUB_PHOTOS = [
  { slug: "warm-up-line", alt: "Players lined up along the sports hall wall for a warm-up drill", caption: "Warm-up line", width: 1600, height: 1067 },
  { slug: "players-and-staff", alt: "Players and staff talking between drills on the court", caption: "Between drills", width: 1600, height: 1067 },
  { slug: "coach-instructions", alt: "A coach explaining a drill to a group of players", caption: "Coach's instructions", width: 1600, height: 1067 },
  { slug: "dribble-past-defender", alt: "A player dribbling at a defender in a training scrimmage", caption: "Taking on the defender", width: 1067, height: 1600 },
  { slug: "contested-shot", alt: "A player rising for a shot under the basket while a defender contests", caption: "Contesting the shot", width: 1067, height: 1600 },
  { slug: "scrimmage-under-basket", alt: "Players battling for position under the basket during a scrimmage", caption: "Scrimmage", width: 1600, height: 1067 },
  { slug: "smiling-on-the-ball", alt: "A smiling player bringing the ball up the court", caption: "On the ball", width: 1067, height: 1600 },
  { slug: "one-on-one", alt: "A player driving low past a defender in a one-on-one drill", caption: "One-on-one", width: 1600, height: 1067 },
  { slug: "squad-with-balls", alt: "A group of players holding basketballs, listening between drills", caption: "The squad", width: 1600, height: 1067 },
  { slug: "defensive-stance", alt: "A defender in a low stance guarding a player with the ball", caption: "Defence", width: 1067, height: 1600 },
  { slug: "block-attempt", alt: "Two players going up at the rim, one attempting a block", caption: "At the rim", width: 1067, height: 1600 },
  { slug: "drive-to-the-rim", alt: "A player driving towards the basket with the ball in both hands", caption: "Drive to the rim", width: 1600, height: 1067 },
  { slug: "nothing-but-net", alt: "A basketball dropping through the hoop", caption: "Nothing but net", width: 1600, height: 661 },
  { slug: "full-court-press", alt: "A player driving past a defender with the ball", caption: "Driving past the defender", width: 1600, height: 1424 },
  { slug: "eyes-up", alt: "A player in a navy shirt looking up the court with the ball", caption: "Eyes up", width: 1205, height: 1600 },
  { slug: "protect-the-ball", alt: "A player protecting the ball from a defender", caption: "Protect the ball", width: 1205, height: 1600 },
  { slug: "three-on-the-wing", alt: "Three players working the ball on the wing under the basket", caption: "Working the wing", width: 1205, height: 1600 },
  { slug: "crossover", alt: "A player crossing over as a defender closes in", caption: "Crossover", width: 1205, height: 1600 },
  { slug: "loose-ball", alt: "Players reacting to a loose ball in a scrimmage", caption: "Loose ball", width: 1205, height: 1600 },
  { slug: "attacking-the-gap", alt: "A player in green attacking the gap with the ball", caption: "Attacking the gap", width: 1205, height: 1600 },
  { slug: "help-defence", alt: "Defenders collapsing on a player driving with the ball", caption: "Help defence", width: 1205, height: 1600 },
  { slug: "layup", alt: "A player rising for a layup at the basket", caption: "Layup", width: 1205, height: 1600 },
  { slug: "shot-from-range", alt: "A player releasing a shot over a defender", caption: "Shot from range", width: 1205, height: 1600 },
  { slug: "pass-in-traffic", alt: "A player catching a pass in traffic", caption: "Pass in traffic", width: 1205, height: 1600 },
] as const satisfies readonly ClubPhoto[];

export type ClubPhotoSlug = (typeof CLUB_PHOTOS)[number]["slug"];

export function clubPhoto(slug: ClubPhotoSlug): ClubPhoto {
  return CLUB_PHOTOS.find((p) => p.slug === slug)!;
}

export const photoSrc = (slug: string, size: 800 | 1600) => `/photos/club/${slug}-${size}.jpg`;
