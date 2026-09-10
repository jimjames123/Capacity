import { useEffect, useMemo, useState } from "react";
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

type SortKey = "rating" | "points" | "title";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "rating", label: "Top rated" },
  { value: "points", label: "Most CPD points" },
  { value: "title", label: "Title (A–Z)" },
];

/** Parse the leading number out of a fee string like "UGX 450,000" for sorting. */
function feeNum(fee: string): number {
  const n = Number(String(fee).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export default function Marketplace() {
  const [profession, setProfession] = useState("All");
  const [format, setFormat] = useState("All");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [courses, setCourses] = useState<Course[] | null>(null);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (profession !== "All") params.set("profession", profession);
    if (format !== "All") params.set("format", format);
    if (query) params.set("q", query);
    setCourses(null);
    api
      .get<{ courses: Course[] }>(`/courses?${params.toString()}`)
      .then((r) => setCourses(r.courses))
      .catch(() => setCourses([]));
  }, [profession, format, query]);

  const sorted = useMemo(() => {
    if (!courses) return courses;
    const list = courses.slice();
    if (sort === "points") list.sort((a, b) => b.points - a.points || b.rating - a.rating);
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => b.rating - a.rating || feeNum(a.fee) - feeNum(b.fee));
    return list;
  }, [courses, sort]);

  const hasFilters = profession !== "All" || format !== "All" || query !== "";
  function clearFilters() {
    setProfession("All");
    setFormat("All");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">
          Course &amp; workshop marketplace
        </h1>
        <p className="mt-2 text-muted">
          CPD-eligible offerings from verified providers across every field.
          {sorted ? ` ${sorted.length} offering${sorted.length === 1 ? "" : "s"}.` : ""}
        </p>
      </div>

      {/* Search + filters */}
      <div className="card space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, provider, topic or location…"
              className="field w-full pl-9"
              aria-label="Search courses"
            />
          </div>
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-[13px] font-semibold text-muted">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="field"
              aria-label="Sort courses"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
        <FilterRow label="Profession" options={PROFESSIONS.map((p) => ({ value: p, label: p }))} value={profession} onChange={setProfession} />
        <FilterRow label="Format" options={FORMATS} value={format} onChange={setFormat} />
      </div>

      {/* Grid */}
      {!sorted ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-line" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No courses match your search"
          hint="Try a different keyword or widen your profession or format selection."
          action={hasFilters ? <button onClick={clearFilters} className="btn-ghost">Clear filters</button> : undefined}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
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
      {course.seats <= 0 ? (
        <div className="mt-3"><Badge tone="rust">Fully booked · join waitlist</Badge></div>
      ) : course.seats <= 5 ? (
        <div className="mt-3"><Badge tone="amber">Only {course.seats} seat{course.seats === 1 ? "" : "s"} left</Badge></div>
      ) : null}
      <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
        <span className="font-semibold text-ink">{course.fee}</span>
        <span className="text-sm font-semibold text-teal">{course.seats <= 0 ? "Ask / waitlist →" : "View course →"}</span>
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
