import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { Field, SelectField, FormError } from "../../components/Field";
import type { Staff } from "../../lib/types";

const PROFESSIONS = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

interface StaffForm {
  name: string;
  email: string;
  jobTitle: string;
  profession: string;
  membershipNo: string;
}
const EMPTY: StaffForm = { name: "", email: "", jobTitle: "", profession: "HR", membershipNo: "" };

export default function OrgStaff() {
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [deleting, setDeleting] = useState<Staff | null>(null);
  const [q, setQ] = useState("");

  function load() {
    api
      .get<{ staff: Staff[] }>("/organization/staff")
      .then((r) => setStaff(r.staff))
      .catch(() => setError("Could not load staff"));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || !staff) return staff ?? [];
    return staff.filter((s) =>
      `${s.name} ${s.jobTitle ?? ""} ${s.profession ?? ""} ${s.membershipNo ?? ""} ${s.email ?? ""}`.toLowerCase().includes(term),
    );
  }, [staff, q]);

  if (error) return <EmptyState title={error} />;
  if (!staff) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Staff</h1>
          <p className="mt-2 text-muted">{staff.length} people on your register.</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary">+ Add staff</button>
      </div>

      {staff.length > 0 && (
        <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff by name, role, profession or membership no.…" />
      )}

      {staff.length === 0 ? (
        <EmptyState title="No staff yet" hint="Add your team members to track their professions and CPD." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No staff match your search" hint="Try a different name, role or profession." />
      ) : (
        <div className="card divide-y divide-line">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EDF1F1] font-semibold text-muted">
                {initials(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-ink">{s.name}</div>
                <div className="text-[12.5px] text-muted">
                  {s.jobTitle ?? "—"}{s.profession ? ` · ${s.profession}` : ""}{s.membershipNo ? ` · ${s.membershipNo}` : ""}
                </div>
              </div>
              {s.email && <div className="hidden text-[13px] text-muted sm:block">{s.email}</div>}
              <div className="flex gap-1">
                <button onClick={() => setEditing(s)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
                <button onClick={() => setDeleting(s)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-rust hover:bg-rust-soft">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <StaffFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <DeleteStaff s={deleting} onClose={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); }} />
      )}
    </div>
  );
}

function StaffFormModal({ initial, onClose, onSaved }: { initial: Staff | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [form, setForm] = useState<StaffForm>(
    initial
      ? { name: initial.name, email: initial.email ?? "", jobTitle: initial.jobTitle ?? "", profession: initial.profession ?? "HR", membershipNo: initial.membershipNo ?? "" }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof StaffForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (isEdit && initial) await api.patch(`/organization/staff/${initial.id}`, form);
      else await api.post("/organization/staff", form);
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit staff member" : "Add staff member"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" value={form.name} onChange={set("name")} required />
        <Field label="Email" type="email" value={form.email} onChange={set("email")} optional />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" value={form.jobTitle} onChange={set("jobTitle")} optional />
          <SelectField label="Profession" value={form.profession} onChange={set("profession")} options={PROFESSIONS} />
        </div>
        <Field label="Membership no." value={form.membershipNo} onChange={set("membershipNo")} optional />
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add staff"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteStaff({ s, onClose, onDone }: { s: Staff; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await api.del(`/organization/staff/${s.id}`);
      onDone();
    } catch {
      setBusy(false);
    }
  }
  return (
    <ConfirmDialog open onClose={onClose} onConfirm={confirm} busy={busy} title="Remove staff member" message={`Remove ${s.name} from your register?`} confirmLabel="Remove" />
  );
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}
