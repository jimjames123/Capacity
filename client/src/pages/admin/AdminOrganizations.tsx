import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { Field, FormError } from "../../components/Field";
import type { Organization } from "../../lib/types";

interface OrgForm {
  name: string;
  sector: string;
  district: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}
const EMPTY: OrgForm = { name: "", sector: "", district: "", contactName: "", contactEmail: "", contactPhone: "" };

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Organization | "new" | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  function load() {
    api
      .get<{ organizations: Organization[] }>("/admin/organizations")
      .then((r) => setOrgs(r.organizations))
      .catch(() => setError("Could not load organizations"));
  }
  useEffect(load, []);

  if (error) return <EmptyState title={error} />;
  if (!orgs) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Organizations</h1>
          <p className="mt-2 text-muted">
            {orgs.length} employers on the platform and their staff registers.
          </p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary">+ Add organization</button>
      </div>

      {orgs.length === 0 ? (
        <EmptyState title="No organizations yet" hint="Add the first employer to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orgs.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/admin/organizations/${o.id}`} className="min-w-0 flex-1">
                  <div className="truncate font-serif text-lg font-semibold text-ink hover:underline">
                    {o.name}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    {o.sector ?? "—"}{o.district ? ` · ${o.district}` : ""}
                  </div>
                </Link>
                <span className="shrink-0 rounded-full border border-line bg-[#EEF2F2] px-2.5 py-0.5 text-[12px] font-semibold text-muted">
                  {o.staffCount ?? 0} staff
                </span>
              </div>
              {o.contactName && (
                <div className="mt-3 text-[13px] text-muted">
                  {o.contactName}{o.contactEmail ? ` · ${o.contactEmail}` : ""}
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                <Link to={`/admin/organizations/${o.id}`} className="text-[13px] font-semibold text-teal hover:underline">
                  Manage staff →
                </Link>
                <div className="ml-auto flex gap-1">
                  <button onClick={() => setEditing(o)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
                  <button onClick={() => setDeleting(o)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-rust hover:bg-rust-soft">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <OrgFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <DeleteOrg org={deleting} onClose={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); }} />
      )}
    </div>
  );
}

export function OrgFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Organization | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<OrgForm>(
    initial
      ? {
          name: initial.name, sector: initial.sector ?? "", district: initial.district ?? "",
          contactName: initial.contactName ?? "", contactEmail: initial.contactEmail ?? "",
          contactPhone: initial.contactPhone ?? "",
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof OrgForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (isEdit && initial) await api.patch(`/admin/organizations/${initial.id}`, form);
      else await api.post("/admin/organizations", form);
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit organization" : "Add organization"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Organization name" value={form.name} onChange={set("name")} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sector" value={form.sector} onChange={set("sector")} optional placeholder="Public sector" />
          <Field label="District" value={form.district} onChange={set("district")} optional placeholder="Kampala" />
        </div>
        <Field label="Contact name" value={form.contactName} onChange={set("contactName")} optional />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" value={form.contactEmail} onChange={set("contactEmail")} optional />
          <Field label="Contact phone" value={form.contactPhone} onChange={set("contactPhone")} optional />
        </div>
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add organization"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteOrg({ org, onClose, onDone }: { org: Organization; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await api.del(`/admin/organizations/${org.id}`);
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
      title="Delete organization"
      message={`Delete ${org.name} and all its staff records? This cannot be undone.`}
    />
  );
}
