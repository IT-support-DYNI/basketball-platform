import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/states";
import ReviewSafeguardingReportForm from "@/components/admin/ReviewSafeguardingReportForm";

export default async function AdminSafeguardingPage() {
  const reports = await prisma.safeguardingReport.findMany({
    include: { reviewedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Safeguarding reports"
        lead="Every concern submitted through the club site — reviewed here and nowhere else."
      />

      {reports.length === 0 ? (
        <EmptyState
          title="Nothing reported"
          description="Concerns submitted from the club's safeguarding page will appear here as they come in."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.id}>
              <Card as="article">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-ink">{r.reporterName ?? "Anonymous"}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.reporterEmail && <p className="text-sm text-ink-dim">{r.reporterEmail}</p>}
                    <p className="mt-1 text-sm text-ink-dim">
                      {r.relationship && <span>{r.relationship}</span>}
                      {r.concernAbout && <span>{r.relationship ? " · " : ""}Concerning: {r.concernAbout}</span>}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{r.description}</p>
                    <p className="mt-2 text-xs text-ink-faint">Submitted {new Date(r.createdAt).toLocaleString()}</p>
                    {r.reviewedBy && r.reviewedAt && (
                      <p className="text-xs text-ink-faint">
                        Last reviewed by {r.reviewedBy.name} · {new Date(r.reviewedAt).toLocaleString()}
                      </p>
                    )}
                    {r.reviewNotes && (
                      <p className="mt-2 rounded-control border border-line bg-surface-2 p-3 text-xs text-ink-dim">
                        {r.reviewNotes}
                      </p>
                    )}
                  </div>
                </div>

                <ReviewSafeguardingReportForm reportId={r.id} currentStatus={r.status} currentNotes={r.reviewNotes} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
