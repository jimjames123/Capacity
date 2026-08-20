import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { EmptyState, ProgressRing, StatusPill } from "../../components/ui";
import { entryTypeLabel, formatDate, pointsLabel } from "../../lib/format";
import type { AdminMemberDetail, CpdEntry } from "../../lib/types";

export default function AdminMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminMemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<AdminMemberDetail>(`/admin/members/${id}`)
      .then(setData)
      .catch(() => setError("Member not found"));
  }, [id]);
  useEffect(load, [load]);

  async function decide(entry: CpdEntry, action: "verify" | "reject") {
    setBusyId(entry.id);
    try {
      await api.post(`/admin/entries/${entry.id}/${action}`);
      load(); // refresh cycle summaries + any newly issued certificate
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!data) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const { member, cycles } = data;

  return (
    <div className="space-y-6">
      <Link to="/admin/members" className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to members
      </Link>

      {/* Profile header */}
      <div className="card flex flex-wrap items-center gap-5 p-6">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ink font-serif text-xl font-bold text-white">
          {initials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-bold text-ink">{member.name}</h1>
          <div className="text-sm text-muted">
            {member.membershipNo ?? member.email}
            {member.profession ? ` · ${member.profession}` : ""}
          </div>
          {member.professionalBody && (
            <div className="text-[13px] text-muted">{member.professionalBody}</div>
          )}
        </div>
        {(member.jobTitle || member.organisation) && (
          <div className="text-right text-[13px] text-muted">
            {member.jobTitle && <div className="font-semibold text-ink">{member.jobTitle}</div>}
            {member.organisation}
          </div>
        )}
      </div>

      {/* Cycles */}
      {cycles.map((cycle) => (
        <div key={cycle.cycleId} className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProgressRing percent={cycle.percentComplete} size={64} stroke={8}>
                <div className="font-serif text-xs font-bold text-ink">
                  {cycle.percentComplete}%
                </div>
              </ProgressRing>
              <div>
                <div className="label-caps">
                  {cycle.isCurrent ? "Current cycle" : "Past cycle"}
                </div>
                <div className="font-serif text-lg font-semibold text-ink">{cycle.label}</div>
                <div className="text-[13px] text-muted">
                  {round(cycle.earnedPoints)} / {cycle.requiredPoints} verified points
                </div>
              </div>
            </div>
            {cycle.certRef && (
              <div className="rounded-xl border border-green-line bg-green-soft px-3.5 py-2 text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-green">
                  Certificate issued
                </div>
                <div className="text-[13px] font-semibold text-ink">{cycle.certRef}</div>
                {cycle.issuedAt && (
                  <div className="text-[11px] text-muted">{formatDate(cycle.issuedAt)}</div>
                )}
              </div>
            )}
          </div>

          <ul className="mt-4 divide-y divide-line">
            {cycle.entries.map((e) => {
              const actionable = e.status === "PENDING" || e.status === "NEEDS_PROOF";
              const canVerify = !(e.status === "NEEDS_PROOF" && !e.proofFileName);
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-ink">{e.title}</div>
                    <div className="text-[12.5px] text-muted">
                      {entryTypeLabel(e.type)} · {formatDate(e.activityDate)} ·{" "}
                      {e.proofFileName ? `📎 ${e.proofFileName}` : "no proof"}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink">
                    {pointsLabel(e.pointsClaimed)}
                  </span>
                  <StatusPill status={e.status} />
                  {actionable && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide(e, "verify")}
                        disabled={busyId === e.id || !canVerify}
                        title={canVerify ? "" : "No proof attached"}
                        className="btn-teal px-3 py-1.5 text-[13px]"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => decide(e, "reject")}
                        disabled={busyId === e.id}
                        className="btn border border-rust-line bg-rust-soft px-3 py-1.5 text-[13px] text-rust hover:bg-[#f3d9d6]"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}
