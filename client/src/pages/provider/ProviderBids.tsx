import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { ConfirmDialog } from "../../components/Modal";
import { BID_STATUS_META, formatDate } from "../../lib/format";
import type { Bid } from "../../lib/types";

export default function ProviderBids() {
  const [bids, setBids] = useState<Bid[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdraw, setWithdraw] = useState<Bid | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api
      .get<{ bids: Bid[] }>("/provider/bids")
      .then((r) => setBids(r.bids))
      .catch(() => setError("Could not load your bids"));
  }
  useEffect(load, []);

  async function doWithdraw() {
    if (!withdraw) return;
    setBusy(true);
    try {
      await api.del(`/provider/bids/${withdraw.id}`);
      setWithdraw(null);
      load();
    } catch {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title={error} />;
  if (!bids) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">My bids</h1>
        <p className="mt-2 text-muted">Every tender you've bid on, with its current status.</p>
      </div>

      {bids.length === 0 ? (
        <EmptyState title="No bids yet" hint="Head to the tender board to submit your first bid." />
      ) : (
        <div className="card divide-y divide-line">
          {bids.map((b) => {
            const meta = BID_STATUS_META[b.status];
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/provider/tenders/${b.tender.id}`} className="truncate font-medium text-ink hover:underline">
                    {b.tender.title}
                  </Link>
                  <div className="text-[12.5px] text-muted">
                    {b.tender.organizationName} · {b.tender.category} · closes {formatDate(b.tender.deadline)}
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink">{b.amount}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${meta?.className ?? ""}`}>
                  {meta?.label ?? b.status}
                </span>
                <div className="flex gap-1">
                  <Link to={`/provider/tenders/${b.tender.id}`} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-teal hover:bg-[#EDF1F1]">
                    {b.status === "DRAFT" ? "Edit" : "View"}
                  </Link>
                  <button onClick={() => setWithdraw(b)} className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-rust hover:bg-rust-soft">
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!withdraw}
        onClose={() => setWithdraw(null)}
        onConfirm={doWithdraw}
        busy={busy}
        title="Withdraw bid"
        message={withdraw ? `Withdraw your bid on “${withdraw.tender.title}”? This cannot be undone.` : ""}
        confirmLabel="Withdraw"
      />
    </div>
  );
}
