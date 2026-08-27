import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { Field, SelectField, FormError } from "../../components/Field";
import type { OrgDepartment, PlannedSession, Staff } from "../../lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_TONE: Record<string, "green" | "amber" | "neutral"> = {
  Completed: "green",
  "In progress": "amber",
  Planned: "neutral",
};

/** Parse a session's display date (e.g. "18 Mar 2026") into a Date. */
function parseDate(s: string): Date | null {
  const d = new Date(s);
  return isNaN(+d) ? null : d;
}

/** Format a Date as YYYY-MM-DD (to compare against a date input). */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OrgAnnualPlan() {
  const [sessions, setSessions] = useState<PlannedSession[] | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [allocFor, setAllocFor] = useState<PlannedSession | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateF, setDateF] = useState("");
  const [monthF, setMonthF] = useState("All");
  const [yearF, setYearF] = useState("All");
  const [statusF, setStatusF] = useState("All");

  function load() {
    api.get<{ sessions: PlannedSession[] }>("/organization/planned-sessions").then((r) => setSessions(r.sessions)).catch(() => setError("Could not load the annual plan"));
  }
  useEffect(() => {
    load();
    api.get<{ staff: Staff[] }>("/organization/staff").then((r) => setStaff(r.staff)).catch(() => {});
    api.get<{ departments: OrgDepartment[] }>("/organization/departments").then((r) => setDepartments(r.departments)).catch(() => {});
  }, []);

  const monthsPresent = useMemo(() => {
    const set = new Set((sessions ?? []).map((s) => s.month).filter(Boolean));
    return MONTHS.filter((m) => set.has(m));
  }, [sessions]);

  const yearsPresent = useMemo(() => {
    const set = new Set<number>();
    for (const s of sessions ?? []) {
      const d = parseDate(s.date);
      if (d) set.add(d.getFullYear());
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (sessions ?? []).filter((s) => {
      const d = parseDate(s.date);
      if (dateF) {
        if (!d || isoDate(d) !== dateF) return false;
      }
      if (yearF !== "All" && (!d || String(d.getFullYear()) !== yearF)) return false;
      if (monthF !== "All" && s.month !== monthF) return false;
      if (statusF !== "All" && s.status !== statusF) return false;
      if (q && !`${s.course} ${s.provider} ${s.dept} ${s.sector}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sessions, search, dateF, monthF, yearF, statusF]);

  const grouped = useMemo(() => {
    const map = new Map<number, { yr: number; mi: number; items: PlannedSession[] }>();
    for (const s of filtered) {
      const d = parseDate(s.date);
      const mi = MONTHS.indexOf(s.month);
      const idx = mi === -1 ? 12 : mi;
      const yr = d ? d.getFullYear() : 0;
      const key = yr * 100 + idx;
      const g = map.get(key) ?? { yr, mi: idx, items: [] };
      g.items.push(s);
      map.set(key, g);
    }
    return Array.from(map.values()).sort((a, b) => a.yr - b.yr || a.mi - b.mi);
  }, [filtered]);

  async function advance(s: PlannedSession) {
    setBusy(s.id);
    try {
      await api.patch(`/organization/planned-sessions/${s.id}`, { advanceStatus: true });
      load();
    } finally {
      setBusy(null);
    }
  }

  async function toggleStaff(sessionId: string, staffId: string) {
    await api.patch(`/organization/planned-sessions/${sessionId}`, { toggleStaff: staffId });
    const r = await api.get<{ sessions: PlannedSession[] }>("/organization/planned-sessions");
    setSessions(r.sessions);
    setAllocFor((cur) => (cur ? r.sessions.find((x) => x.id === cur.id) ?? null : null));
  }

  if (error) return <EmptyState title={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Annual training calendar</h1>
          <p className="mt-2 text-muted">Plan training across the year — including future dates — with delivery details, cost and allocated staff.</p>
        </div>
        <button onClick={() => setShowScheduler(true)} className="btn-primary">+ Schedule training</button>
      </div>

      {!sessions ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-line" />)}</div>
      ) : sessions.length === 0 ? (
        <EmptyState title="No sessions planned yet" hint="Schedule your first training session to build the annual plan." />
      ) : (
        <>
          <div className="card space-y-3 p-4">
            <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a training, provider or department…" />
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="block">
                <span className="field-label">On date</span>
                <input type="date" className="field" value={dateF} onChange={(e) => setDateF(e.target.value)} />
              </label>
              <label className="block">
                <span className="field-label">Month</span>
                <select className="field" value={monthF} onChange={(e) => setMonthF(e.target.value)}>
                  <option value="All">All months</option>
                  {monthsPresent.map((m) => <option key={m} value={m}>{MONTH_FULL[MONTHS.indexOf(m)]}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Year</span>
                <select className="field" value={yearF} onChange={(e) => setYearF(e.target.value)}>
                  <option value="All">All years</option>
                  {yearsPresent.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Status</span>
                <select className="field" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
                  {["All", "Planned", "In progress", "Completed"].map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
                </select>
              </label>
            </div>
            {(dateF || monthF !== "All" || yearF !== "All" || statusF !== "All" || search) && (
              <button
                onClick={() => { setSearch(""); setDateF(""); setMonthF("All"); setYearF("All"); setStatusF("All"); }}
                className="text-[13px] font-semibold text-teal hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No sessions match these filters" hint="Try a different month, status or search term." />
          ) : (
          <div className="space-y-8">
          {grouped.map((g) => (
            <div key={`${g.yr}-${g.mi}`}>
              <div className="label-caps mb-3 text-muted">{g.mi === 12 ? "Unscheduled" : `${MONTH_FULL[g.mi]} ${g.yr || ""}`}</div>
              <div className="space-y-4">
                {g.items.map((s) => (
                  <SessionCard key={s.id} s={s} busy={busy === s.id} onAllocate={() => setAllocFor(s)} onAdvance={() => advance(s)} />
                ))}
              </div>
            </div>
          ))}
          </div>
          )}
        </>
      )}

      <AllocateModal
        session={allocFor}
        staff={staff}
        onClose={() => setAllocFor(null)}
        onToggle={toggleStaff}
      />

      {showScheduler && (
        <SchedulerModal
          departments={departments}
          onClose={() => setShowScheduler(false)}
          onSaved={() => { setShowScheduler(false); load(); }}
        />
      )}
    </div>
  );
}

function money(cost: number): string {
  return cost > 0 ? `UGX ${cost.toLocaleString("en-US")}` : "No cost";
}

function SessionCard({ s, busy, onAllocate, onAdvance }: { s: PlannedSession; busy: boolean; onAllocate: () => void; onAdvance: () => void }) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#EDF1F1] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">{s.mode}</span>
            <span className="text-[12.5px] font-medium text-muted">{s.dept} · {s.sector}</span>
            <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status}</Badge>
          </div>
          <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{s.course}</h3>
          {s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}
          <div className="mt-3 space-y-1 text-[13px] text-muted">
            {s.mode === "Online"
              ? <div>💻 {s.platform}{s.link ? ` · ${s.link}` : ""}</div>
              : <div>📍 {[s.venue, s.address].filter(Boolean).join(", ")}</div>}
            <div>🗓 {s.date} · {s.time} · {s.provider} ({s.providerType})</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[15px] font-semibold text-ink">{money(s.cost)}</div>
          <div className="text-[11.5px] text-muted">{s.costBasis}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="label-caps text-muted">Allocated staff · {s.allocated.length} of {s.capacity}</div>
          <div className="flex gap-2">
            <button onClick={onAllocate} className="btn-ghost px-3.5 py-1.5 text-[13px]">Allocate staff</button>
            <button onClick={onAdvance} disabled={busy || s.status === "Completed"} className="btn-teal px-3.5 py-1.5 text-[13px] disabled:opacity-50">Advance status</button>
          </div>
        </div>
        {s.allocated.length === 0 ? (
          <p className="mt-2 text-[13px] text-faint">No staff allocated yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {s.allocated.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1F1] px-3 py-1 text-[12.5px] text-ink">
                {a.name}{a.dept ? <span className="text-muted"> · {a.dept}</span> : null}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AllocateModal({ session, staff, onClose, onToggle }: { session: PlannedSession | null; staff: Staff[]; onClose: () => void; onToggle: (sessionId: string, staffId: string) => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!session) return null;
  const allocatedIds = new Set(session.allocated.map((a) => a.id));
  const full = session.allocated.length >= session.capacity;

  async function toggle(staffId: string) {
    setBusy(staffId);
    try { await onToggle(session!.id, staffId); } finally { setBusy(null); }
  }

  return (
    <Modal open={!!session} onClose={onClose} title={`Allocate staff · ${session.course}`}>
      <p className="text-[13px] text-muted">{session.allocated.length} of {session.capacity} allocated. Tap a staff member to allocate or remove.</p>
      <div className="mt-4 space-y-2">
        {staff.map((m) => {
          const on = allocatedIds.has(m.id);
          const disabled = busy === m.id || (!on && full);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              disabled={disabled}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition disabled:opacity-50 ${on ? "border-teal bg-teal-soft" : "border-line bg-white hover:border-line-strong"}`}
            >
              <span>
                <span className="text-sm font-medium text-ink">{m.name}</span>
                {m.profession && <span className="text-[12.5px] text-muted"> · {m.profession}</span>}
              </span>
              <span className={`text-[13px] font-semibold ${on ? "text-teal" : "text-muted"}`}>{on ? "✓ Allocated" : "Allocate"}</span>
            </button>
          );
        })}
        {staff.length === 0 && <p className="text-sm text-muted">No staff on the register yet.</p>}
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="btn-primary px-4 py-2">Done</button>
      </div>
    </Modal>
  );
}

