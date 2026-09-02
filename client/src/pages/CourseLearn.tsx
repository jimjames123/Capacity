import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { EmptyState } from "../components/ui";
import { ConfirmDialog } from "../components/Modal";
import { NoteModal } from "../components/NoteModal";
import { Thumb, ProgressBar } from "../components/learn";
import { LEARN_STATUS_META, FORMAT_META, formatDate } from "../lib/format";
import { renderMarkdown } from "../lib/text";
import type { CourseFormat, CourseLearnDetail, LearnerNote } from "../lib/types";

export default function CourseLearn() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<CourseLearnDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyLesson, setBusyLesson] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  const [notes, setNotes] = useState<LearnerNote[]>([]);
  const [noteEditing, setNoteEditing] = useState<{ initial?: LearnerNote; lessonId?: string; lessonTitle?: string } | null>(null);
  const [noteDeleting, setNoteDeleting] = useState<LearnerNote | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api.get<CourseLearnDetail>(`/me/courses/${id}`).then(setD).catch(() => setError("You're not enrolled in this course"));
    api.get<{ notes: LearnerNote[] }>(`/me/notes?courseId=${id}`).then((r) => setNotes(r.notes)).catch(() => {});
  }, [id]);
  useEffect(load, [load]);

  const firstIncomplete = useMemo(() => {
    for (const m of d?.modules ?? []) for (const l of m.lessons) if (!l.done) return l.id;
    return null;
  }, [d]);

  async function toggle(lessonId: string, done: boolean) {
    if (!id || !d) return;
    setBusyLesson(lessonId);
    // optimistic
    setD((cur) => cur && ({ ...cur, modules: cur.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, done } : l) })) }));
    try {
      const r = await api.post<{ progress: CourseLearnDetail["progress"]; status: CourseLearnDetail["status"]; lastLessonId: string }>(`/me/courses/${id}/progress`, { lessonId, done, addMinutes: done ? 10 : 0 });
      setD((cur) => cur && ({ ...cur, progress: r.progress, status: r.status, lastLessonId: r.lastLessonId, lastAccessedAt: new Date().toISOString(), timeSpentMin: cur.timeSpentMin + (done ? 10 : 0) }));
    } catch {
      load();
    } finally {
      setBusyLesson(null);
    }
  }

  async function setPaused(pause: boolean) {
    if (!id) return;
    await api.patch(`/me/courses/${id}`, { status: pause ? "PAUSED" : "RESUME" });
    load();
  }

  function continueLearning() {
    if (!firstIncomplete) return;
    setHighlight(firstIncomplete);
    document.getElementById(`lesson-${firstIncomplete}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlight(null), 2200);
  }

  async function deleteNote() {
    if (!noteDeleting) return;
    await api.del(`/me/notes/${noteDeleting.id}`);
    setNoteDeleting(null);
    load();
  }

  if (error) return <EmptyState title={error} action={<Link to="/app/courses" className="btn-primary">Back to my courses</Link>} />;
  if (!d) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const meta = LEARN_STATUS_META[d.status];

  return (
    <div className="space-y-6">
      <Link to="/app/courses" className="text-sm font-semibold text-muted hover:text-ink">← My courses</Link>

      {/* Header */}
      <div className="card overflow-hidden">
        <Thumb thumb={d.thumb} title={d.course.title} className="h-28" />
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-ink">{d.course.title}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}>{meta.label}</span>
              </div>
              <div className="mt-1 text-sm text-muted">{d.course.provider} · {FORMAT_META[d.course.format as CourseFormat]}{(d.course.city || d.course.country) ? ` · ${[d.course.city, d.course.country].filter(Boolean).join(", ")}` : ""}</div>
            </div>
            <div className="flex gap-2">
              {d.status !== "COMPLETED" && (
                <button onClick={() => setPaused(d.status !== "PAUSED")} className="btn-ghost px-3.5 py-2 text-[13px]">{d.status === "PAUSED" ? "Resume" : "Pause"}</button>
              )}
              <button onClick={continueLearning} disabled={!firstIncomplete} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">
                {firstIncomplete ? "Continue learning" : "All lessons done"}
              </button>
            </div>
          </div>
          {d.course.description && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{d.course.description}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <ProgressBar progress={d.progress} tone={d.status === "COMPLETED" ? "green" : "teal"} />
            <div className="flex items-center gap-5 text-[12.5px] text-muted sm:justify-end">
              <span><span className="font-semibold text-ink">{formatTime(d.timeSpentMin)}</span> spent</span>
              {d.lastAccessedAt && <span>Last active {formatDate(d.lastAccessedAt)}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Modules / lessons */}
        <div className="space-y-5">
          {d.modules.map((m, mi) => {
            const done = m.lessons.filter((l) => l.done).length;
            return (
              <div key={mi} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-serif text-lg font-semibold text-ink">{m.title}</h2>
                  <span className="text-[12px] text-muted">{done}/{m.lessons.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {m.lessons.map((l) => (
                    <li
                      key={l.id}
                      id={`lesson-${l.id}`}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${highlight === l.id ? "border-teal ring-2 ring-teal/30" : "border-line"}`}
                    >
                      <button
                        onClick={() => toggle(l.id, !l.done)}
                        disabled={busyLesson === l.id}
                        aria-label={l.done ? "Mark incomplete" : "Mark complete"}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[13px] transition ${l.done ? "border-green bg-green text-white" : "border-line-strong text-transparent hover:border-teal"}`}
                      >
                        ✓
                      </button>
                      <span className={`min-w-0 flex-1 text-sm ${l.done ? "text-muted line-through" : "text-ink"}`}>{l.title}</span>
                      <button onClick={() => setNoteEditing({ lessonId: l.id, lessonTitle: l.title })} className="shrink-0 text-[12px] font-semibold text-teal hover:underline">+ Note</button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Notes for this course */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">My notes</h2>
              <button onClick={() => setNoteEditing({})} className="text-[13px] font-semibold text-teal hover:underline">+ Add</button>
            </div>
            {notes.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">No notes for this course yet. Capture key ideas as you learn.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-line p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {n.title && <div className="truncate text-sm font-semibold text-ink">{n.title}</div>}
                        {n.lessonTitle && <div className="text-[11.5px] text-teal">{n.lessonTitle}</div>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => setNoteEditing({ initial: n })} className="text-[12px] font-semibold text-teal hover:underline">Edit</button>
                        <button onClick={() => setNoteDeleting(n)} className="text-[12px] font-semibold text-rust hover:underline">Delete</button>
                      </div>
                    </div>
                    <div className="prose-note mt-1.5 text-[13px] text-muted" dangerouslySetInnerHTML={{ __html: renderMarkdown(n.body) }} />
                    {n.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {n.tags.map((t) => <span key={t} className="rounded-full bg-[#EDF1F1] px-2 py-0.5 text-[11px] text-muted">{t}</span>)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {noteEditing && (
        <NoteModal
          initial={noteEditing.initial}
          presetCourseId={id}
          presetLessonId={noteEditing.lessonId ?? null}
          presetLessonTitle={noteEditing.lessonTitle ?? null}
          courses={[{ id: id!, title: d.course.title }]}
          onClose={() => setNoteEditing(null)}
          onSaved={() => { setNoteEditing(null); load(); }}
        />
      )}
      {noteDeleting && (
        <ConfirmDialog open onClose={() => setNoteDeleting(null)} onConfirm={deleteNote} title="Delete note" message="Delete this note? This cannot be undone." />
      )}
    </div>
  );
}

function formatTime(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
