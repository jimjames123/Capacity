import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import type { OrgReport } from "../../lib/types";

export default function OrgReports() {
  const [data, setData] = useState<OrgReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<OrgReport>("/organization/reports")
      .then(setData)
      .catch(() => setError("Could not load reports"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  const professions = Object.entries(data.byProfession).sort((a, b) => b[1] - a[1]);
  const maxProf = Math.max(1, ...professions.map(([, n]) => n));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Reports</h1>
        <p className="mt-2 text-muted">A snapshot of your team and training activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Staff" value={data.staffTotal} />
        <Tile label="Bids received" value={data.bidsReceived} />
        <Tile label="Open tenders" value={data.tendersByStatus.OPEN} />
        <Tile label="Awarded" value={data.tendersByStatus.AWARDED} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Staff by profession</h2>
          {professions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No staff on the register yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {professions.map(([prof, n]) => (
                <li key={prof}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink">{prof}</span>
                    <span className="text-muted">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EDF1F1]">
                    <div className="h-full rounded-full bg-teal" style={{ width: `${(n / maxProf) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Tenders by status</h2>
          <ul className="mt-4 space-y-3">
            {([["OPEN", "Open", "text-green"], ["AWARDED", "Awarded", "text-ink"], ["CLOSED", "Closed", "text-rust"]] as const).map(([key, label, cls]) => (
              <li key={key} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                <span className="text-sm text-muted">{label}</span>
                <span className={`font-serif text-lg font-bold ${cls}`}>{data.tendersByStatus[key]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="label-caps">{label}</div>
      <div className="mt-2 font-serif text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