function SchedulerModal({ departments, onClose, onSaved }: { departments: OrgDepartment[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    course: "", dept: departments[0]?.name ?? "Finance", sector: departments[0]?.sectors[0] ?? "",
    mode: "Physical", venue: "", address: "", platform: "", link: "", access: "",
    cost: "", costBasis: "Per participant", provider: "", providerType: "External",
    date: "", time: "", capacity: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const sectors = departments.find((d) => d.name === f.dept)?.sectors ?? [];

  async function submit() {
    if (!f.course || !f.date) { setErr("Course and date are required."); return; }
    setBusy(true); setErr(null);
    try {
      await api.post("/organization/planned-sessions", {
        ...f, cost: Number(f.cost) || 0, capacity: Number(f.capacity) || 0,
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not schedule the session");
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Schedule a training session">
      <div className="space-y-4">
        <Field label="Course / topic" value={f.course} onChange={set("course")} placeholder="IFRS Update 2026" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Department" value={f.dept} onChange={(v) => setF((s) => ({ ...s, dept: v, sector: departments.find((d) => d.name === v)?.sectors[0] ?? "" }))} options={departments.map((d) => d.name)} />
          <SelectField label="Sector" value={f.sector} onChange={set("sector")} options={sectors} />
        </div>
        <SelectField label="Mode of delivery" value={f.mode} onChange={set("mode")} options={["Physical", "Online"]} />
        {f.mode === "Physical" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venue name" value={f.venue} onChange={set("venue")} optional />
            <Field label="Address" value={f.address} onChange={set("address")} optional />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Platform" value={f.platform} onChange={set("platform")} optional />
            <Field label="Link" value={f.link} onChange={set("link")} optional />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cost (UGX)" value={f.cost} onChange={set("cost")} type="number" optional />
          <SelectField label="Cost basis" value={f.costBasis} onChange={set("costBasis")} options={["Per participant", "Total for session", "Internal (no cost)"]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Provider type" value={f.providerType} onChange={set("providerType")} options={["External", "Internal"]} />
          <Field label="Training provider" value={f.provider} onChange={set("provider")} optional />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="No. of staff" value={f.capacity} onChange={set("capacity")} type="number" optional />
          <Field label="Date" value={f.date} onChange={set("date")} type="date" required />
          <Field label="Time" value={f.time} onChange={set("time")} placeholder="09:00–16:00" optional />
        </div>
        <FormError>{err}</FormError>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn-primary px-5">{busy ? "Adding…" : "Add to calendar"}</button>
        </div>
      </div>
    </Modal>
  );
}
