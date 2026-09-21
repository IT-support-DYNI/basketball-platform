import PageHeader from "@/components/ui/PageHeader";
import DisplaySettings from "@/app/settings/display/_components/DisplaySettings";

export const metadata = { title: "Display" };

export default function DisplaySettingsPage() {
  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Settings"
        title="Display & accessibility"
        lead="How the app looks on your account — these follow you to any device you sign in on."
      />
      <DisplaySettings />
    </main>
  );
}
