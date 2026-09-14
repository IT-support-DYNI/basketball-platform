/** The accent-coloured fact ribbon under the hero. Pure CSS animation
 *  (`.ticker-track` + `dyni-marquee` keyframes) — content is duplicated once
 *  in the markup for a seamless -50% loop, so no client JS is needed at all. */
export default function Ticker({ facts }: { facts: string[] }) {
  const row = (dup: boolean) => (
    <span>
      {facts.map((fact) => (
        <span key={`${dup ? "b" : "a"}-${fact}`} style={{ display: "contents" }}>
          {fact}
          <b aria-hidden="true"></b>
        </span>
      ))}
    </span>
  );

  return (
    <div className="ticker" aria-label="Club facts">
      <div className="ticker-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
