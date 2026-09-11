"use client";

import { useState } from "react";

export type StoryPanel = {
  label: string;
  disabled?: boolean;
  content: React.ReactNode;
};

/** Tabbed "why we exist / about the club / our culture" section on the home
 *  page — one panel visible at a time, same real copy that used to sit in
 *  three separate blocks. A disabled tab (no `content` worth showing yet)
 *  stays clickable-looking but inert rather than silently vanishing. */
export default function StoryTabs({ panels }: { panels: StoryPanel[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="story-tabs" role="tablist" aria-label="About the club">
        {panels.map((p, i) => (
          <button
            key={p.label}
            type="button"
            role="tab"
            className="story-tab"
            aria-selected={i === active}
            disabled={p.disabled}
            onClick={() => setActive(i)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="story-panel" role="tabpanel">
        {panels[active].content}
      </div>
    </div>
  );
}
