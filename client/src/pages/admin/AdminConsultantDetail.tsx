import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { Badge, EmptyState, Stars } from "../../components/ui";
import { ConfirmDialog } from "../../components/Modal";
import { ConsultantFormModal } from "./AdminConsultants";
import { FORMAT_META, pointsLabel } from "../../lib/format";
import type { ConsultantDetail, ConsultantRow, CourseFormat } from "../../lib/types";

export default function AdminConsultantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [c, setC] = useState<ConsultantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<{ consultant: ConsultantDetail }>(`/admin/consultants/${id}`)
      .then((r) => setC(r.consultant))
      .catch(() => setError("Consultant not found"));
  }, [id]);
  useEffect(load, [load]);

  async function toggleVerify() {
    if (!c) return;
    setC({ ...c, verified: !c.verified });
    try {
      await api.patch(`/admin/consultants/${c.id}`, { verified: !c.verified });
    } catch {
      load();
    }
  }

  async function doDelete() {
    if (!c) return;
    setDelBusy(true);
    try {
      await api.del(`/admin/consultants/${c.id}`);
      navigate("/admin/consultants");
    } catch {
      setDelBusy(false);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!c) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const totalEnrolments = c.courses.reduce((s, x) => s + x.enrollments, 0);
  const asRow: ConsultantRow = {
    id: c.id, name: c.name, initials: c.initials, type: c.type,
    verified: c.verified, rating: c.rating, meta: c.meta, bio: c.bio,
    courseCount: c.courses.length, qualifications: c.qualifications ?? null, website: c.website ?? null,
  };

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
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted">
              <span className="flex items-center gap-2"><Stars value={c.rating} /> {c.rating.toFixed(1)} average rating</span>
              {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="font-semibold text-teal hover:underline">Website ↗</a>}
            </div>
            {c.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{c.bio}</p>}
            {c.qualifications && (
              <div className="mt-3 rounded-xl border border-line bg-[#F6F9F9] p-3.5">
                <div className="label-caps text-muted">Qualifications & certifications</div>
                <p className="mt-1 max-w-2xl text-sm text-ink">{c.qualifications}</p>
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button
              onClick={toggleVerify}
              className={`btn px-4 py-2 ${
                c.verified
                  ? "border border-amber-line bg-amber-soft text-amber hover:bg-[#efe6cf]"
                  : "bg-teal text-white hover:bg-teal-dark"
              }`}
            >
              {c.verified ? "Unverify" : "Verify provider"}
            </button>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="btn-ghost flex-1 px-4 py-2">Edit</button>
              <button
                onClick={() => setDeleting(true)}
                className="btn border border-rust-line bg-rust-soft px-4 py-2 text-rust hover:bg-[#f3d9d6]"
              >
                Delete
              </button>
            </div>
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

      {editing && (
        <ConsultantFormModal
          initial={asRow}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); }}
        />
      )}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={doDelete}
        busy={delBusy}
        title="Delete consultant"
        message={`Delete ${c.name} and their ${c.courses.length} listed course${c.courses.length === 1 ? "" : "s"}? This cannot be undone.`}
      />
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
