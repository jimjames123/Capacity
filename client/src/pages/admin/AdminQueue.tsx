import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { EmptyState, StatusPill } from "../../components/ui";
import { entryTypeLabel, formatDate, pointsLabel } from "../../lib/format";
import type { QueueItem } from "../../lib/types";

export default function AdminQueue() {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  function load() {
    api
      .get<{ queue: QueueItem[] }>("/admin/queue")
      .then((r) => setQueue(r.queue))
      .catch(() => setError("Could not load the queue"));
  }
  useEffect(load, []);

  async function decide(item: QueueItem, action: "verify" | "reject") {
    setBusyId(item.id);
    setRowError((m) => ({ ...m, [item.id]: "" }));
    try {
      await api.post(`/admin/entries/${item.id}/${action}`);
      setQueue((q) => (q ? q.filter((x) => x.id !== item.id) : q));
    } catch (err) {
      setRowError((m) => ({
        ...m,
        [item.id]: err instanceof ApiError ? err.message : "Action failed",
      }));
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!queue) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Verification queue</h1>
        <p className="mt-2 text-muted">
          Review CPD activities submitted by members. Approving one counts it
          toward their cycle; a completed cycle issues a certificate automatically.
        </p>
      </div>

      {queue.length === 0 ? (
        <EmptyState
          title="Nothing to review"
          hint="All submitted activities have been actioned. New submissions will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {queue.map((item) => {
            const canVerify = !(item.status === "NEEDS_PROOF" && !item.proofFileName);
            return (
              <li key={item.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-semibold text-ink">
                        {item.title}
                      </span>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="mt-1 text-[13px] text-muted">
                      {item.member.name}
                      {item.member.membershipNo ? ` · ${item.member.membershipNo}` : ""} ·{" "}
                      {entryTypeLabel(item.type)} · {formatDate(item.activityDate)} ·{" "}
                      {pointsLabel(item.pointsClaimed)}
                    </div>
                    <div className="mt-2 text-[13px]">
                      {item.proofFileName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EDF1F1] px-2.5 py-1 text-muted">
                          📎 {item.proofFileName}
                        </span>
                      ) : (
                        <span className="text-rust">No proof attached</span>
                      )}
                    </div>
                    {item.note && (
                      <p className="mt-2 text-sm text-muted">“{item.note}”</p>
                    )}
                    {rowError[item.id] && (
                      <p className="mt-2 text-[13px] text-rust">{rowError[item.id]}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decide(item, "verify")}
                      disabled={busyId === item.id || !canVerify}
                      title={canVerify ? "" : "Member must attach proof first"}
                      className="btn-teal px-4 py-2"
                    >
                      {busyId === item.id ? "…" : "Verify"}
                    </button>
                    <button
                      onClick={() => decide(item, "reject")}
                      disabled={busyId === item.id}
                      className="btn border border-rust-line bg-rust-soft px-4 py-2 text-rust hover:bg-[#f3d9d6]"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
