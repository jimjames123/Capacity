import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import type { TrainerQueueItem } from "../../lib/types";

export default function AdminTrainerQueue() {
  const [queue, setQueue] = useState<TrainerQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErr, setRowErr] = useState<Record<string, string>>({});

  function load() {
    api
      .get<{ queue: TrainerQueueItem[] }>("/admin/trainer-queue")
      .then((r) => setQueue(r.queue))
      .catch(() => setError("Could not load the trainer queue"));
  }
  useEffect(load, []);

  async function decide(t: TrainerQueueItem, verified: boolean) {
    setBusyId(t.id);
    setRowErr((m) => ({ ...m, [t.id]: "" }));
    try {
      await api.patch(`/admin/consultants/${t.id}`, { verified });
      setQueue((q) => (q ? q.filter((x) => x.id !== t.id) : q));
    } catch (e) {
      setRowErr((m) => ({ ...m, [t.id]: e instanceof ApiError ? e.message : "Failed" }));
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!queue) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Trainer approval queue</h1>
        <p className="mt-2 text-muted">
          Control who is allowed to supply training that counts toward your members'
          CPD. Approve verified providers; decline the rest.
        </p>
      </div>

      {queue.length === 0 ? (
        <EmptyState title="No trainers awaiting approval" hint="New provider applicants appear here." />
      ) : (
        <div className="space-y-4">
          {queue.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#D6E4E3] font-serif font-bold text-ink">{t.initials}</div>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/consultants/${t.id}`} className="font-serif text-lg font-semibold text-ink hover:underline">{t.name}</Link>
                  <div className="text-[12.5px] text-muted">{t.type}{t.meta ? ` · ${t.meta}` : ""} · {t.courseCount} course{t.courseCount === 1 ? "" : "s"}</div>
                  {t.bio && <p className="mt-2 max-w-2xl text-sm text-muted">{t.bio}</p>}
                  {rowErr[t.id] && <p className="mt-2 text-[13px] text-rust">{rowErr[t.id]}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide(t, true)} disabled={busyId === t.id} className="btn-teal px-4 py-2">Approve</button>
                  <button onClick={() => decide(t, false)} disabled={busyId === t.id} className="btn-ghost px-4 py-2">Keep pending</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
