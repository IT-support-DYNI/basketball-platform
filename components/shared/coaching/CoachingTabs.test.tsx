import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";

let path = "/coach/drills/4";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

import CoachingTabs from "./CoachingTabs";

describe("CoachingTabs", () => {
  it("marks the section you're in as the current page", () => {
    render(<CoachingTabs />);
    expect(screen.getByRole("link", { name: "Drills" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Session plans" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Plays" })).toHaveAttribute("href", "/coach/plays");
  });

  it("is a labelled navigation landmark with no axe violations", async () => {
    path = "/coach/training/plans";
    const { container } = render(<CoachingTabs />);
    expect(screen.getByRole("navigation", { name: "Coaching" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
