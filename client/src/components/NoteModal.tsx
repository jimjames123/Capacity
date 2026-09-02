import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { Modal } from "./Modal";
import { Field, FormError } from "./Field";
import { renderMarkdown } from "../lib/text";
import type { LearnerNote } from "../lib/types";

export function NoteModal({
  initial,
  presetCourseId,
  presetLessonId,
  presetLessonTitle,
  courses = [],
  onClose,
  onSaved,
}: {
  initial?: LearnerNote | null;
  presetCourseId?: string | null;
  presetLessonId?: string | null;
  presetLessonTitle?: string | null;
  courses?: { id: string; title: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [courseId, setCourseId] = useState(initial?.courseId ?? presetCourseId ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lessonId = initial?.lessonId ?? presetLessonId ?? null;
  const lessonTitle = initial?.lessonTitle ?? presetLessonTitle ?? null;
  const lockCourse = !!presetCourseId && !isEdit;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !body.trim()) { setErr("Add a title or some text."); return; }
    setBusy(true);
    setErr(null);
    const payload = {
      title: title.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      body,
      courseId: courseId || null,
      lessonId: courseId ? lessonId : null,
    };
    try {
      if (isEdit && initial) await api.patch(`/me/notes/${initial.id}`, payload);
      else await api.post("/me/notes", payload);
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save the note");
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit note" : "New note"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Week 1 · Key formulas" />
        <Field label="Tags" value={tags} onChange={setTags} placeholder="Comma-separated, e.g. Exam prep, Formulas" optional />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Attach to course <span className="font-normal text-muted">(optional)</span></span>
            <select className="field disabled:opacity-60" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={lockCourse}>
              <option value="">Not linked</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          {lessonTitle && courseId && (
            <div>
              <span className="field-label">Lesson</span>
              <div className="mt-1 rounded-xl border border-line bg-[#F3F6F6] px-3.5 py-2.5 text-sm text-ink">{lessonTitle}</div>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="field-label">Note</span>
            <button type="button" onClick={() => setPreview((p) => !p)} className="text-[12.5px] font-semibold text-teal hover:underline">{preview ? "Edit" : "Preview"}</button>
          </div>
          {preview ? (
            <div className="prose-note min-h-[120px] rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) || "<span class='text-muted'>Nothing to preview.</span>" }} />
          ) : (
            <textarea className="field min-h-[120px] resize-y font-mono text-[13px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder={"Supports **bold**, - bullet lists, and [links](https://…)"} />
          )}
          <p className="mt-1 text-[11.5px] text-faint">Formatting: **bold**, “- ” for bullets, [text](https://link). Private to you.</p>
        </div>
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : isEdit ? "Save note" : "Add note"}</button>
        </div>
      </form>
    </Modal>
  );
}
