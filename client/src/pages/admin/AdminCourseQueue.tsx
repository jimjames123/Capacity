import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { FORMAT_META } from "../../lib/format";
import type { CourseFormat, CourseQueueItem } from "../../lib/types";

export default function AdminCourseQueue() {
  const [queue, setQueue] = useState<CourseQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErr, setRowErr] = useState<Record<string, string>>({});

  function load() {
    api
      .get<{ queue: CourseQueueItem[] }>("/admin/course-queue")
      .then((r) => {
        setQueue(r.queue);
        setPoints(Object.fromEntries(r.queue.map((c) => [c.id, String(c.points)])));
      })
      .catch(() => setError("Could not load the course queue"));
  }
  useEffect(load, []);

  async function approve(c: CourseQueueItem) {
    setBusyId(c.id);
    setRowErr((m) => ({ ...m, [c.id]: "" }));
    try {
      await api.post(`/admin/courses/${c.id}/approve`, { points: Number(points[c.id]) });
      setQueue((q) => (q ? q.filter((x) => x.id !== c.id) : q));
    } catch (e) {
      setRowErr((m) => ({ ...m, [c.id]: e instanceof ApiError ? e.message : "Failed" }));
    } finally {
      setBusyId(null);
    }
  }
  async function reject(c: CourseQueueItem) {
    setBusyId(c.id);
    try {
      await api.post(`/admin/courses/${c.id}/reject`);
      setQueue((q) => (q ? q.filter((x) => x.id !== c.id) : q));
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!queue) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Course approval queue</h1>
        <p className="mt-2 text-muted">
          Assign a CPD-points designation and sign off before a course goes public to
          your members.
        </p>
      </div>

      {queue.length === 0 ? (
        <EmptyState title="Nothing to review" hint="New course listings from providers appear here." />
      ) : (
        <div className="space-y-4">
          {queue.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-semibold text-ink">{c.title}</span>
                    <Badge tone="neutral">{FORMAT_META[c.format as CourseFormat]}</Badge>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted">
                    {c.provider.name}{c.provider.verified ? " · ✓ verified" : " · unverified"} · {c.profession} · {c.schedule} · {c.fee}
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-muted">{c.description}</p>
                  {rowErr[c.id] && <p className="mt-2 text-[13px] text-rust">{rowErr[c.id]}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <label className="flex items-center gap-2 text-[13px] font-semibold text-muted">
                  CPD points
                  <input
                    type="number" step="0.5" min="0"
                    value={points[c.id] ?? ""}
                    onChange={(e) => setPoints((p) => ({ ...p, [c.id]: e.target.value }))}
                    className="w-20 rounded-lg border border-line-strong px-2.5 py-1.5 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => approve(c)} disabled={busyId === c.id} className="btn-teal px-4 py-2">Approve &amp; publish</button>
                  <button onClick={() => reject(c)} disabled={busyId === c.id} className="btn border border-rust-line bg-rust-soft px-4 py-2 text-rust hover:bg-[#f3d9d6]">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
