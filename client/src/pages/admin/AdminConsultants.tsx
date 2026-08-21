import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { EmptyState, Stars } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { Field, SelectField, FormError } from "../../components/Field";
import type { ConsultantRow } from "../../lib/types";

const TYPES = ["Training company", "Individual consultant", "Institution"];

interface ConsultantForm {
  name: string;
  type: string;
  meta: string;
  bio: string;
  rating: string;
  verified: boolean;
}
const EMPTY: ConsultantForm = { name: "", type: TYPES[0], meta: "", bio: "", rating: "0", verified: false };

export default function AdminConsultants() {
  const [rows, setRows] = useState<ConsultantRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ConsultantRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<ConsultantRow | null>(null);

  function load() {
    api
      .get<{ consultants: ConsultantRow[] }>("/admin/consultants")
      .then((r) => setRows(r.consultants))
      .catch(() => setError("Could not load consultants"));
  }
  useEffect(load, []);

  async function toggleVerify(c: ConsultantRow) {
    setRows((rs) => rs?.map((r) => (r.id === c.id ? { ...r, verified: !r.verified } : r)) ?? rs);
    try {
      await api.patch(`/admin/consultants/${c.id}`, { verified: !c.verified });
    } catch {
      load(); // revert on failure
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term) ||
        (r.meta ?? "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  if (error) return <EmptyState title={error} />;
  if (!rows) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Consultants &amp; providers</h1>
          <p className="mt-2 text-muted">
            {rows.length} trainers and individual consultants listing CPD-eligible courses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="field max-w-xs"
            placeholder="Search name, type, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={() => setEditing("new")} className="btn-primary whitespace-nowrap">
            + Add consultant
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No consultants match your search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <div key={c.id} className="card flex items-start gap-4 p-5">
              <Link to={`/admin/consultants/${c.id}`} className="flex min-w-0 flex-1 items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink font-serif font-bold text-white">
                  {c.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-serif text-lg font-semibold text-ink">{c.name}</span>
                    {c.verified ? (
                      <span className="shrink-0 text-[11px] font-semibold text-green">✓ Verified</span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-semibold text-amber">Pending</span>
                    )}
                  </div>
                  <div className="text-[12.5px] text-muted">{c.type}{c.meta ? ` · ${c.meta}` : ""}</div>
                  <div className="mt-2 flex items-center gap-2 text-[13px] text-muted">
                    <Stars value={c.rating} />
                    <span>{c.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>{c.courseCount} course{c.courseCount === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </Link>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => toggleVerify(c)}
                  className={`rounded-lg px-2.5 py-1 text-[12.5px] font-semibold ${
                    c.verified ? "text-amber hover:bg-amber-soft" : "text-green hover:bg-green-soft"
                  }`}
                >
                  {c.verified ? "Unverify" : "Verify"}
                </button>
                <button onClick={() => setEditing(c)} className="rounded-lg px-2.5 py-1 text-[12.5px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
                <button onClick={() => setDeleting(c)} className="rounded-lg px-2.5 py-1 text-[12.5px] font-semibold text-rust hover:bg-rust-soft">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ConsultantFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <DeleteConsultant c={deleting} onClose={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); }} />
      )}
    </div>
  );
}

export function ConsultantFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ConsultantRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ConsultantForm>(
    initial
      ? {
          name: initial.name, type: initial.type, meta: initial.meta ?? "",
          bio: initial.bio ?? "", rating: String(initial.rating), verified: initial.verified,
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof ConsultantForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const payload = {
      name: form.name,
      type: form.type,
      meta: form.meta,
      bio: form.bio,
      rating: Number(form.rating) || 0,
      verified: form.verified,
    };
    try {
      if (isEdit && initial) await api.patch(`/admin/consultants/${initial.id}`, payload);
      else await api.post("/admin/consultants", payload);
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit consultant" : "Add consultant"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" value={form.name} onChange={set("name")} required placeholder="Company or individual name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Type" value={form.type} onChange={set("type")} options={TYPES} />
          <Field label="Rating" type="number" value={form.rating} onChange={set("rating")} placeholder="0–5" />
        </div>
        <Field label="Location / meta" value={form.meta} onChange={set("meta")} optional placeholder="Kampala · 5 courses" />
        <label className="block">
          <span className="field-label">Bio <span className="font-normal text-muted">(optional)</span></span>
          <textarea
            className="field min-h-[80px] resize-y"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Short description of the provider."
          />
        </label>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={form.verified}
            onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
            className="h-4 w-4 accent-teal"
          />
          <span className="text-sm font-medium text-ink">Verified provider</span>
        </label>
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add consultant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConsultant({ c, onClose, onDone }: { c: ConsultantRow; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await api.del(`/admin/consultants/${c.id}`);
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
      title="Delete consultant"
      message={`Delete ${c.name} and their ${c.courseCount} listed course${c.courseCount === 1 ? "" : "s"}? This cannot be undone.`}
    />
  );
}
