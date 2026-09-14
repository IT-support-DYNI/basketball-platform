/**
 * An infinite scrolling fact strip — the ticker-band pattern from Pracko/Thuze,
 * pointed at real numbers instead of marketing copy. Content is duplicated
 * once so the loop is seamless; under prefers-reduced-motion the animation
 * stops and the duplicate is hidden via CSS (see globals.css), so it reads as
 * a normal wrapped list of facts instead of a frozen half-scrolled strip.
 * Renders nothing if there's nothing real to say.
 */
export default function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  const row = (dup: boolean) => (
    <div className={dup ? "marquee-dup contents" : "contents"}>
      {items.map((item, i) => (
        <span
          key={`${dup ? "b" : "a"}-${i}`}
          className="flex items-center gap-2 whitespace-nowrap font-mono text-xs uppercase tracking-wider text-ink-dim"
        >
          <span className="h-1 w-1 flex-none rounded-full bg-flame" aria-hidden="true" />
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="relative mt-6 overflow-hidden border-t border-line pt-3"
      style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}
    >
      <div className="animate-marquee flex w-max gap-8">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
