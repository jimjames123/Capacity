import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { EmptyState } from "../../components/ui";
import type { AdminStats } from "../../lib/types";

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ stats: AdminStats }>("/admin/overview")
      .then((r) => setStats(r.stats))
      .catch(() => setError("Could not load the overview"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!stats) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">
          {user?.professionalBody ?? "Professional body"}
        </h1>
        <p className="mt-1 text-muted">
          Verify member CPD, issue certificates, and keep the register current.
        </p>
      </div>

      {/* Action tiles */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          to="/admin/queue"
          className="card flex items-center justify-between p-6 transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <div>
            <div className="label-caps">Awaiting your review</div>
            <div className="mt-2 font-serif text-4xl font-bold text-ink">
              {stats.awaitingReview}
            </div>
            <div className="mt-1 text-sm text-muted">
              {stats.needsProof} more waiting on member proof
            </div>
          </div>
          <span className="btn-primary">Open queue →</span>
        </Link>

        <Link
          to="/admin/members"
          className="card flex items-center justify-between p-6 transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <div>
            <div className="label-caps">Registered members</div>
            <div className="mt-2 font-serif text-4xl font-bold text-ink">
              {stats.members}
            </div>
            <div className="mt-1 text-sm text-muted">
              {stats.certificatesIssued} certificate{stats.certificatesIssued === 1 ? "" : "s"} issued
            </div>
          </div>
          <span className="btn-ghost">View members →</span>
        </Link>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Stat label="Verified entries" value={stats.verified} tone="green" />
        <Stat label="Pending review" value={stats.awaitingReview} tone="amber" />
        <Stat label="Needs proof" value={stats.needsProof} tone="rust" />
        <Stat label="Rejected" value={stats.rejected} tone="muted" />
        <Stat label="Members" value={stats.members} tone="muted" />
        <Stat label="Consultants" value={stats.providers} tone="muted" to="/admin/consultants" />
        <Stat label="Courses" value={stats.courses} tone="muted" />
        <Stat label="Certificates" value={stats.certificatesIssued} tone="green" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  to,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "rust" | "muted";
  to?: string;
}) {
  const accent = {
    green: "text-green",
    amber: "text-amber",
    rust: "text-rust",
    muted: "text-ink",
  }[tone];
  const body = (
    <>
      <div className="label-caps">{label}</div>
      <div className={`mt-2 font-serif text-3xl font-bold ${accent}`}>{value}</div>
    </>
  );
  if (to) {
    return (
      <Link to={to} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
        {body}
      </Link>
    );
  }
  return <div className="card p-5">{body}</div>;
}
