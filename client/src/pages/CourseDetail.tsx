import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Badge, EmptyState, Stars } from "../components/ui";
import { FORMAT_META, pointsLabel } from "../lib/format";
import type { Course, CourseFormat } from "../lib/types";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollState, setEnrollState] = useState<
    "idle" | "busy" | "done" | "already"
  >("idle");
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ course: Course }>(`/courses/${id}`)
      .then((r) => setCourse(r.course))
      .catch(() => setError("Course not found"));
  }, [id]);

  async function enroll() {
    if (!id) return;
    setEnrollState("busy");
    setEnrollError(null);
    try {
      const r = await api.post<{ alreadyEnrolled?: boolean }>(
        `/courses/${id}/enroll`,
      );
      setEnrollState(r.alreadyEnrolled ? "already" : "done");
    } catch (err) {
      setEnrollState("idle");
      setEnrollError(err instanceof ApiError ? err.message : "Could not enrol");
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!course) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const enrollLabel =
    enrollState === "done"
      ? "✓ Enrolled"
      : enrollState === "already"
        ? "✓ Already enrolled"
        : enrollState === "busy"
          ? "Enrolling…"
          : "Enrol in this course";

  return (
    <div className="space-y-6">
      <Link
        to="/app/marketplace"
        className="text-sm font-semibold text-muted hover:text-ink"
      >
        ← Back to marketplace
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Main */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="label-caps">{FORMAT_META[course.format as CourseFormat]}</span>
              <Badge tone="teal">{pointsLabel(course.points)}</Badge>
              <span className="flex items-center gap-1.5 text-[13px] text-muted">
                <Stars value={course.rating} />
                {course.rating.toFixed(1)} ({course.reviewsCount} reviews)
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink">
              {course.title}
            </h1>
            <p className="mt-3 leading-relaxed text-[#2E3B3F]">{course.description}</p>
          </div>

          {/* Provider */}
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink font-serif font-bold text-white">
                {course.provider.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{course.provider.name}</span>
                  {course.provider.verified && (
                    <span className="text-[12px] font-semibold text-green">✓ Verified provider</span>
                  )}
                </div>
                <div className="text-[13px] text-muted">
                  {course.provider.type} · {course.provider.meta}
                </div>
              </div>
            </div>
            {course.provider.bio && (
              <p className="mt-3 text-sm leading-relaxed text-muted">{course.provider.bio}</p>
            )}
            {course.provider.qualifications && (
              <p className="mt-2 text-[12.5px] text-muted"><span className="font-semibold text-ink">Qualifications:</span> {course.provider.qualifications}</p>
            )}
            {course.provider.website && (
              <a href={course.provider.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-semibold text-teal hover:underline">Visit website ↗</a>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">Reviews</h2>
            {course.reviews && course.reviews.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {course.reviews.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{r.name}</span>
                      <Stars value={r.stars} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{r.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sticky enrol card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="font-serif text-3xl font-bold text-ink">{course.fee}</div>
            <dl className="mt-5 space-y-3 text-sm">
              <Detail label="Format" value={FORMAT_META[course.format as CourseFormat]} />
              <Detail label="Schedule" value={course.schedule} />
              {(course.city || course.country) && (
                <Detail label="Location" value={[course.city, course.country].filter(Boolean).join(", ")} />
              )}
              <Detail label="CPD points" value={pointsLabel(course.points)} />
              <Detail label="Seats remaining" value={String(course.seats)} />
            </dl>
            <button
              onClick={enroll}
              disabled={enrollState === "busy" || enrollState === "done" || enrollState === "already"}
              className="btn-teal mt-6 w-full py-3"
            >
              {enrollLabel}
            </button>
            {enrollError && (
              <div className="mt-3 rounded-lg border border-rust-line bg-rust-soft px-3 py-2 text-[13px] text-rust">
                {enrollError}
              </div>
            )}
            {(enrollState === "done" || enrollState === "already") && (
              <p className="mt-3 text-center text-[13px] text-green">
                On completion, this counts as {pointsLabel(course.points)} toward your cycle.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
