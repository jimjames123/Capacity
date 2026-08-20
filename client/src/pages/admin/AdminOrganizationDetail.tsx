import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { Field, SelectField, FormError } from "../../components/Field";
import { OrgFormModal } from "./AdminOrganizations";
import type { Organization, Staff } from "../../lib/types";

const PROFESSIONS = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

interface StaffForm {
  name: string;
  email: string;
  jobTitle: string;
  profession: string;
  membershipNo: string;
}
const EMPTY: StaffForm = { name: "", email: "", jobTitle: "", profession: "HR", membershipNo: "" };

export default function AdminOrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editOrg, setEditOrg] = useState(false);
  const [staffEditing, setStaffEditing] = useState<Staff | "new" | null>(null);
  const [staffDeleting, setStaffDeleting] = useState<Staff | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<{ organization: Organization }>(`/admin/organizations/${id}`)
      .then((r) => setOrg(r.organization))
      .catch(() => setError("Organization not found"));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <EmptyState title={error} />;
  if (!org) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const staff = org.staff ?? [];

  return (
    <div className="space-y-6">
      <Link to="/admin/organizations" className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to organizations
      </Link>

      {/* Org header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">{org.name}</h1>
            <div className="mt-1 text-sm text-muted">
              {org.sector ?? "—"}{org.district ? ` · ${org.district}` : ""}
            </div>
          </div>
          <button onClick={() => setEditOrg(true)} className="btn-ghost">Edit details</button>
        </div>
        {(org.contactName || org.contactEmail || org.contactPhone) && (
          <div className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
            <Detail label="Contact" value={org.contactName} />
            <Detail label="Email" value={org.contactEmail} />
            <Detail label="Phone" value={org.contactPhone} />
          </div>
        )}
      </div>

      {/* Staff */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-ink">
          Staff <span className="text-muted">({staff.length})</span>
        </h2>
        <button onClick={() => setStaffEditing("new")} className="btn-primary">+ Add staff</button>
      </div>

      {staff.length === 0 ? (
        <EmptyState title="No staff yet" hint="Add the organization's employees to track their CPD." />
      ) : (
        <div className="card divide-y divide-line">
          {staff.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EDF1F1] font-semibold text-muted">
                {initials(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-ink">{s.name}</div>
                <div className="text-[12.5px] text-muted">
                  {s.jobTitle ?? "—"}
                  {s.profession ? ` · ${s.profession}` : ""}
                  {s.membershipNo ? ` · ${s.membershipNo}` : ""}
                </div>
              </div>
              {s.email && <div className="hidden text-[13px] text-muted sm:block">{s.email}</div>}
              <div className="flex gap-1">
                <button onClick={() => setStaffEditing(s)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
                <button onClick={() => setStaffDeleting(s)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-rust hover:bg-rust-soft">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editOrg && (
        <OrgFormModal initial={org} onClose={() => setEditOrg(false)} onSaved={() => { setEditOrg(false); load(); }} />
      )}
      {staffEditing && (
        <StaffFormModal
          orgId={org.id}
          initial={staffEditing === "new" ? null : staffEditing}
          onClose={() => setStaffEditing(null)}
          onSaved={() => { setStaffEditing(null); load(); }}
        />
      )}
      {staffDeleting && (
        <DeleteStaff staff={staffDeleting} onClose={() => setStaffDeleting(null)} onDone={() => { setStaffDeleting(null); load(); }} />
      )}
    </div>
  );
}

function StaffFormModal({
  orgId,
  initial,
  onClose,
  onSaved,
}: {
  orgId: string;
  initial: Staff | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<StaffForm>(
    initial
      ? {
          name: initial.name, email: initial.email ?? "", jobTitle: initial.jobTitle ?? "",
          profession: initial.profession ?? "HR", membershipNo: initial.membershipNo ?? "",
        }
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
      if (isEdit && initial) await api.patch(`/admin/staff/${initial.id}`, form);
      else await api.post(`/admin/organizations/${orgId}/staff`, form);
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

function DeleteStaff({ staff, onClose, onDone }: { staff: Staff; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await api.del(`/admin/staff/${staff.id}`);
      onDone();
    } catch {
      setBusy(false);
    }
  }
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={confirm}
      busy={busy}
      title="Remove staff member"
      message={`Remove ${staff.name} from this organization?`}
      confirmLabel="Remove"
    />
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-1 text-ink">{value ?? "—"}</div>
    </div>
  );
}
function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}
