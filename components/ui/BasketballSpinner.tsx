/**
 * For the one kind of loading moment `LoadingState`'s content-shaped
 * skeletons deliberately don't cover: a full route change, where nothing
 * about the destination page is known yet, so there's no shape to skeleton.
 * Not a replacement for LoadingState — that's still correct everywhere the
 * content shape IS known (see docs/DESIGN-MIGRATION.md "Definition of done").
 *
 * Static (no bounce) under prefers-reduced-motion, via the plain CSS media
 * query in globals.css — this component doesn't need to know which state
 * it's in.
 */
export function BasketballSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <div className="relative h-10 w-10">
        <svg
          viewBox="0 0 40 40"
          className="animate-ball-bounce absolute inset-0 h-10 w-10"
          aria-hidden="true"
        >
          <circle cx="20" cy="20" r="18" fill="rgb(var(--flame))" />
          <path
            d="M20 2v36M2 20h36M6 8c5 5 5 19 0 24M34 8c-5 5-5 19 0 24"
            fill="none"
            stroke="rgb(var(--ground))"
            strokeWidth="1.6"
          />
        </svg>
      </div>
      <div
        className="animate-ball-shadow h-1.5 w-8 rounded-full bg-black/40"
        aria-hidden="true"
      />
    </div>
  );
}
