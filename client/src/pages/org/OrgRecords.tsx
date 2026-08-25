import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/format";
import type { Booking } from "../../lib/types";

export default function OrgRecords() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get<{ bookings: Booking[] }>("/organization/bookings").then((r) => setBookings(r.bookings)).catch(() => setError("Could not load records"));
  }, []);

  const completed = useMemo(
    () => (bookings ?? []).filter((b) => b.status === "COMPLETED").sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [bookings],
  );

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? completed.filter((b) => `${b.title} ${b.providerName ?? ""} ${b.category ?? ""}`.toLowerCase().includes(term)) : completed;
  }, [completed, q]);

  if (error) return <EmptyState title={error} />;
  if (!bookings) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Training activity records</h1>
        <p className="mt-2 text-muted">
          Post-training actuals — dates, cost, attendance, completion and outcomes.
          Private to your organisation.
        </p>
      </div>

      {completed.length > 0 && (
        <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search records by training, provider or category…" />
      )}

      {completed.length === 0 ? (
        <EmptyState title="No completed training yet" hint="Once a booking is marked completed, its record appears here." />
      ) : visible.length === 0 ? (
        <EmptyState title="No records match your search" />
      ) : (
        <div className="space-y-4">
          {visible.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-lg font-semibold text-ink">{b.title}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{b.providerName ?? "—"}{b.category ? ` · ${b.category}` : ""}</div>
                </div>
                {b.certificateIssued && <span className="rounded-full border border-green-line bg-green-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-green">Certificates issued</span>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                <Cell label="Actual date" value={formatDate(b.date)} />
                <Cell label="Actual cost" value={b.cost} />
                <Cell label="Attendance" value={b.attendance != null ? `${b.attendance} / ${b.staffCount}` : "—"} />
                <Cell label="Payment" value={b.paid ? "Paid" : "Outstanding"} />
              </div>
              {b.outcome && <p className="mt-3 text-sm text-muted"><span className="font-semibold text-ink">Outcome:</span> {b.outcome}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
