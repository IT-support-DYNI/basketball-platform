/**
 * Unlike layout.tsx, Next remounts template.tsx on every navigation — so a
 * mount animation here gives every route a quick fade-and-rise-in for free,
 * with no client-side router-event wiring. NavBar lives in layout.tsx, above
 * this, so it never re-animates or flickers between pages — only the page
 * content does. Off entirely under prefers-reduced-motion (see globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter">{children}</div>;
}
