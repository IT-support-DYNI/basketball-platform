import type { NavIconName } from "@/lib/navigation";

/**
 * The small line-icon set used by the mobile bottom bar and the "More" drawer.
 * Stroke-based, 24-grid, inherits `currentColor` — kept inline so the nav has no
 * icon-font or sprite dependency.
 */
const PATHS: Record<NavIconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
  team: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v4m8-4v4" />
    </>
  ),
  attendance: <path d="M4 12.5 9 17.5 20 6.5M4 19h16" />,
  chart: <path d="M4 20V4m0 16h16M8 16v-4m4 4V8m4 8v-6" />,
  feedback: <path d="M5 5h14v10H9l-4 4V5Z" />,
  chat: <path d="M4 4h12v9H8l-4 3.5V4Zm6 12.5V17a3 3 0 0 0 3 3h4l3 2.5V11a3 3 0 0 0-3-3h-.5" />,
  video: (
    <>
      <rect x="3.5" y="6" width="12" height="12" rx="2" />
      <path d="M15.5 10.5 21 7v10l-5.5-3.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 6.2A3 3 0 0 1 16 12m5 7c0-2.4-1.6-4.2-3.8-4.8" />
    </>
  ),
  whistle: (
    <>
      <path d="M11 9h9l-2.5 5.5A6 6 0 1 1 11 9Z" />
      <path d="M11 6.5V4m3 3 1.5-2" />
    </>
  ),
  megaphone: <path d="M4 10v4h3l9 5V5l-9 5H4Zm13 .5a3 3 0 0 1 0 3" />,
  season: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2m0 13v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M3.5 12h2m13 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-2.5Z" />,
  inbox: <path d="M4 13h4l1.5 3h5L21 13m-17 0 3-8h10l3 8m-16 0v6h16v-6" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </>
  ),
};

export default function NavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
