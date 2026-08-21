import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Badge, EmptyState, Stars } from "../../components/ui";
import { FORMAT_META, pointsLabel } from "../../lib/format";
import type { ConsultantDetail, CourseFormat } from "../../lib/types";

export default function AdminConsultantDetail() {
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<ConsultantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ consultant: ConsultantDetail }>(`/admin/consultants/${id}`)
      .then((r) => setC(r.consultant))
      .catch(() => setError("Consultant not found"));
  }, [id]);

  if (error) return <EmptyState title={error} />;
  if (!c) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const totalEnrolments = c.courses.reduce((s, x) => s + x.enrollments, 0);

  return (
    <div className="space-y-6">
      <Link to="/admin/consultants" className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to consultants
      </Link>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink font-serif text-2xl font-bold text-white">
            {c.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-ink">{c.name}</h1>
              {c.verified ? (
                <Badge tone="green">✓ Verified provider</Badge>
              ) : (
                <span className="rounded-full border border-amber-line bg-amber-soft px-2.5 py-0.5 text-[12px] font-semibold text-amber">
                  Pending approval
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-muted">{c.type}{c.meta ? ` · ${c.meta}` : ""}</div>
            <div className="mt-2 flex items-center gap-2 text-[13px] text-muted">
              <Stars value={c.rating} />
              <span>{c.rating.toFixed(1)} average rating</span>
            </div>
            {c.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{c.bio}</p>}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
          <Stat label="Courses listed" value={String(c.courses.length)} />
          <Stat label="Total enrolments" value={String(totalEnrolments)} />
          <Stat label="Rating" value={c.rating.toFixed(1)} />
        </div>
      </div>

      {/* Courses */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-ink">Listed courses</h2>
        {c.courses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">This provider has no courses listed yet.</p>
        ) : (
          <div className="mt-4 card divide-y divide-line">
            {c.courses.map((course) => (
              <div key={course.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink">{course.title}</div>
                  <div className="text-[12.5px] text-muted">
                    {course.profession} · {FORMAT_META[course.format as CourseFormat]} · {course.schedule}
                  </div>
                </div>
                <Badge tone="teal">{pointsLabel(course.points)}</Badge>
                <span className="text-[13px] text-muted">{course.enrollments} enrolled</span>
                <span className="text-sm font-semibold text-ink">{course.fee}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-1 font-serif text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}
