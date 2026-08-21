import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import type { Booking } from "../../lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DOT: Record<string, string> = {
  SCHEDULED: "bg-amber-strong",
  COMPLETED: "bg-green",
  CANCELLED: "bg-rust",
};

export default function OrgCalendar() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ bookings: Booking[] }>("/organization/bookings").then((r) => setBookings(r.bookings)).catch(() => setError("Could not load the calendar"));
  }, []);

  const year = useMemo(() => {
    if (!bookings || bookings.length === 0) return new Date().getFullYear();
    return new Date(bookings[0].date).getFullYear();
  }, [bookings]);

  const byMonth = useMemo(() => {
    const map: Record<number, Booking[]> = {};
    for (const b of bookings ?? []) {
      const m = new Date(b.date).getMonth();
      (map[m] = map[m] ?? []).push(b);
    }
    return map;
  }, [bookings]);

  if (error) return <EmptyState title={error} />;
  if (!bookings) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  const totalCostNote = `${bookings.length} planned session${bookings.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Annual training calendar · {year}</h1>
        <p className="mt-2 text-muted">All planned training for the year, with delivery details and allocated staff. {totalCostNote}.</p>
      </div>

      <div className="flex flex-wrap gap-4 text-[12.5px] text-muted">
        <Legend cls="bg-amber-strong" label="Scheduled" />
        <Legend cls="bg-green" label="Completed" />
        <Legend cls="bg-rust" label="Cancelled" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((m, i) => {
          const items = byMonth[i] ?? [];
          return (
            <div key={m} className={`card p-4 ${items.length === 0 ? "opacity-60" : ""}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="label-caps">{m} {year}</div>
                {items.length > 0 && <span className="text-[12px] font-semibold text-muted">{items.length}</span>}
              </div>
              {items.length === 0 ? (
                <div className="py-3 text-[13px] text-faint">No sessions</div>
              ) : (
                <ul className="space-y-2">
                  {items.map((b) => (
                    <li key={b.id} className="rounded-lg bg-[#F3F6F6] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${DOT[b.status] ?? "bg-faint"}`} />
                        <span className="truncate text-[13px] font-medium text-ink">{b.title}</span>
                      </div>
                      <div className="mt-0.5 pl-3.5 text-[11.5px] text-muted">
                        {new Date(b.date).getDate()} {m} · {b.staffCount} staff · {b.cost}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${cls}`} /> {label}
    </span>
  );
}
