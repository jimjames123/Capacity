import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { Field, SelectField, FormError } from "../../components/Field";
import { formatDate } from "../../lib/format";
import type { Booking } from "../../lib/types";

const CATEGORIES = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

const STATUS_META: Record<string, string> = {
  SCHEDULED: "bg-amber-soft text-amber border border-amber-line",
  COMPLETED: "bg-green-soft text-green border border-green-line",
  CANCELLED: "bg-rust-soft text-rust border border-rust-line",
};

export default function OrgBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    api.get<{ bookings: Booking[] }>("/organization/bookings").then((r) => setBookings(r.bookings)).catch(() => setError("Could not load bookings"));
  }
  useEffect(load, []);

  async function patch(b: Booking, body: Record<string, unknown>) {
    setBusyId(b.id);
    try {
      await api.patch(`/organization/bookings/${b.id}`, body);
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!bookings) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Bookings &amp; records</h1>
          <p className="mt-2 text-muted">Track bookings, payments, attendance and certificates.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">+ New booking</button>
      </div>

      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" hint="Book a course or record an in-house session." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-semibold text-ink">{b.title}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_META[b.status] ?? ""}`}>{b.status}</span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted">
                    {b.providerName ?? "—"} · {b.staffCount} staff{b.category ? ` · ${b.category}` : ""} · {formatDate(b.date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ink">{b.cost}</div>
                  <div className="text-[12px] text-muted">{b.paid ? "Paid" : "Unpaid"}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[12.5px]">
                <span className={b.certificateIssued ? "text-green" : "text-muted"}>
                  {b.certificateIssued ? "✓ Certificates issued" : "Certificates pending"}
                </span>
                {b.attendance != null && <span className="text-muted">· {b.attendance}/{b.staffCount} attended</span>}
                <div className="ml-auto flex gap-1">
                  {!b.paid && b.status !== "CANCELLED" && (
                    <button onClick={() => patch(b, { paid: true })} disabled={busyId === b.id} className="rounded-lg px-2.5 py-1 font-semibold text-teal hover:bg-[#EDF1F1]">Mark paid</button>
                  )}
                  {b.status === "SCHEDULED" && (
                    <button onClick={() => patch(b, { status: "COMPLETED", attendance: b.staffCount, certificateIssued: true })} disabled={busyId === b.id} className="rounded-lg px-2.5 py-1 font-semibold text-green hover:bg-green-soft">Mark completed</button>
                  )}
                  <button onClick={() => setDeleting(b)} className="rounded-lg px-2.5 py-1 font-semibold text-rust hover:bg-rust-soft">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <NewBooking onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
      {deleting && (
        <DeleteBooking b={deleting} onClose={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); }} />
      )}
    </div>
  );
}

function NewBooking({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", providerName: "", category: "HR", staffCount: "10", date: "", cost: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.post("/organization/bookings", {
        title: form.title, providerName: form.providerName || undefined, category: form.category,
        staffCount: Number(form.staffCount), date: form.date, cost: form.cost,
      });
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="New booking">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Training title" value={form.title} onChange={set("title")} required />
        <Field label="Provider" value={form.providerName} onChange={set("providerName")} optional />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Category" value={form.category} onChange={set("category")} options={CATEGORIES} />
          <Field label="Staff" type="number" value={form.staffCount} onChange={set("staffCount")} required />
          <Field label="Date" type="date" value={form.date} onChange={set("date")} required />
        </div>
        <Field label="Cost" value={form.cost} onChange={set("cost")} placeholder="UGX 2,800,000" required />
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : "Add booking"}</button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteBooking({ b, onClose, onDone }: { b: Booking; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try { await api.del(`/organization/bookings/${b.id}`); onDone(); } catch { setBusy(false); }
  }
  return <ConfirmDialog open onClose={onClose} onConfirm={confirm} busy={busy} title="Delete booking" message={`Delete the booking for “${b.title}”?`} />;
}
