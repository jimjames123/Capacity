import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { BID_STATUS_META, formatDate } from "../../lib/format";
import type { TenderBoardItem } from "../../lib/types";

export default function ProviderTenders() {
  const [tenders, setTenders] = useState<TenderBoardItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ tenders: TenderBoardItem[] }>("/provider/tenders")
      .then((r) => setTenders(r.tenders))
      .catch(() => setError("Could not load the tender board"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!tenders) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Tender board</h1>
        <p className="mt-2 text-muted">
          Open training tenders from organisations. Submit a bid to be considered.
        </p>
      </div>

      {tenders.length === 0 ? (
        <EmptyState title="No open tenders right now" hint="Check back soon — new tenders appear here." />
      ) : (
        <div className="space-y-4">
          {tenders.map((t) => (
            <Link
              key={t.id}
              to={`/provider/tenders/${t.id}`}
              className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-semibold text-ink">{t.title}</span>
                    {t.myBidStatus && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${BID_STATUS_META[t.myBidStatus]?.className ?? ""}`}>
                        Your bid: {BID_STATUS_META[t.myBidStatus]?.label ?? t.myBidStatus}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    {t.organization.name}{t.organization.district ? ` · ${t.organization.district}` : ""}
                  </div>
                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted">{t.description}</p>
                </div>
                <Badge tone="teal">{t.category}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3 text-[13px] text-muted">
                <span className="font-semibold text-ink">{t.budget}</span>
                <span>{t.deliveryMode}</span>
                <span>{t.seats} participants</span>
                <span>Closes {formatDate(t.deadline)}</span>
                <span className="ml-auto font-semibold text-teal">
                  {t.myBidStatus ? "View / edit bid →" : "Submit a bid →"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
