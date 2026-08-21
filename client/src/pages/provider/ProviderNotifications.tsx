import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/format";
import type { Bid, ProviderCourse, TenderBoardItem } from "../../lib/types";

interface Notice {
  icon: string;
  title: string;
  meta: string;
  tone: "green" | "amber" | "rust" | "muted";
  to?: string;
  ts: number;
}

export default function ProviderNotifications() {
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ bids: Bid[] }>("/provider/bids"),
      api.get<{ courses: ProviderCourse[] }>("/provider/courses"),
      api.get<{ tenders: TenderBoardItem[] }>("/provider/tenders"),
    ])
      .then(([b, c, t]) => setNotices(build(b.bids, c.courses, t.tenders)))
      .catch(() => setError("Could not load notifications"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!notices) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Notifications</h1>
        <p className="mt-2 text-muted">New tenders, deadlines, shortlist decisions and listing approvals.</p>
      </div>

      {notices.length === 0 ? (
        <EmptyState title="You're all caught up" hint="New activity on your bids and listings shows here." />
      ) : (
        <div className="card divide-y divide-line">
          {notices.map((n, i) => {
            const dot = { green: "bg-green-soft text-green", amber: "bg-amber-soft text-amber", rust: "bg-rust-soft text-rust", muted: "bg-[#EDF1F1] text-muted" }[n.tone];
            const inner = (
              <div className="flex items-start gap-3 p-4">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base ${dot}`}>{n.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink">{n.title}</div>
                  <div className="text-[12.5px] text-muted">{n.meta}</div>
                </div>
                {n.to && <span className="shrink-0 text-[13px] font-semibold text-teal">View →</span>}
              </div>
            );
            return n.to ? (
              <Link key={i} to={n.to} className="block transition hover:bg-[#F6F9F9]">{inner}</Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function build(bids: Bid[], courses: ProviderCourse[], tenders: TenderBoardItem[]): Notice[] {
  const out: Notice[] = [];

  for (const b of bids) {
    if (b.status === "ACCEPTED") out.push({ icon: "🎉", tone: "green", title: `Your bid was accepted`, meta: `${b.tender.title} · ${b.tender.organizationName}`, to: `/provider/tenders/${b.tender.id}`, ts: +new Date(b.createdAt) + 3 });
    else if (b.status === "SHORTLISTED") out.push({ icon: "⭐", tone: "amber", title: `You were shortlisted`, meta: `${b.tender.title} · ${b.tender.organizationName}`, to: `/provider/tenders/${b.tender.id}`, ts: +new Date(b.createdAt) + 2 });
    else if (b.status === "REJECTED") out.push({ icon: "✕", tone: "rust", title: `A bid was not selected`, meta: `${b.tender.title} · ${b.tender.organizationName}`, to: `/provider/tenders/${b.tender.id}`, ts: +new Date(b.createdAt) + 1 });
    else if (b.status === "DRAFT") out.push({ icon: "📝", tone: "muted", title: `Draft bid not yet submitted`, meta: `${b.tender.title} · closes ${formatDate(b.tender.deadline)}`, to: `/provider/tenders/${b.tender.id}`, ts: +new Date(b.createdAt) });
  }

  for (const c of courses) {
    if (c.status === "APPROVED") out.push({ icon: "✓", tone: "green", title: `“${c.title}” was approved`, meta: `Now live in the marketplace`, to: `/provider/courses`, ts: Date.now() - 86400000 });
    else if (c.status === "PENDING") out.push({ icon: "⏳", tone: "amber", title: `“${c.title}” is awaiting approval`, meta: `The professional body will review it`, to: `/provider/courses`, ts: Date.now() - 43200000 });
    else if (c.status === "REJECTED") out.push({ icon: "✕", tone: "rust", title: `“${c.title}” was not approved`, meta: `Update the listing and resubmit`, to: `/provider/courses`, ts: Date.now() - 43200000 });
  }

  for (const t of tenders) {
    if (!t.myBidStatus) out.push({ icon: "📢", tone: "muted", title: `Open tender: ${t.title}`, meta: `${t.organization.name} · ${t.budget} · closes ${formatDate(t.deadline)}`, to: `/provider/tenders/${t.id}`, ts: +new Date(t.deadline) - 10 * 86400000 });
  }

  return out.sort((a, b) => b.ts - a.ts);
}
