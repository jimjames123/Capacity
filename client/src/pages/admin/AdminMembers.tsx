import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { EmptyState, ProgressRing } from "../../components/ui";
import { Modal, ConfirmDialog } from "../../components/Modal";
import { Field, SelectField, FormError } from "../../components/Field";
import type { AdminMemberRow } from "../../lib/types";

const PROFESSIONS = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

interface MemberForm {
  name: string;
  email: string;
  profession: string;
  membershipNo: string;
  professionalBody: string;
  jobTitle: string;
  organisation: string;
}

const EMPTY: MemberForm = {
  name: "", email: "", profession: "HR", membershipNo: "",
  professionalBody: "", jobTitle: "", organisation: "",
};

export default function AdminMembers() {
  const [members, setMembers] = useState<AdminMemberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [editing, setEditing] = useState<AdminMemberRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminMemberRow | null>(null);

  function load() {
    api
      .get<{ members: AdminMemberRow[] }>("/admin/members")
      .then((r) => setMembers(r.members))
      .catch(() => setError("Could not load members"));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!members) return [];
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.membershipNo ?? "").toLowerCase().includes(term) ||
        (m.email ?? "").toLowerCase().includes(term),
    );
  }, [members, q]);

  if (error) return <EmptyState title={error} />;
  if (!members) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Members</h1>
          <p className="mt-2 text-muted">
            {members.length} registered · manage records and cycle progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="field max-w-xs"
            placeholder="Search name, membership no…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={() => setEditing("new")} className="btn-primary whitespace-nowrap">
            + Add member
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No members match your search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((m) => (
            <div key={m.id} className="card flex items-center gap-4 p-5">
              <Link to={`/admin/members/${m.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <ProgressRing percent={m.percentComplete} size={64} stroke={8}>
                  <div className="font-serif text-xs font-bold text-ink">{m.percentComplete}%</div>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-serif text-lg font-semibold text-ink">{m.name}</div>
                  <div className="text-[12.5px] text-muted">
                    {m.membershipNo ?? m.email} · {m.profession ?? "—"}
                  </div>
                  <div className="mt-1 text-[13px] text-ink">
                    {round(m.earnedPoints)} / {m.requiredPoints} pts
                    {m.pendingCount > 0 && (
                      <span className="ml-2 rounded-full border border-amber-line bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber">
                        {m.pendingCount} to review
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setEditing(m)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-teal hover:bg-[#EDF1F1]">Edit</button>
                <button onClick={() => setDeleting(m)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-rust hover:bg-rust-soft">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <MemberFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {deleting && (
        <DeleteMember
          member={deleting}
          onClose={() => setDeleting(null)}
          onDone={() => { setDeleting(null); load(); }}
        />
      )}
    </div>
  );
}

function MemberFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: AdminMemberRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<MemberForm>(
    initial
      ? {
          name: initial.name, email: initial.email, profession: initial.profession ?? "HR",
          membershipNo: initial.membershipNo ?? "", professionalBody: initial.professionalBody ?? "",
          jobTitle: "", organisation: "",
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof MemberForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (isEdit && initial) {
        await api.patch(`/admin/members/${initial.id}`, form);
      } else {
        await api.post("/admin/members", form);
      }
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit member" : "Add member"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" value={form.name} onChange={set("name")} required />
        <Field label="Email" type="email" value={form.email} onChange={set("email")} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Profession" value={form.profession} onChange={set("profession")} options={PROFESSIONS} />
          <Field label="Membership no." value={form.membershipNo} onChange={set("membershipNo")} optional placeholder="HRM-2024-0417" />
        </div>
        <Field label="Professional body" value={form.professionalBody} onChange={set("professionalBody")} optional />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" value={form.jobTitle} onChange={set("jobTitle")} optional />
          <Field label="Organisation" value={form.organisation} onChange={set("organisation")} optional />
        </div>
        {!isEdit && (
          <p className="text-[12.5px] text-muted">
            A starting CPD cycle is created automatically. Default password:{" "}
            <code className="rounded bg-[#EDF1F1] px-1">password123</code>
          </p>
        )}
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteMember({
  member,
  onClose,
  onDone,
}: {
  member: AdminMemberRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await api.del(`/admin/members/${member.id}`);
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
      title="Delete member"
      message={`Remove ${member.name} and all their CPD entries and cycles? This cannot be undone.`}
    />
  );
}

function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}
