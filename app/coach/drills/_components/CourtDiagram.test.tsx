import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, beforeAll } from "vitest";

import type { CourtDiagram as Diagram } from "@/lib/training";
import CourtDiagram from "./CourtDiagram";

// Reduced motion: the viewer jumps between steps instead of animating, so the
// test doesn't depend on animation frames.
beforeAll(() => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes("reduce"),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

const twoSteps: Diagram = {
  markers: [{ id: "p1", kind: "player", x: 0.5, y: 0.6, label: "1" }],
  arrows: [{ id: "a", kind: "move", from: { x: 0.5, y: 0.6 }, to: { x: 0.5, y: 0.2 } }],
  caption: "1 brings it up",
  steps: [{ markers: [{ id: "p1", kind: "player", x: 0.5, y: 0.2, label: "1" }], arrows: [], caption: "1 at the top of the key" }],
};

function Editor({ initial }: { initial: Diagram }) {
  const [d, setD] = useState<Diagram>(initial);
  return (
    <>
      <CourtDiagram value={d} onChange={setD} />
      <output data-testid="steps">{1 + (d.steps?.length ?? 0)}</output>
    </>
  );
}

describe("CourtDiagram steps", () => {
  it("a coach adds a step and edits its caption", () => {
    render(<Editor initial={{ markers: [{ id: "p1", kind: "player", x: 0.5, y: 0.6, label: "1" }], arrows: [] }} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add step" }));
    expect(screen.getByTestId("steps")).toHaveTextContent("2");
    expect(screen.getByRole("button", { name: "Step 2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringMatching(/Step 2 of 2/));
    fireEvent.change(screen.getByLabelText("Step 2 description"), { target: { value: "Drive left" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove step 2" }));
    expect(screen.getByTestId("steps")).toHaveTextContent("1");
  });

  it("a player steps through a play with captions", () => {
    render(<CourtDiagram value={twoSteps} />);
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("1 brings it up")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous step" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("1 at the top of the key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next step" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "▶ Play" })).toBeInTheDocument();
  });

  it("a one-step diagram shows no step controls to players", () => {
    render(<CourtDiagram value={{ markers: twoSteps.markers, arrows: [] }} />);
    expect(screen.queryByRole("group", { name: "Play steps" })).toBeNull();
  });

  it("has no axe violations in either mode", async () => {
    const { container } = render(
      <>
        <CourtDiagram value={twoSteps} />
        <Editor initial={twoSteps} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
