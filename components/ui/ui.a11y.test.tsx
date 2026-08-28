import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";

import { Button } from "./Button";
import { TextField } from "./TextField";
import { Select } from "./Select";
import { Checkbox } from "./Checkbox";
import { RadioGroup } from "./RadioGroup";
import Badge from "./Badge";
import Alert from "./Alert";
import { EmptyState, ErrorState, LoadingState } from "./states";
import { ErrorSummary } from "./Field";

/**
 * Automated axe pass on the component library. Catches regressions in labelling,
 * roles and contrast primitives; does not replace a manual screen-reader pass
 * (brief §34 / plan W8).
 */
describe("component library — accessibility", () => {
  const cases: [string, () => ReactElement][] = [
    ["Button", () => <Button>Save and continue</Button>],
    ["TextField", () => <TextField label="Email" hint="We'll only use this to contact you." defaultValue="" />],
    ["TextField with error", () => <TextField label="Jersey number" error="That number is already taken." defaultValue="7" />],
    [
      "Select",
      () => (
        <Select label="Team">
          <option value="">Choose…</option>
          <option value="1">Senior</option>
        </Select>
      ),
    ],
    ["Checkbox", () => <Checkbox label="I agree to the code of conduct" />],
    [
      "RadioGroup",
      () => (
        <RadioGroup
          label="Are you attending?"
          options={[
            { value: "yes", label: "Attending" },
            { value: "no", label: "Not attending" },
            { value: "maybe", label: "Unsure" },
          ]}
        />
      ),
    ],
    ["Badge", () => <Badge tone="warning">Pending</Badge>],
    ["Alert", () => <Alert tone="danger">That didn't work.</Alert>],
    ["EmptyState", () => <EmptyState title="No upcoming events" description="Nothing on the calendar yet." />],
    ["ErrorState", () => <ErrorState onRetry={() => {}} />],
    ["LoadingState", () => <LoadingState />],
    ["ErrorSummary", () => <ErrorSummary errors={[{ id: "email", message: "Enter a valid email address." }]} />],
  ];

  it.each(cases)("%s has no axe violations", async (_name, render_) => {
    const { container } = render(render_());
    expect(await axe(container)).toHaveNoViolations();
  });
});
