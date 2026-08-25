import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { FormError } from "../../components/Field";
import { formatDate } from "../../lib/format";
import type { OrgTenderRow } from "../../lib/types";

const TENDER_STATUS: Record<string, string> = {
  OPEN: "bg-green-soft text-green border border-green-line",
  AWARDED: "bg-[#EEF2F2] text-muted border border-line",
  CLOSED: "bg-rust-soft text-rust border border-rust-line",
};

export default function OrgTenders() {
  const [tenders, setTenders] = useState<OrgTenderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("All");

  function load() {
    api
      .get<{ tenders: OrgTenderRow[] }>("/organization/tenders")
      .then((r) => setTenders(r.tenders))
      .catch(() => setError("Could not load your tenders"));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (tenders ?? []).filter((t) => {
      if (statusF !== "All" && t.status !== statusF) return false;
      if (term && !`${t.title} ${t.category} ${t.deliveryMode}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [tenders, q, statusF]);

  if (error) return <EmptyState title={error} />;
  if (!tenders) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">My tenders</h1>
          <p className="mt-2 text-muted">Training tenders you've posted, and the bids they've drawn.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">+ Post a tender</button>
      </div>

      {tenders.length > 0 && (
        <div className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
          <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tenders by title, category or delivery…" />
          <select className="field sm:w-44" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            {["All", "OPEN", "AWARDED", "CLOSED"].map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      )}

      {tenders.length === 0 ? (
        <EmptyState title="No tenders yet" hint="Post your first tender to invite bids from providers." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No tenders match these filters" hint="Try a different status or search term." />
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => (
            <Link key={t.id} to={`/org/tenders/${t.id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-semibold text-ink">{t.title}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TENDER_STATUS[t.status] ?? ""}`}>{t.status}</span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted">{t.category} · {t.deliveryMode} · {t.seats} participants</div>
                </div>
                <Badge tone="teal">{t.bidCount} bid{t.bidCount === 1 ? "" : "s"}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 border-t border-line pt-3 text-[13px] text-muted">
                <span className="font-semibold text-ink">{t.budget}</span>
                <span>Closes {formatDate(t.deadline)}</span>
                <span className="ml-auto font-semibold text-teal">Review bids →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {creating && <CreateTender onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
    </div>
  );
}

interface TenderForm {
  title: string; description: string; category: string; deliveryMode: string;
  budget: string; seats: string; deadline: string;
}

function CreateTender({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<TenderForm>({
    title: "", description: "", category: "HR", deliveryMode: "Flexible",
    budget: "", seats: "20", deadline: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof TenderForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.post("/organization/tenders", {
        title: form.title, description: form.description, category: form.category,
        deliveryMode: form.deliveryMode, budget: form.budget,
        seats: Number(form.seats), deadline: form.deadline,
      });
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not post tender");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Post a tender">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="field-label">Title</span>
          <input className="field" value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="Leadership development for 40 managers" required />
        </label>
        <label className="block">
          <span className="field-label">Description</span>
          <textarea className="field min-h-[90px] resize-y" value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="What does your team need? Scope, audience, outcomes." required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Category</span>
            <select className="field" value={form.category} onChange={(e) => set("category")(e.target.value)}>
              {["HR", "Finance", "Engineering", "Marketing", "Cross-industry"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Delivery</span>
            <select className="field" value={form.deliveryMode} onChange={(e) => set("deliveryMode")(e.target.value)}>
              {["Flexible", "In-person", "Online", "Hybrid"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">Budget</span>
            <input className="field" value={form.budget} onChange={(e) => set("budget")(e.target.value)} placeholder="UGX 40,000,000" required />
          </label>
          <label className="block">
            <span className="field-label">Participants</span>
            <input type="number" className="field" value={form.seats} onChange={(e) => set("seats")(e.target.value)} required />
          </label>
          <label className="block">
            <span className="field-label">Deadline</span>
            <input type="date" className="field" value={form.deadline} onChange={(e) => set("deadline")(e.target.value)} required />
          </label>
        </div>
        {err && <FormError>{err}</FormError>}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Posting…" : "Post tender"}</button>
        </div>
      </form>
    </Modal>
  );
}
