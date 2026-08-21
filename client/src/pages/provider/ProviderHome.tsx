import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Badge, EmptyState, Stars } from "../../components/ui";
import { BID_STATUS_META, formatDate } from "../../lib/format";
import type { Bid, ProviderProfile, ProviderStats } from "../../lib/types";

interface HomeData {
  provider: ProviderProfile | null;
  stats: ProviderStats;
  recentBids: Bid[];
}

export default function ProviderHome() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HomeData>("/provider/home")
      .then(setData)
      .catch(() => setError("Could not load your dashboard"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  const { provider, stats, recentBids } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">{provider?.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            {provider?.type}
            {provider?.verified && <Badge tone="green">✓ Verified provider</Badge>}
            {provider && (
              <span className="flex items-center gap-1.5">
                <Stars value={provider.rating} /> {provider.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/provider/courses" className="btn-primary">+ New course listing</Link>
          <Link to="/provider/tenders" className="btn-ghost">Browse tenders</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Course listings" value={stats.courses} sub={`${stats.approved} approved · ${stats.pending} pending`} />
        <Stat label="Total enrolments" value={stats.enrolments} sub="across your courses" />
        <Stat label="Open tenders" value={stats.openTenders} sub="available to bid" to="/provider/tenders" />
        <Stat label="My bids" value={stats.bids} sub={`${stats.submittedBids} submitted`} to="/provider/bids" />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">Recent bids</h2>
          <Link to="/provider/bids" className="text-sm font-semibold text-teal hover:underline">View all →</Link>
        </div>
        {recentBids.length === 0 ? (
          <EmptyState title="No bids yet" hint="Browse the tender board and submit your first bid." />
        ) : (
          <ul className="divide-y divide-line">
            {recentBids.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink">{b.tender.title}</div>
                  <div className="text-[12.5px] text-muted">
                    {b.tender.organizationName} · closes {formatDate(b.tender.deadline)}
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink">{b.amount}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${BID_STATUS_META[b.status]?.className ?? ""}`}>
                  {BID_STATUS_META[b.status]?.label ?? b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  to,
}: {
  label: string;
  value: number;
  sub: string;
  to?: string;
}) {
  const body = (
    <>
      <div className="label-caps">{label}</div>
      <div className="mt-2 font-serif text-3xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-[12.5px] text-muted">{sub}</div>
    </>
  );
  return to ? (
    <Link to={to} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">{body}</Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}
