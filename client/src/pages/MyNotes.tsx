import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { EmptyState } from "../components/ui";
import { ConfirmDialog } from "../components/Modal";
import { NoteModal } from "../components/NoteModal";
import { renderMarkdown, downloadTextFile } from "../lib/text";
import { formatDate } from "../lib/format";
import type { LearnerNote, MemberCourse } from "../lib/types";

export default function MyNotes() {
  const [notes, setNotes] = useState<LearnerNote[] | null>(null);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [courseF, setCourseF] = useState("All");
  const [editing, setEditing] = useState<{ initial?: LearnerNote } | null>(null);
  const [deleting, setDeleting] = useState<LearnerNote | null>(null);

  function load() {
    api.get<{ notes: LearnerNote[] }>("/me/notes").then((r) => setNotes(r.notes)).catch(() => setError("Could not load your notes"));
  }
  useEffect(() => {
    load();
    api.get<{ courses: MemberCourse[] }>("/me/courses").then((r) => setCourses(r.courses.map((c) => ({ id: c.course.id, title: c.course.title })))).catch(() => {});
  }, []);

  const view = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (notes ?? []).filter((n) => {
      if (courseF !== "All" && n.courseId !== courseF) return false;
      if (term && !`${n.title} ${n.body} ${n.tags.join(" ")} ${n.courseTitle ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [notes, q, courseF]);

  function exportNotes() {
    const md = (notes ?? []).map((n) => {
      const head = `# ${n.title || "(untitled)"}`;
      const ctx = [n.courseTitle && `Course: ${n.courseTitle}`, n.lessonTitle && `Lesson: ${n.lessonTitle}`, n.tags.length && `Tags: ${n.tags.join(", ")}`].filter(Boolean).join(" · ");
      return `${head}\n${ctx ? `_${ctx}_\n` : ""}\n${n.body}\n`;
    }).join("\n---\n\n");
    downloadTextFile("capacity-lane-notes.md", `# My Capacity Lane notes\n\n${md}`, "text/markdown;charset=utf-8");
  }

  if (error) return <EmptyState title={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">My notes</h1>
          <p className="mt-2 text-muted">Private notes for your learning. Only you can see these.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {notes && notes.length > 0 && <button onClick={exportNotes} className="btn-ghost px-4 py-2">Export</button>}
          <button onClick={() => setEditing({})} className="btn-primary">+ New note</button>
        </div>
      </div>

      {!notes ? (
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-line" />)}</div>
      ) : notes.length === 0 ? (
        <EmptyState title="No notes yet" hint="Jot down key ideas, formulas or exam prep. You can tag them and link them to a course." action={<button onClick={() => setEditing({})} className="btn-primary">Write your first note</button>} />
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <input className="field flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, tags…" />
            <select className="field sm:w-56" value={courseF} onChange={(e) => setCourseF(e.target.value)}>
              <option value="All">All courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {view.length === 0 ? (
            <EmptyState title="No notes match your search" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {view.map((n) => (
                <div key={n.id} className="card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-serif text-[16px] font-semibold text-ink">{n.title || "(untitled)"}</div>
                      {(n.courseTitle || n.lessonTitle) && (
                        <div className="text-[12px] text-teal">{n.courseTitle}{n.lessonTitle ? ` · ${n.lessonTitle}` : ""}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => setEditing({ initial: n })} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
                      <button onClick={() => setDeleting(n)} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-rust hover:bg-rust-soft">Delete</button>
                    </div>
                  </div>
                  <div className="prose-note mt-2 flex-1 text-[13px] text-muted" dangerouslySetInnerHTML={{ __html: renderMarkdown(n.body) }} />
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {n.tags.map((t) => <span key={t} className="rounded-full bg-[#EDF1F1] px-2 py-0.5 text-[11px] text-muted">{t}</span>)}
                    <span className="ml-auto text-[11px] text-faint">{formatDate(n.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <NoteModal
          initial={editing.initial}
          courses={courses}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <ConfirmDialog open onClose={() => setDeleting(null)} onConfirm={async () => { await api.del(`/me/notes/${deleting.id}`); setDeleting(null); load(); }} title="Delete note" message={`Delete “${deleting.title || "this note"}”? This cannot be undone.`} />
      )}
    </div>
  );
}
