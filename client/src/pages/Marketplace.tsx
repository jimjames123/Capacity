import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Badge, EmptyState, Stars } from "../components/ui";
import { FORMAT_META, pointsLabel } from "../lib/format";
import type { Course, CourseFormat } from "../lib/types";

const PROFESSIONS = ["All", "HR", "Finance", "Engineering", "Marketing", "Cross-industry"];
const FORMATS: { value: string; label: string }[] = [
  { value: "All", label: "All" },
  { value: "IN_PERSON", label: "In-person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "Hybrid" },
];

export default function Marketplace() {
  const [profession, setProfession] = useState("All");
  const [format, setFormat] = useState("All");
  const [courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (profession !== "All") params.set("profession", profession);
    if (format !== "All") params.set("format", format);
    setCourses(null);
    api
      .get<{ courses: Course[] }>(`/courses?${params.toString()}`)
      .then((r) => setCourses(r.courses))
      .catch(() => setCourses([]));
  }, [profession, format]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">
          Course &amp; workshop marketplace
        </h1>
        <p className="mt-2 text-muted">
          CPD-eligible offerings from verified providers across every field.
          {courses ? ` ${courses.length} offering${courses.length === 1 ? "" : "s"}.` : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="card space-y-4 p-5">
        <FilterRow label="Profession" options={PROFESSIONS.map((p) => ({ value: p, label: p }))} value={profession} onChange={setProfession} />
        <FilterRow label="Format" options={FORMATS} value={format} onChange={setFormat} />
      </div>

      {/* Grid */}
      {!courses ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-line" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses match those filters"
          hint="Try widening your profession or format selection."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/app/marketplace/${course.id}`}
      className="card flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-center justify-between">
        <span className="label-caps">{FORMAT_META[course.format as CourseFormat]}</span>
        <Badge tone="teal">{pointsLabel(course.points)}</Badge>
      </div>
      <div className="mt-3 font-serif text-lg font-semibold leading-snug text-ink">
        {course.title}
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm text-muted">
        {course.provider.name}
        {course.provider.verified && (
          <span className="text-[11px] font-semibold text-green">✓ Verified</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
        <Stars value={course.rating} />
        <span>{course.rating.toFixed(1)}</span>
        <span>·</span>
        <span>{course.schedule}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="font-semibold text-ink">{course.fee}</span>
        <span className="text-sm font-semibold text-teal">View course →</span>
      </div>
    </Link>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-[13px] font-semibold text-muted">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
            value === o.value
              ? "border-ink bg-ink text-white"
              : "border-line-strong bg-white text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
