import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { Field, FormError } from "../../components/Field";
import { BID_STATUS_META, formatDate } from "../../lib/format";
import type { Bid, Tender } from "../../lib/types";

interface ConsultantLite { id: string; name: string; initials: string; type: string; verified: boolean; meta: string | null }

export default function ProviderTenderDetail() {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [myBid, setMyBid] = useState<Bid | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [docName, setDocName] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "draft" | "submit">(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recommending, setRecommending] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<{ tender: Tender; myBid: Bid | null }>(`/provider/tenders/${id}`)
      .then((r) => {
        setTender(r.tender);
        setMyBid(r.myBid);
        if (r.myBid) {
          setAmount(r.myBid.amount);
          setProposal(r.myBid.proposal);
          setDocName(r.myBid.docFileName);
        }
      })
      .catch(() => setError("Tender not found"));
  }, [id]);
  useEffect(load, [load]);

  async function save(submit: boolean) {
    if (!id) return;
    setBusy(submit ? "submit" : "draft");
    setFormErr(null);
    setNotice(null);
    try {
      await api.post(`/provider/tenders/${id}/bids`, {
        amount, proposal, docFileName: docName ?? undefined, submit,
      });
      setNotice(submit ? "Bid submitted." : "Draft saved.");
      load();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : "Could not save your bid");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!tender) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <Link to="/provider/tenders" className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to tender board
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Tender details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <Badge tone="teal">{tender.category}</Badge>
              <span className="text-[13px] text-muted">Closes {formatDate(tender.deadline)}</span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink">{tender.title}</h1>
            <div className="mt-1 text-sm text-muted">
              {tender.organization.name}
              {tender.organization.sector ? ` · ${tender.organization.sector}` : ""}
              {tender.organization.district ? ` · ${tender.organization.district}` : ""}
            </div>
            <p className="mt-4 leading-relaxed text-[#2E3B3F]">{tender.description}</p>
          </div>

          <div className="card grid grid-cols-3 gap-4 p-5">
            <Detail label="Budget" value={tender.budget} />
            <Detail label="Delivery" value={tender.deliveryMode} />
            <Detail label="Participants" value={String(tender.seats)} />
          </div>

          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="font-serif text-[15px] font-semibold text-ink">Not your specialism?</div>
              <p className="text-[13px] text-muted">Pass this tender on to a consultant on the platform — e.g. in a different sector.</p>
            </div>
            <button onClick={() => setRecommending(true)} className="btn-ghost px-4 py-2">↗ Recommend to a consultant</button>
          </div>
        </div>

        {/* Bid form */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">Your bid</h2>
              {myBid && (
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${BID_STATUS_META[myBid.status]?.className ?? ""}`}>
                  {BID_STATUS_META[myBid.status]?.label ?? myBid.status}
                </span>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save(true); }} className="mt-4 space-y-4">
              <Field label="Bid amount" value={amount} onChange={setAmount} placeholder="UGX 20,000,000" required />
              <label className="block">
                <span className="field-label">Proposal</span>
                <textarea
                  className="field min-h-[120px] resize-y"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  placeholder="Outline your approach, experience, and what's included."
                  required
                />
              </label>
              <div>
                <span className="field-label">Supporting document</span>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-line-strong bg-panel px-3.5 py-3 transition hover:border-teal">
                  <span className="text-sm text-ink">{docName ?? "Attach a proposal (PDF)"}</span>
                  {docName ? (
                    <span className="text-[13px] font-semibold text-rust" onClick={(e) => { e.preventDefault(); setDocName(null); }}>Remove</span>
                  ) : (
                    <span className="text-[13px] font-semibold text-teal">Browse</span>
                  )}
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setDocName(e.target.files?.[0]?.name ?? null)} />
                </label>
              </div>

              {formErr && <FormError>{formErr}</FormError>}
              {notice && <div className="rounded-lg border border-green-line bg-green-soft px-3.5 py-2.5 text-sm text-green">{notice}</div>}

              <div className="flex gap-3">
                <button type="submit" disabled={busy !== null} className="btn-teal flex-1 py-3">
                  {busy === "submit" ? "Submitting…" : myBid && myBid.status !== "DRAFT" ? "Update bid" : "Submit bid"}
                </button>
                <button type="button" onClick={() => save(false)} disabled={busy !== null} className="btn-ghost">
                  {busy === "draft" ? "Saving…" : "Save draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {recommending && tender && (
        <RecommendModal tenderId={tender.id} tenderTitle={tender.title} onClose={() => setRecommending(false)} />
      )}
    </div>
  );
}

function RecommendModal({ tenderId, tenderTitle, onClose }: { tenderId: string; tenderTitle: string; onClose: () => void }) {
  const [consultants, setConsultants] = useState<ConsultantLite[] | null>(null);
  const [toId, setToId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get<{ consultants: ConsultantLite[] }>("/provider/consultants").then((r) => setConsultants(r.consultants)).catch(() => setConsultants([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!toId) { setErr("Choose a consultant to recommend to."); return; }
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/provider/tenders/${tenderId}/recommend`, { toProviderId: toId, note });
      setSent(true);
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not send the recommendation");
      setBusy(false);
    }
  }

  const chosen = consultants?.find((c) => c.id === toId);

  return (
    <Modal open onClose={onClose} title={sent ? "Recommendation sent" : "Recommend this tender"}>
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            We've let <span className="font-semibold text-ink">{chosen?.name ?? "the consultant"}</span> know about
            <span className="font-semibold text-ink"> {tenderTitle}</span>. It'll appear in their notifications.
          </p>
          <div className="flex justify-end"><button onClick={onClose} className="btn-primary px-4 py-2">Done</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl bg-[#F3F6F6] p-3.5 text-[13px] text-muted">Recommending <span className="font-semibold text-ink">{tenderTitle}</span></div>
          <label className="block">
            <span className="field-label">Recommend to</span>
            {!consultants ? (
              <div className="h-11 animate-pulse rounded-xl bg-line" />
            ) : (
              <select className="field" value={toId} onChange={(e) => setToId(e.target.value)}>
                <option value="">Choose a consultant…</option>
                {consultants.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.type}{c.verified ? "" : " (pending)"}</option>
                ))}
              </select>
            )}
          </label>
          <label className="block">
            <span className="field-label">Note <span className="font-normal text-muted">(optional)</span></span>
            <textarea className="field min-h-[80px] resize-y" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this is a good fit for them…" />
          </label>
          <FormError>{err}</FormError>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? "Sending…" : "Send recommendation"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
    </div>
  );
}
