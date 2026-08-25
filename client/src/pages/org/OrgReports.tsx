import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import type { OrgOverview } from "../../lib/types";

const DEPT_BAR = ["bg-ink", "bg-teal", "bg-green", "bg-amber-strong", "bg-rust"];

export default function OrgReports() {
  const [data, setData] = useState<OrgOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<OrgOverview>("/organization/overview").then(setData).catch(() => setError("Could not load reports"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  const maxBudget = Math.max(1, ...data.byDepartment.map((d) => d.budget));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Reports &amp; overview</h1>
        <p className="mt-2 text-muted">Training plan, budget and participation across your organization.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Planned sessions" value={String(data.totalSessions)} dark />
        <Tile label="Staff enrolled" value={String(data.totalAllocated)} />
        <Tile label="Completion rate" value={`${data.completionRate}%`} />
        <Tile label="Total budget" value={data.totalBudget} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Training plan by department</h2>
          {data.byDepartment.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No sessions planned yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.byDepartment.map((d, i) => (
                <li key={d.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{d.name}</span>
                    <span className="text-muted">{d.sessions} session{d.sessions === 1 ? "" : "s"} · {d.staff} staff</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EDF1F1]">
                    <div className={`h-full rounded-full ${DEPT_BAR[i % DEPT_BAR.length]}`} style={{ width: `${(d.budget / maxBudget) * 100}%` }} />
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-muted">UGX {d.budgetShort}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Budget by department</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="label-caps border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold">Department</th>
                  <th className="pb-2 text-right font-semibold">Budget (UGX)</th>
                  <th className="pb-2 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.byDepartment.map((d) => (
                  <tr key={d.name} className="border-b border-line">
                    <td className="py-2.5 text-ink">{d.name}</td>
                    <td className="py-2.5 text-right font-mono text-ink">{d.budgetShort}</td>
                    <td className="py-2.5 text-right text-muted">{d.share}%</td>
                  </tr>
                ))}
                <tr className="bg-[#F3F6F6] font-semibold">
                  <td className="py-2.5 text-ink">Total</td>
                  <td className="py-2.5 text-right font-mono text-ink">{data.totalBudget}</td>
                  <td className="py-2.5 text-right text-ink">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Participation status</h2>
          <ul className="mt-4 space-y-3">
            {data.participation.map((p) => (
              <li key={p.label} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                <span className="text-sm text-muted">{p.label}</span>
                <span className="font-serif text-lg font-bold text-ink">{p.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Audit log</h2>
          <p className="mt-1 text-[13px] text-muted">Immutable record of who did what, and when.</p>
          {data.audit.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No activity recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.audit.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3 border-b border-line pb-2.5 last:border-0">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-ink">{a.actor}</span>
                    <span className="text-sm text-muted"> {a.action.toLowerCase()} — </span>
                    <span className="text-sm text-ink">{a.target}</span>
                  </div>
                  <span className="shrink-0 text-[12px] text-faint">{a.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`card p-5 ${dark ? "bg-ink text-white" : ""}`}>
      <div className={`label-caps ${dark ? "text-[#B9C6C6]" : ""}`}>{label}</div>
      <div className={`mt-2 font-serif text-3xl font-bold ${dark ? "text-white" : "text-ink"}`}>{value}</div>
    </div>
  );
}
