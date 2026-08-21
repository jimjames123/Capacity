import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { EmptyState, Stars } from "../../components/ui";
import type { ConsultantRow } from "../../lib/types";

export default function AdminConsultants() {
  const [rows, setRows] = useState<ConsultantRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get<{ consultants: ConsultantRow[] }>("/admin/consultants")
      .then((r) => setRows(r.consultants))
      .catch(() => setError("Could not load consultants"));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term) ||
        (r.meta ?? "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  if (error) return <EmptyState title={error} />;
  if (!rows) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Consultants &amp; providers</h1>
          <p className="mt-2 text-muted">
            {rows.length} trainers and individual consultants listing CPD-eligible
            courses on the platform.
          </p>
        </div>
        <input
          className="field max-w-xs"
          placeholder="Search name, type, location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No consultants match your search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/admin/consultants/${c.id}`}
              className="card flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink font-serif font-bold text-white">
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-serif text-lg font-semibold text-ink">{c.name}</span>
                  {c.verified ? (
                    <span className="shrink-0 text-[11px] font-semibold text-green">✓ Verified</span>
                  ) : (
                    <span className="shrink-0 text-[11px] font-semibold text-amber">Pending</span>
                  )}
                </div>
                <div className="text-[12.5px] text-muted">{c.type}{c.meta ? ` · ${c.meta}` : ""}</div>
                <div className="mt-2 flex items-center gap-2 text-[13px] text-muted">
                  <Stars value={c.rating} />
                  <span>{c.rating.toFixed(1)}</span>
                  <span>·</span>
                  <span>{c.courseCount} course{c.courseCount === 1 ? "" : "s"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
