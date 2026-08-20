import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { EmptyState } from "../components/ui";
import { EntryRow } from "./Dashboard";
import { pointsLabel } from "../lib/format";
import type { CycleGroup } from "../lib/types";

export default function History() {
  const [cycles, setCycles] = useState<CycleGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ cycles: CycleGroup[] }>("/cpd/entries")
      .then((r) => setCycles(r.cycles))
      .catch(() => setError("Could not load your history"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!cycles) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Activity history</h1>
        <p className="mt-2 text-muted">
          Every CPD entry you have logged, with its verification status.
        </p>
      </div>

      {cycles.map((cycle) => (
        <div key={cycle.cycleId} className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="label-caps">
                {cycle.isCurrent ? "Current cycle" : "Past cycle"} · {cycle.label}
              </div>
              <div className="mt-1 font-serif text-lg font-semibold text-ink">
                {round(cycle.earnedPoints)} / {cycle.requiredPoints} verified points
                {!cycle.isCurrent && cycle.earnedPoints >= cycle.requiredPoints
                  ? " · Completed"
                  : ""}
              </div>
            </div>
            {!cycle.isCurrent && cycle.earnedPoints >= cycle.requiredPoints && (
              <Link
                to="/app/record"
                className="text-sm font-semibold text-teal hover:underline"
              >
                View {new Date(cycle.startDate).getFullYear()} certificate →
              </Link>
            )}
          </div>

          {cycle.entries.length === 0 ? (
            <EmptyState
              title="No entries in this cycle"
              hint="Activities you log will show up here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {cycle.entries.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4 text-[13px] text-muted">
            <span>{cycle.counts.VERIFIED} verified</span>
            <span>{cycle.counts.PENDING} pending</span>
            <span>{cycle.counts.NEEDS_PROOF} needs proof</span>
            <span className="ml-auto font-semibold text-ink">
              {pointsLabel(cycle.earnedPoints)} counted
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}
