import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { EmptyState, ProgressRing } from "../../components/ui";
import type { AdminMemberRow } from "../../lib/types";

export default function AdminMembers() {
  const [members, setMembers] = useState<AdminMemberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get<{ members: AdminMemberRow[] }>("/admin/members")
      .then((r) => setMembers(r.members))
      .catch(() => setError("Could not load members"));
  }, []);

  const filtered = useMemo(() => {
    if (!members) return [];
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.membershipNo ?? "").toLowerCase().includes(term) ||
        (m.email ?? "").toLowerCase().includes(term),
    );
  }, [members, q]);

  if (error) return <EmptyState title={error} />;
  if (!members) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Members</h1>
          <p className="mt-2 text-muted">
            Everyone on the register and their current cycle progress.
          </p>
        </div>
        <input
          className="field max-w-xs"
          placeholder="Search name, membership no…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No members match your search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((m) => (
            <Link
              key={m.id}
              to={`/admin/members/${m.id}`}
              className="card flex items-center gap-5 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <ProgressRing percent={m.percentComplete} size={72} stroke={9}>
                <div className="text-center">
                  <div className="font-serif text-sm font-bold text-ink">
                    {m.percentComplete}%
                  </div>
                </div>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-lg font-semibold text-ink">
                  {m.name}
                </div>
                <div className="text-[12.5px] text-muted">
                  {m.membershipNo ?? m.email} · {m.profession ?? "—"}
                </div>
                <div className="mt-1.5 text-[13px] text-ink">
                  {round(m.earnedPoints)} / {m.requiredPoints} pts
                  {m.pendingCount > 0 && (
                    <span className="ml-2 rounded-full border border-amber-line bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber">
                      {m.pendingCount} to review
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}
