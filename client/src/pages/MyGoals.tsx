import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../lib/api";
import { EmptyState } from "../components/ui";
import { ConfirmDialog, Modal } from "../components/Modal";
import { Field, SelectField, FormError } from "../components/Field";
import { ProgressBar } from "../components/learn";
import { GOAL_PRIORITY_META, formatDate } from "../lib/format";
import { downloadTextFile } from "../lib/text";
import type { GoalStatus, LearningGoal, MemberCourse } from "../lib/types";

const GROUPS: { key: GoalStatus; label: string }[] = [
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "ARCHIVED", label: "Archived" },
];

export default function MyGoals() {
  const [goals, setGoals] = useState<LearningGoal[] | null>(null);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ initial?: LearningGoal } | null>(null);
  const [deleting, setDeleting] = useState<LearningGoal | null>(null);

  function load() {
    api.get<{ goals: LearningGoal[] }>("/me/goals").then((r) => setGoals(r.goals)).catch(() => setError("Could not load your goals"));
  }
  useEffect(() => {
    load();
    api.get<{ courses: MemberCourse[] }>("/me/courses").then((r) => setCourses(r.courses.map((c) => ({ id: c.course.id, title: c.course.title })))).catch(() => {});
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, LearningGoal[]> = { ACTIVE: [], COMPLETED: [], ARCHIVED: [] };
    for (const g of goals ?? []) (map[g.status] ??= []).push(g);
    return map;
  }, [goals]);

  async function setStatus(g: LearningGoal, status: GoalStatus) {
    await api.patch(`/me/goals/${g.id}`, { status });
    load();
  }

  function exportGoals() {
    const txt = (goals ?? []).map((g) => {
      const bits = [`Priority: ${g.priority}`, `Status: ${g.status}`, g.targetDate && `Target: ${formatDate(g.targetDate)}`, g.courseTitle && `Course: ${g.courseTitle}`].filter(Boolean).join(" · ");
      return `• ${g.title}\n  ${bits}${g.description ? `\n  ${g.description}` : ""}`;
    }).join("\n\n");
    downloadTextFile("capacity-lane-goals.txt", `My Capacity Lane learning goals\n\n${txt}\n`);
  }

  if (error) return <EmptyState title={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">My learning goals</h1>
          <p className="mt-2 text-muted">Set targets, track them against your courses, and keep yourself on schedule.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {goals && goals.length > 0 && <button onClick={exportGoals} className="btn-ghost px-4 py-2">Export</button>}
          <button onClick={() => setEditing({})} className="btn-primary">+ New goal</button>
        </div>
      </div>

      {!goals ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-line" />)}</div>
      ) : goals.length === 0 ? (
        <EmptyState title="No goals yet" hint="e.g. “Complete Python basics in 4 weeks” or “Earn my certificate by December”. Add a target date and link it to a course." action={<button onClick={() => setEditing({})} className="btn-primary">Set your first goal</button>} />
      ) : (
        <div className="space-y-8">
          {GROUPS.map(({ key, label }) => {
            const items = grouped[key] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <div className="label-caps mb-3 text-muted">{label} · {items.length}</div>
                <div className="space-y-3">
                  {items.map((g) => (
                    <GoalCard key={g.id} g={g} onEdit={() => setEditing({ initial: g })} onDelete={() => setDeleting(g)} onStatus={(s) => setStatus(g, s)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <GoalModal initial={editing.initial} courses={courses} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
      {deleting && (
        <ConfirmDialog open onClose={() => setDeleting(null)} onConfirm={async () => { await api.del(`/me/goals/${deleting.id}`); setDeleting(null); load(); }} title="Delete goal" message={`Delete “${deleting.title}”?`} />
      )}
    </div>
  );
}

function GoalCard({ g, onEdit, onDelete, onStatus }: { g: LearningGoal; onEdit: () => void; onDelete: () => void; onStatus: (s: GoalStatus) => void }) {
  const pr = GOAL_PRIORITY_META[g.priority];
  const overdue = g.status === "ACTIVE" && g.targetDate && new Date(g.targetDate) < new Date();
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-serif text-lg font-semibold text-ink ${g.status === "COMPLETED" ? "line-through opacity-70" : ""}`}>{g.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${pr.className}`}>{pr.label} priority</span>
          </div>
          {g.description && <p className="mt-1 text-sm text-muted">{g.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
            {g.targetDate && <span className={overdue ? "font-semibold text-rust" : ""}>🎯 {overdue ? "Was due " : "Target "}{formatDate(g.targetDate)}</span>}
            {g.courseTitle && <span>📘 {g.courseTitle}</span>}
          </div>
          {g.linkedProgress && (
            <div className="mt-3 max-w-md">
              <ProgressBar progress={g.linkedProgress} tone={g.linkedProgress.pct >= 100 ? "green" : "teal"} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex gap-1">
            <button onClick={onEdit} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
            <button onClick={onDelete} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-rust hover:bg-rust-soft">Delete</button>
          </div>
          <div className="flex gap-1">
            {g.status !== "COMPLETED" && <button onClick={() => onStatus("COMPLETED")} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-green hover:bg-green-soft">Mark done</button>}
            {g.status === "ACTIVE" && <button onClick={() => onStatus("ARCHIVED")} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-muted hover:bg-[#EDF1F1]">Archive</button>}
            {g.status !== "ACTIVE" && <button onClick={() => onStatus("ACTIVE")} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-teal hover:bg-[#EDF1F1]">Reactivate</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalModal({ initial, courses, onClose, onSaved }: { initial?: LearningGoal; courses: { id: string; title: string }[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    targetDate: initial?.targetDate ? initial.targetDate.slice(0, 10) : "",
    priority: initial?.priority ?? "MEDIUM",
    courseId: initial?.courseId ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Give your goal a title."); return; }
    setBusy(true);
    setErr(null);
    const payload = { ...form, targetDate: form.targetDate || null, courseId: form.courseId || null };
    try {
      if (isEdit && initial) await api.patch(`/me/goals/${initial.id}`, payload);
      else await api.post("/me/goals", payload);
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save the goal");
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit goal" : "New learning goal"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Goal" value={form.title} onChange={set("title")} placeholder="e.g. Complete Python basics in 4 weeks" required />
        <label className="block">
          <span className="field-label">Description <span className="font-normal text-muted">(optional)</span></span>
          <textarea className="field min-h-[70px] resize-y" value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Why this matters / what success looks like." />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target date" type="date" value={form.targetDate} onChange={set("targetDate")} optional />
          <SelectField label="Priority" value={form.priority} onChange={set("priority")} options={["HIGH", "MEDIUM", "LOW"]} />
        </div>
        <label className="block">
          <span className="field-label">Link to a course <span className="font-normal text-muted">(optional)</span></span>
          <select className="field" value={form.courseId} onChange={(e) => set("courseId")(e.target.value)}>
            <option value="">Not linked</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : isEdit ? "Save goal" : "Add goal"}</button>
        </div>
      </form>
    </Modal>
  );
}
