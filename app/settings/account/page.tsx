import PageHeader from "@/components/ui/PageHeader";
import AccountData from "@/app/settings/account/_components/AccountData";

export const metadata = { title: "Your data" };

export default function AccountDataPage() {
  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Settings"
        title="Your data"
        lead="Download everything the club holds about you, or close your account."
      />
      <AccountData />
    </main>
  );
}
