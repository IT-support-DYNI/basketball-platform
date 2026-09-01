import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import DrillForm from "@/components/training/DrillForm";

export const metadata = { title: "New drill" };

export default function NewDrillPage() {
  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Coach · Drill library" title="New drill" />
      <Card as="section">
        <DrillForm />
      </Card>
    </main>
  );
}
