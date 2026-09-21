"use client";

import { useCallback, useEffect, useState } from "react";

import Card from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { applyHighContrast, applyFontSize, type FontSize } from "@/components/theme/displayPrefs";

type Prefs = { highContrast: boolean; fontSizePreference: FontSize };

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; description: string }[] = [
  { value: "SMALL", label: "Small", description: "More fits on screen" },
  { value: "MEDIUM", label: "Default", description: "The standard size" },
  { value: "LARGE", label: "Large", description: "Easier to read" },
  { value: "XLARGE", label: "Extra large", description: "Largest text throughout the app" },
];

export default function DisplaySettings() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/account/display-preferences");
    if (res.ok) setPrefs(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(next: Partial<Prefs>) {
    if (!prefs) return;
    const updated = { ...prefs, ...next };
    setPrefs(updated);
    if (next.highContrast !== undefined) applyHighContrast(next.highContrast);
    if (next.fontSizePreference !== undefined) applyFontSize(next.fontSizePreference);

    setSaving(true);
    try {
      const res = await fetch("/api/v1/account/display-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ title: body.error ?? "Couldn't save that.", tone: "danger" });
      }
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return <LoadingState rows={2} label="Loading display settings" />;

  return (
    <Card as="section">
      <div className="flex flex-col gap-6">
        <RadioGroup
          label="Text size"
          value={prefs.fontSizePreference}
          onValueChange={(v) => save({ fontSizePreference: v as FontSize })}
          options={FONT_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description }))}
        />

        <div className="border-t border-line pt-6">
          <Checkbox
            label="High contrast"
            description="A solid black-and-white high-contrast theme (like VS Code's) instead of the usual palette — combines with your light/dark choice above."
            checked={prefs.highContrast}
            onCheckedChange={(checked) => save({ highContrast: checked })}
          />
        </div>

        <p className="text-xs text-ink-faint">
          {saving ? "Saving…" : "Saved to your account — these follow you to any device you sign in on."}
        </p>
      </div>
    </Card>
  );
}
