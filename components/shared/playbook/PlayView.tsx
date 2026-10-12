import Card from "@/components/ui/Card";
import { diagramHasContent, type CourtDiagram } from "@/lib/training";
import { PLAY_TYPE_LABEL, type PlayType } from "@/lib/playbook";
import CourtDiagramView from "@/app/coach/drills/_components/CourtDiagram";

export type PlayViewData = {
  name: string;
  type: string;
  notes: string | null;
  courtDiagram: CourtDiagram | null;
  teams: string[];
  updatedAt: Date | string;
};

/** Read-only play: the same view for players, guardians and coaches. */
export default function PlayView({ play }: { play: PlayViewData }) {
  return (
    <Card as="section">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        {PLAY_TYPE_LABEL[play.type as PlayType] ?? play.type}
        {play.teams.length > 0 ? ` · ${play.teams.join(", ")}` : ""}
      </p>

      {diagramHasContent(play.courtDiagram) ? (
        <div className="mt-3">
          <CourtDiagramView value={play.courtDiagram} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-dim">No diagram drawn for this play yet.</p>
      )}

      {play.notes && (
        <div className="mt-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Notes</h2>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">{play.notes}</p>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-faint">
        Last updated {new Date(play.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </Card>
  );
}
