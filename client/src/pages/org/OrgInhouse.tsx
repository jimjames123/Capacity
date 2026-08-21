import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { Field, SelectField, FormError } from "../../components/Field";

const CATEGORIES = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

export default function OrgInhouse() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("HR");
  const [details, setDetails] = useState("");
  const [participants, setParticipants] = useState("15");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.post("/organization/tenders", {
        title: topic,
        description: details,
        category,
        deliveryMode: "In-house",
        budget: budget || "Open to quotes",
        seats: Number(participants),
        deadline,
      });
      setDone(true);
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not send your request");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-soft text-2xl text-green">✓</div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-ink">Request sent</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Your in-house training request is now open on the tender board. Verified
            consultants can submit customized quotations, which you'll review under
            <strong className="text-ink"> My tenders</strong>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => navigate("/org/tenders")} className="btn-primary">View my tenders</button>
            <button onClick={() => { setDone(false); setTopic(""); setDetails(""); setBudget(""); setDeadline(""); }} className="btn-ghost">Send another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-3xl font-bold text-ink">Request in-house training</h1>
      <p className="mt-2 text-muted">
        Tell us what your team needs and receive customized quotations from verified
        consultants. This opens a tender that providers can bid on.
      </p>

      <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
        <Field label="Training topic" value={topic} onChange={setTopic} placeholder="e.g. Change management for finance teams" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
          <Field label="Participants" type="number" value={participants} onChange={setParticipants} required />
        </div>
        <label className="block">
          <span className="field-label">What does your team need?</span>
          <textarea className="field min-h-[110px] resize-y" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Scope, audience, outcomes, preferred dates or location." required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget" value={budget} onChange={setBudget} optional placeholder="UGX 10,000,000 (or leave open)" />
          <Field label="Respond by" type="date" value={deadline} onChange={setDeadline} required />
        </div>
        <FormError>{err}</FormError>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? "Sending…" : "Send request for quotations"}
        </button>
      </form>
    </div>
  );
}
