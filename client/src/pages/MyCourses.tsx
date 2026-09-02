import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { EmptyState } from "../components/ui";
import { Thumb, ProgressBar } from "../components/learn";
import { LEARN_STATUS_META, formatDate, FORMAT_META } from "../lib/format";
import type { CourseFormat, MemberCourse } from "../lib/types";

type Sort = "recent" | "az" | "status";
const STATUS_ORDER = ["IN_PROGRESS", "NOT_STARTED", "PAUSED", "COMPLETED"];

export default function MyCourses() {
  const [courses, setCourses] = useState<MemberCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusF, setStatusF] = useState("All");
  const [sort, setSort] = useState<Sort>("recent");

  useEffect(() => {
    api.get<{ courses: MemberCourse[] }>("/me/courses").then((r) => setCourses(r.courses)).catch(() => setError("Could not load your courses"));
  }, []);

  const view = useMemo(() => {
    let list = (courses ?? []).slice();
    if (statusF !== "All") list = list.filter((c) => c.status === statusF);
    list.sort((a, b) => {
      if (sort === "az") return a.course.title.localeCompare(b.course.title);
      if (sort === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      return (+new Date(b.lastAccessedAt ?? b.enrolledAt)) - (+new Date(a.lastAccessedAt ?? a.enrolledAt));
    });
    return list;
  }, [courses, statusF, sort]);

  if (error) return <EmptyState title={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">My courses</h1>
          <p className="mt-2 text-muted">Everything you're enrolled in, with your progress. Pick up where you left off.</p>
        </div>
        <Link to="/app/marketplace" className="btn-ghost">Browse the marketplace →</Link>
      </div>

      {!courses ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-line" />)}</div>
      ) : courses.length === 0 ? (
        <EmptyState title="You're not enrolled in anything yet" hint="Find an accredited course in the marketplace and enrol to start tracking your progress." action={<Link to="/app/marketplace" className="btn-primary">Explore courses</Link>} />
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Status
              <select className="field !w-auto py-1.5" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
                <option value="All">All</option>
                {Object.entries(LEARN_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Sort by
              <select className="field !w-auto py-1.5" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="recent">Recently accessed</option>
                <option value="az">Alphabetical</option>
                <option value="status">Status</option>
              </select>
            </label>
            <span className="ml-auto text-[12.5px] text-muted">{view.length} course{view.length === 1 ? "" : "s"}</span>
          </div>

          {view.length === 0 ? (
            <EmptyState title="No courses match this filter" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {view.map((c) => {
                const meta = LEARN_STATUS_META[c.status];
                return (
                  <div key={c.enrollmentId} className="card flex flex-col overflow-hidden">
                    <Link to={`/app/courses/${c.course.id}`}><Thumb thumb={c.thumb} title={c.course.title} /></Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/app/courses/${c.course.id}`} className="font-serif text-[16px] font-semibold leading-snug text-ink hover:underline">{c.course.title}</Link>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${meta.className}`}>{meta.label}</span>
                      </div>
                      <div className="mt-1 text-[12.5px] text-muted">{c.course.provider}</div>
                      <div className="mt-1 text-[11.5px] text-faint">{FORMAT_META[c.course.format as CourseFormat]} · Enrolled {formatDate(c.enrolledAt)}</div>
                      <div className="mt-3"><ProgressBar progress={c.progress} tone={c.status === "COMPLETED" ? "green" : "teal"} /></div>
                      <Link to={`/app/courses/${c.course.id}`} className="btn-primary mt-4 w-full py-2 text-center text-[13px]">
                        {c.status === "COMPLETED" ? "Review course" : c.status === "NOT_STARTED" ? "Start learning" : "Continue learning"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
