import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Badge, EmptyState, Stars } from "../components/ui";
import { Modal } from "../components/Modal";
import { FormError } from "../components/Field";
import { FORMAT_META, formatDate, pointsLabel } from "../lib/format";
import type { Course, CourseFormat, MyInquiry } from "../lib/types";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollState, setEnrollState] = useState<
    "idle" | "busy" | "done" | "already"
  >("idle");
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [myInquiry, setMyInquiry] = useState<MyInquiry | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);

  function loadInquiry() {
    if (!id) return;
    api.get<{ inquiry: MyInquiry | null }>(`/courses/${id}/my-inquiry`).then((r) => setMyInquiry(r.inquiry)).catch(() => {});
  }
  useEffect(() => {
    if (!id) return;
    api
      .get<{ course: Course }>(`/courses/${id}`)
      .then((r) => setCourse(r.course))
      .catch(() => setError("Course not found"));
    loadInquiry();
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
            {course.seats <= 0 ? (
              <>
                <div className="mt-6 rounded-xl border border-rust-line bg-rust-soft px-3.5 py-2.5 text-center text-[13px] font-semibold text-rust">Fully booked</div>
                <button onClick={() => setShowInquiry(true)} className="btn-primary mt-3 w-full py-3">Join the waitlist / ask a question</button>
              </>
            ) : (
              <>
                <button
                  onClick={enroll}
                  disabled={enrollState === "busy" || enrollState === "done" || enrollState === "already"}
                  className="btn-teal mt-6 w-full py-3"
                >
                  {enrollLabel}
                </button>
                {enrollState === "idle" && (
                  <button onClick={() => setShowInquiry(true)} className="mt-3 w-full text-center text-[13px] font-semibold text-teal hover:underline">Have a question? Ask the provider</button>
                )}
              </>
            )}
            {enrollError && (
              <div className="mt-3 rounded-lg border border-rust-line bg-rust-soft px-3 py-2 text-[13px] text-rust">
                {enrollError}
              </div>
            )}
            {(enrollState === "done" || enrollState === "already") && (
              <>
                <Link to={`/app/courses/${course.id}`} className="btn-primary mt-3 block w-full py-2.5 text-center text-[13px]">
                  Go to my course →
                </Link>
                <p className="mt-3 text-center text-[13px] text-green">
                  On completion, this counts as {pointsLabel(course.points)} toward your cycle.
                </p>
              </>
            )}
            {myInquiry && (
              <div className="mt-4 rounded-xl border border-line bg-[#F6F9F9] p-3.5 text-[13px]">
                <div className="font-semibold text-ink">{myInquiry.waitlist ? "You're on the waitlist" : "Your question was sent"}</div>
                <p className="mt-1 italic text-muted">“{myInquiry.message}”</p>
                {myInquiry.status === "ANSWERED" && myInquiry.response ? (
                  <div className="mt-2 rounded-lg border border-line bg-white p-2.5">
                    <div className="text-[11px] font-semibold text-teal">{course.provider.name} replied · {myInquiry.respondedAt ? formatDate(myInquiry.respondedAt) : ""}</div>
                    <p className="mt-0.5 text-muted">{myInquiry.response}</p>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[12px] font-medium text-amber">Awaiting a reply from {course.provider.name}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInquiry && (
        <InquiryModal
          courseId={course.id}
          providerName={course.provider.name}
          full={course.seats <= 0}
          onClose={() => setShowInquiry(false)}
          onSent={() => { setShowInquiry(false); loadInquiry(); }}
        />
      )}
    </div>
  );
}

function InquiryModal({ courseId, providerName, full, onClose, onSent }: { courseId: string; providerName: string; full: boolean; onClose: () => void; onSent: () => void }) {
  const [message, setMessage] = useState(full ? "Please add me to the waitlist and let me know when a place opens up." : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { setErr("Add a short message."); return; }
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/courses/${courseId}/inquire`, { message: message.trim(), waitlist: full });
      onSent();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not send your enquiry");
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={full ? "Join the waitlist" : "Ask the provider"}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">
          {full
            ? `This course is fully booked. Send ${providerName} a message and we'll notify you if a place opens or a new cohort is scheduled.`
            : `Send ${providerName} a question about this course. They'll reply and you'll see it here.`}
        </p>
        <label className="block">
          <span className="field-label">Your message</span>
          <textarea className="field min-h-[110px] resize-y" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. When is the next intake? Is there an evening option?" />
        </label>
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Sending…" : full ? "Join waitlist" : "Send question"}</button>
        </div>
      </form>
    </Modal>
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
