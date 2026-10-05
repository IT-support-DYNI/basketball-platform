import { clubPhoto, photoSrc, type ClubPhotoSlug } from "@/lib/club-photos";

/** One club photo inside a `.photo.has-img` frame (landing.css sizes the
 *  frame and `object-fit: cover`s the image). Serves the 800px file to small
 *  slots and the 1600px one to wide/retina ones via srcset. Lazy by default;
 *  pass `priority` for the first thing above the fold. */
export default function ClubImg({
  slug,
  sizes,
  priority = false,
  position,
}: {
  slug: ClubPhotoSlug;
  /** The rendered width, for srcset selection — e.g. "(max-width: 760px) 50vw, 25vw". */
  sizes: string;
  priority?: boolean;
  /** CSS object-position, to keep faces in frame when the slot crops. */
  position?: string;
}) {
  const p = clubPhoto(slug);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static files; no optimiser needed
    <img
      src={photoSrc(p.slug, 800)}
      srcSet={`${photoSrc(p.slug, 800)} 800w, ${photoSrc(p.slug, 1600)} 1600w`}
      sizes={sizes}
      alt={p.alt}
      width={p.width}
      height={p.height}
      loading={priority ? "eager" : "lazy"}
      // React 18 doesn't know the camelCase prop yet; the HTML attribute is lowercase.
      {...(priority ? { fetchpriority: "high" } : {})}
      decoding="async"
      style={position ? { objectPosition: position } : undefined}
    />
  );
}
