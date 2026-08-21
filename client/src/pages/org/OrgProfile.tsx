import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { Field, FormError } from "../../components/Field";
import type { Organization } from "../../lib/types";

export default function OrgProfile() {
  const [form, setForm] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ organization: Organization }>("/organization/profile")
      .then((r) => setForm(r.organization))
      .catch(() => setError("Could not load your profile"));
  }, []);

  function set<K extends keyof Organization>(k: K, v: Organization[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setFormErr(null);
    setNotice(null);
    try {
      await api.patch("/organization/profile", {
        name: form.name, sector: form.sector ?? "", district: form.district ?? "",
        contactName: form.contactName ?? "", contactEmail: form.contactEmail ?? "", contactPhone: form.contactPhone ?? "",
      });
      setNotice("Profile saved.");
    } catch (e2) {
      setFormErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!form) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/org" className="text-sm font-semibold text-muted hover:text-ink">← Back to home</Link>
      <h1 className="mt-3 font-serif text-3xl font-bold text-ink">Organization profile</h1>
      <p className="mt-2 text-muted">
        Keep your details current so consultants and the professional body can reach you.
      </p>

      <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
        <Field label="Organization name" value={form.name} onChange={(v) => set("name", v)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sector" value={form.sector ?? ""} onChange={(v) => set("sector", v)} optional />
          <Field label="District" value={form.district ?? ""} onChange={(v) => set("district", v)} optional />
        </div>
        <Field label="Contact name" value={form.contactName ?? ""} onChange={(v) => set("contactName", v)} optional />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" value={form.contactEmail ?? ""} onChange={(v) => set("contactEmail", v)} optional />
          <Field label="Contact phone" value={form.contactPhone ?? ""} onChange={(v) => set("contactPhone", v)} optional />
        </div>
        <FormError>{formErr}</FormError>
        {notice && <div className="rounded-lg border border-green-line bg-green-soft px-3.5 py-2.5 text-sm text-green">{notice}</div>}
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save profile"}</button>
      </form>
    </div>
  );
}
