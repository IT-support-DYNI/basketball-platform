import PageHeader from "@/components/ui/PageHeader";
import SecuritySettings from "@/app/settings/security/_components/SecuritySettings";

export const metadata = { title: "Security" };

export default function SecuritySettingsPage() {
  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Settings" title="Security" lead="Two-factor authentication and the devices signed in to your account." />
      <SecuritySettings />
    </main>
  );
}
