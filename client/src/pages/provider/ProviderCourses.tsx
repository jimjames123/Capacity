import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { Field, SelectField, FormError } from "../../components/Field";
import { COURSE_STATUS_META, FORMAT_META, pointsLabel } from "../../lib/format";
import type { CourseFormat, ProviderCourse } from "../../lib/types";

const PROFESSIONS = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];
const FORMATS: { value: CourseFormat; label: string }[] = [
  { value: "IN_PERSON", label: "In-person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "Hybrid" },
];

interface CourseForm {
  title: string;
  description: string;
  profession: string;
  format: CourseFormat;
  points: string;
  fee: string;
  schedule: string;
  seats: string;
}
const EMPTY: CourseForm = {
  title: "", description: "", profession: "HR", format: "IN_PERSON",
  points: "2", fee: "", schedule: "", seats: "25",
};

export default function ProviderCourses() {
  const [courses, setCourses] = useState<ProviderCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProviderCourse | "new" | null>(null);
  const [deleting, setDeleting] = useState<ProviderCourse | null>(null);

  function load() {
    api
      .get<{ courses: ProviderCourse[] }>("/provider/courses")
      .then((r) => setCourses(r.courses))
      .catch(() => setError("Could not load your courses"));
  }
  useEffect(load, []);

  if (error) return <EmptyState title={error} />;
  if (!courses) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">My courses</h1>
          <p className="mt-2 text-muted">
            Your CPD-eligible listings. New listings are reviewed by the professional
            body before they appear in the marketplace.
          </p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary">+ New listing</button>
      </div>

      {courses.length === 0 ? (
        <EmptyState title="No listings yet" hint="Create your first course listing to reach professionals." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => {
            const meta = COURSE_STATUS_META[c.status];
            return (
              <div key={c.id} className="card flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="label-caps">{FORMAT_META[c.format]}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${meta?.className ?? ""}`}>
                    {meta?.label ?? c.status}
                  </span>
                </div>
                <div className="mt-3 font-serif text-lg font-semibold leading-snug text-ink">{c.title}</div>
                <div className="mt-1 line-clamp-2 text-[13px] text-muted">{c.description}</div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                  <span>{c.profession}</span><span>·</span>
                  <span>{pointsLabel(c.points)}</span><span>·</span>
                  <span>{c.schedule}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[13px] text-muted">{c.enrolments} enrolled · {c.fee}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(c)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
                    <button onClick={() => setDeleting(c)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-rust hover:bg-rust-soft">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <CourseFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <DeleteCourse c={deleting} onClose={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); }} />
      )}
    </div>
  );
}

function CourseFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProviderCourse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<CourseForm>(
    initial
      ? {
          title: initial.title, description: initial.description, profession: initial.profession,
          format: initial.format, points: String(initial.points), fee: initial.fee,
          schedule: initial.schedule, seats: String(initial.seats),
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof CourseForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const payload = {
      title: form.title, description: form.description, profession: form.profession,
      format: form.format, points: Number(form.points), fee: form.fee,
      schedule: form.schedule, seats: Number(form.seats),
    };
    try {
      if (isEdit && initial) await api.patch(`/provider/courses/${initial.id}`, payload);
      else await api.post("/provider/courses", payload);
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit listing" : "New course listing"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Course title" value={form.title} onChange={set("title")} required />
        <label className="block">
          <span className="field-label">Description</span>
          <textarea
            className="field min-h-[90px] resize-y"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What will professionals learn?"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Profession" value={form.profession} onChange={set("profession")} options={PROFESSIONS} />
          <label className="block">
            <span className="field-label">Format</span>
            <select className="field" value={form.format} onChange={(e) => set("format")(e.target.value)}>
              {FORMATS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="CPD points" type="number" value={form.points} onChange={set("points")} required />
          <Field label="Seats" type="number" value={form.seats} onChange={set("seats")} required />
          <Field label="Fee" value={form.fee} onChange={set("fee")} placeholder="UGX 300,000" required />
        </div>
        <Field label="Schedule" value={form.schedule} onChange={set("schedule")} placeholder="Starts 6 May · 1 day" required />
        {!isEdit && (
          <p className="text-[12.5px] text-muted">Submitted for approval — it appears in the marketplace once verified.</p>
        )}
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Submit listing"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteCourse({ c, onClose, onDone }: { c: ProviderCourse; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await api.del(`/provider/courses/${c.id}`);
      onDone();
    } catch {
      setBusy(false);
    }
  }
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={confirm}
      busy={busy}
      title="Delete listing"
      message={`Delete “${c.title}”? This cannot be undone.`}
    />
  );
}
