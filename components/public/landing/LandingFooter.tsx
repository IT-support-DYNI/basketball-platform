import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/club", label: "Home" },
  { href: "/club/roster", label: "Players" },
  { href: "/club/coaches", label: "Coaches" },
  { href: "/club/moments", label: "Moments" },
  { href: "/club/news", label: "News" },
  { href: "/club/about", label: "About" },
  { href: "/club#safeguarding", label: "Safeguarding" },
  { href: "/club#cost", label: "Costs" },
];

/** Shared across every /club/* page (rendered from app/club/layout.tsx) —
 *  the safeguarding/cost links point back at the home page's own sections
 *  since that content only lives there. */
export default function LandingFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-in">
          <div>
            <Link className="brand" href="/club">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/dyni-blazers-crest.png" alt="DYNI Blazers" />
              <span className="wordmark">
                DYNI <span>Blazers</span>
              </span>
            </Link>
            <p>A basketball club run by Diverse Youth Northern Ireland. Junior to senior, one club.</p>
          </div>
          <nav aria-label="Footer">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.label} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="foot-base">
          <span>© 2026 Diverse Youth Northern Ireland</span>
          <nav className="foot-legal" aria-label="Legal">
            <Link href="/club/terms">Terms &amp; Conditions</Link>
            <Link href="/club/privacy">Privacy Policy</Link>
          </nav>
          <span>Belfast, Northern Ireland</span>
        </div>
      </div>
    </footer>
  );
}
