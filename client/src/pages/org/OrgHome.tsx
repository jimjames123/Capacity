import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import type { OrgStats, Organization } from "../../lib/types";

interface HomeData {
  organization: Organization | null;
  stats: OrgStats;
}

export default function OrgHome() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HomeData>("/organization/home")
      .then(setData)
      .catch(() => setError("Could not load your dashboard"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  const { organization, stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">{organization?.name}</h1>
          <div className="mt-1 text-sm text-muted">
            {organization?.sector ?? "Organization"}
            {organization?.district ? ` · ${organization.district}` : ""}
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/org/tenders" className="btn-primary">+ Post a tender</Link>
          <Link to="/org/profile" className="btn-ghost">Edit profile</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Staff" value={stats.staff} sub="on the register" to="/org/staff" />
        <Stat label="Open tenders" value={stats.openTenders} sub={`${stats.tenders} total`} to="/org/tenders" />
        <Stat label="Bids received" value={stats.receivedBids} sub="awaiting review" to="/org/tenders" />
        <Stat label="Awarded" value={stats.awarded} sub="tenders closed" to="/org/tenders" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link to="/org/tenders" className="card block p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
          <div className="font-serif text-lg font-semibold text-ink">Commission training</div>
          <p className="mt-1.5 text-sm text-muted">
            Post a tender describing what your team needs, then review and award bids
            from verified providers.
          </p>
          <div className="mt-3 text-sm font-semibold text-teal">Manage tenders →</div>
        </Link>
        <Link to="/org/staff" className="card block p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
          <div className="font-serif text-lg font-semibold text-ink">Keep your team compliant</div>
          <p className="mt-1.5 text-sm text-muted">
            Maintain your staff register and see the professions represented across
            your organisation.
          </p>
          <div className="mt-3 text-sm font-semibold text-teal">Manage staff →</div>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, to }: { label: string; value: number; sub: string; to: string }) {
  return (
    <Link to={to} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="label-caps">{label}</div>
      <div className="mt-2 font-serif text-3xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-[12.5px] text-muted">{sub}</div>
    </Link>
  );
}
