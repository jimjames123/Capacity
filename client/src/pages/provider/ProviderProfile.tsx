import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { EmptyState, Stars } from "../../components/ui";
import { Field, SelectField, FormError } from "../../components/Field";
import type { ProviderProfileData } from "../../lib/types";

const TYPES = ["Individual consultant", "Institution", "Training company"];

export default function ProviderProfile() {
  const [profile, setProfile] = useState<ProviderProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "Individual consultant", meta: "", bio: "", qualifications: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    api
      .get<{ profile: ProviderProfileData }>("/provider/profile")
      .then((r) => {
        setProfile(r.profile);
        setForm({
          name: r.profile.name, type: r.profile.type, meta: r.profile.meta ?? "",
          bio: r.profile.bio ?? "", qualifications: r.profile.qualifications ?? "", website: r.profile.website ?? "",
        });
      })
      .catch(() => setError("Could not load your profile"));
  }
  useEffect(load, []);

  const set = (k: keyof typeof form) => (v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.patch("/provider/profile", form);
      setSaved(true);
      load();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save your profile");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!profile) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Profile</h1>
        <p className="mt-2 text-muted">
          How organisations see you in the consultant directory. Keep it current — it's
          your shopfront on the platform.
        </p>
      </div>

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink font-serif text-lg font-bold text-white">{profile.initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-xl font-semibold text-ink">{profile.name}</span>
            {profile.verified
              ? <span className="text-[12px] font-semibold text-green">✓ Verified</span>
              : <span className="text-[12px] font-semibold text-amber">Pending verification</span>}
          </div>
          <div className="text-[13px] text-muted">{profile.type}{profile.meta ? ` · ${profile.meta}` : ""}</div>
          {profile.rating > 0 && (
            <div className="mt-1 flex items-center gap-2 text-[13px] text-muted"><Stars value={profile.rating} /> {profile.rating.toFixed(1)}</div>
          )}
        </div>
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 text-[13px]">Visit website ↗</a>
        )}
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.name} onChange={set("name")} required />
          <SelectField label="Type" value={form.type} onChange={set("type")} options={TYPES} />
        </div>
        <Field label="Location / summary" value={form.meta} onChange={set("meta")} placeholder="Kampala · Independent" optional />
        <label className="block">
          <span className="field-label">Area of expertise</span>
          <textarea className="field min-h-[80px] resize-y" value={form.bio} onChange={(e) => set("bio")(e.target.value)} placeholder="What you train and who you work with." />
        </label>
        <label className="block">
          <span className="field-label">Notable qualifications / certifications</span>
          <textarea className="field min-h-[90px] resize-y" value={form.qualifications} onChange={(e) => set("qualifications")(e.target.value)} placeholder="e.g. PhD; Chartered MCIPD; ACCA-accredited; ICF PCC coach" />
        </label>
        <Field label="Website" type="url" value={form.website} onChange={set("website")} placeholder="https://your-practice.com" optional />
        <FormError>{err}</FormError>
        <div className="flex items-center justify-end gap-3 pt-1">
          {saved && <span className="text-[13px] font-medium text-green">Saved ✓</span>}
          <button type="submit" disabled={busy} className="btn-primary px-5">{busy ? "Saving…" : "Save profile"}</button>
        </div>
      </form>
    </div>
  );
}
