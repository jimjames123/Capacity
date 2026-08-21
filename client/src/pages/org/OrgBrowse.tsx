import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Badge, EmptyState, Stars } from "../../components/ui";
import { FORMAT_META, pointsLabel } from "../../lib/format";
import type { Course, CourseFormat } from "../../lib/types";

const PROFESSIONS = ["All", "HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

export default function OrgBrowse() {
  const [profession, setProfession] = useState("All");
  const [courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (profession !== "All") params.set("profession", profession);
    setCourses(null);
    api
      .get<{ courses: Course[] }>(`/courses?${params.toString()}`)
      .then((r) => setCourses(r.courses))
      .catch(() => setCourses([]));
  }, [profession]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Browse training</h1>
        <p className="mt-2 text-muted">
          Accredited, CPD-eligible courses from verified providers you can commission
          for your team. Post a tender for something bespoke.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-[13px] font-semibold text-muted">Profession</span>
          {PROFESSIONS.map((p) => (
            <button
              key={p}
              onClick={() => setProfession(p)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                profession === p ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-muted hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!courses ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-line" />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState title="No courses match" hint="Try a different profession, or post a tender." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div key={c.id} className="card flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="label-caps">{FORMAT_META[c.format as CourseFormat]}</span>
                <Badge tone="teal">{pointsLabel(c.points)}</Badge>
              </div>
              <div className="mt-3 font-serif text-lg font-semibold leading-snug text-ink">{c.title}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                {c.provider.name}
                {c.provider.verified && <span className="text-[11px] font-semibold text-green">✓</span>}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
                <Stars value={c.rating} /> {c.rating.toFixed(1)} · {c.schedule}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="font-semibold text-ink">{c.fee}</span>
                <span className="text-[12px] font-medium text-green">✓ Verified provider</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
