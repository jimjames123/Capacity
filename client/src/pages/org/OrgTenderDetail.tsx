import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { Badge, EmptyState, Stars } from "../../components/ui";
import { BID_STATUS_META, formatDate } from "../../lib/format";
import type { OrgTenderDetail, ReceivedBid } from "../../lib/types";

const TENDER_STATUS: Record<string, string> = {
  OPEN: "bg-green-soft text-green border border-green-line",
  AWARDED: "bg-[#EEF2F2] text-muted border border-line",
  CLOSED: "bg-rust-soft text-rust border border-rust-line",
};

export default function OrgTenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<OrgTenderDetail | null>(null);
  const [bids, setBids] = useState<ReceivedBid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [blind, setBlind] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<{ tender: OrgTenderDetail; bids: ReceivedBid[] }>(`/organization/tenders/${id}`)
      .then((r) => { setTender(r.tender); setBids(r.bids); })
      .catch(() => setError("Tender not found"));
  }, [id]);
  useEffect(load, [load]);

  async function decide(bid: ReceivedBid, status: "SHORTLISTED" | "ACCEPTED" | "REJECTED") {
    setBusyId(bid.id);
    try {
      await api.patch(`/organization/bids/${bid.id}`, { status });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!tender) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const awarded = tender.status === "AWARDED";

  return (
    <div className="space-y-6">
      <Link to="/org/tenders" className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to my tenders
      </Link>

      {/* Tender header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge tone="teal">{tender.category}</Badge>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TENDER_STATUS[tender.status] ?? ""}`}>{tender.status}</span>
            </div>
            <h1 className="mt-3 font-serif text-2xl font-bold text-ink">{tender.title}</h1>
            <p className="mt-2 leading-relaxed text-[#2E3B3F]">{tender.description}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4 text-sm">
          <Detail label="Budget" value={tender.budget} />
          <Detail label="Delivery" value={tender.deliveryMode} />
          <Detail label="Closes" value={formatDate(tender.deadline)} />
        </div>
      </div>

      {/* Bids */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-ink">
          Received bids <span className="text-muted">({bids.length})</span>
        </h2>
        {bids.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} className="h-4 w-4 accent-teal" />
            Blind review (hide bidder identity)
          </label>
        )}
      </div>

      {bids.length === 0 ? (
        <EmptyState title="No bids yet" hint="Providers' submitted bids will appear here for you to review." />
      ) : (
        <div className="space-y-4">
          {bids.map((b, i) => {
            const meta = BID_STATUS_META[b.status];
            const decided = b.status === "ACCEPTED" || b.status === "REJECTED";
            return (
              <div key={b.id} className={`card p-5 ${b.status === "ACCEPTED" ? "ring-2 ring-green" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink font-serif font-bold text-white">
                      {blind ? String.fromCharCode(65 + i) : b.provider.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-ink">
                        {blind ? `Bidder ${String.fromCharCode(65 + i)}` : b.provider.name}
                        {!blind && b.provider.verified && <span className="text-[11px] font-semibold text-green">✓ Verified</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
                        {blind ? "Identity hidden" : (
                          <><Stars value={b.provider.rating} /> {b.provider.rating.toFixed(1)} · {b.provider.type}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-lg font-bold text-ink">{b.amount}</div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${meta?.className ?? ""}`}>{meta?.label ?? b.status}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#2E3B3F]">{b.proposal}</p>
                {b.docFileName && !blind && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#EDF1F1] px-2.5 py-1 text-[12.5px] text-muted">📎 {b.docFileName}</div>
                )}
                {!awarded && !decided && (
                  <div className="mt-4 flex gap-2 border-t border-line pt-3">
                    <button onClick={() => decide(b, "ACCEPTED")} disabled={busyId === b.id} className="btn-teal px-4 py-2 text-[13px]">Accept &amp; award</button>
                    <button onClick={() => decide(b, "SHORTLISTED")} disabled={busyId === b.id} className="btn-ghost px-4 py-2 text-[13px]">
                      {b.status === "SHORTLISTED" ? "Shortlisted" : "Shortlist"}
                    </button>
                    <button onClick={() => decide(b, "REJECTED")} disabled={busyId === b.id} className="btn border border-rust-line bg-rust-soft px-4 py-2 text-[13px] text-rust hover:bg-[#f3d9d6]">Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
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
