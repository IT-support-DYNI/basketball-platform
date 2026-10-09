import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import PlayForm from "@/app/coach/plays/_components/PlayForm";

export const metadata = { title: "New play" };

export default function NewPlayPage() {
  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Coach · Plays" title="New play" lead="Save it first, then choose which teams get it." />
      <Card as="section">
        <PlayForm />
      </Card>
    </main>
  );
}
