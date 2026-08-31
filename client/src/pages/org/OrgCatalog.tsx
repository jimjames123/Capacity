import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { Field, FormError } from "../../components/Field";
import { pointsLabel } from "../../lib/format";
import type { CatalogSession, OrgDepartment } from "../../lib/types";

type Row = CatalogSession & { spotsLeft: number };

export default function OrgCatalog() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All departments");
  const [sector, setSector] = useState("All sectors");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<Record<string, string>>({});
  const [referring, setReferring] = useState<Row | null>(null);

  function load() {
    api.get<{ sessions: Row[] }>("/organization/catalog").then((r) => setRows(r.sessions)).catch(() => setError("Could not load the catalog"));
  }
  useEffect(() => {
    load();
    api.get<{ departments: OrgDepartment[] }>("/organization/departments").then((r) => setDepartments(r.departments)).catch(() => {});
  }, []);

  const sectorOptions = useMemo(() => {
    if (dept === "All departments") return Array.from(new Set(departments.flatMap((d) => d.sectors)));
    return departments.find((d) => d.name === dept)?.sectors ?? [];
  }, [dept, departments]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (dept !== "All departments" && r.dept !== dept) return false;
      if (sector !== "All sectors" && r.sector !== sector) return false;
      if (q && !(`${r.title} ${r.consultant}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, dept, sector]);

  async function book(r: Row, count: number) {
    setBusyId(r.id);
    setRowMsg((m) => ({ ...m, [r.id]: "" }));
    try {
      const res = await api.post<{ booked: number; spotsLeft: number }>(`/organization/catalog/${r.id}/book`, { count });
      setRows((list) => (list ? list.map((x) => (x.id === r.id ? { ...x, booked: x.capacity - res.spotsLeft, spotsLeft: res.spotsLeft } : x)) : list));
      setRowMsg((m) => ({ ...m, [r.id]: `Booked ${res.booked} · added to Bookings` }));
    } catch (e) {
      setRowMsg((m) => ({ ...m, [r.id]: e instanceof ApiError ? e.message : "Could not book" }));
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <EmptyState title={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Course catalog</h1>
        <p className="mt-2 text-muted">Verified courses from consultants. Filter by department or sector, then book staff. Spaces update in real time.</p>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-3">
        <label className="block">
          <span className="field-label">Search</span>
          <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Course or provider…" />
        </label>
        <label className="block">
          <span className="field-label">Department</span>
          <select className="field" value={dept} onChange={(e) => { setDept(e.target.value); setSector("All sectors"); }}>
            <option>All departments</option>
            {departments.map((d) => <option key={d.name}>{d.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Sector</span>
          <select className="field" value={sector} onChange={(e) => setSector(e.target.value)}>
            <option>All sectors</option>
            {sectorOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {!filtered ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-line" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No courses match these filters." hint="Try a different department or sector." />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const full = r.spotsLeft <= 0;
            return (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="teal">{pointsLabel(r.points)}</Badge>
                      <span className="text-[12.5px] font-medium text-muted">{r.dept} · {r.sector}</span>
                    </div>
                    <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{r.title}</h3>
                    <p className="mt-1 text-sm text-muted">{r.description}</p>
                    <div className="mt-2 text-[13px] text-teal">
                      {r.consultant} · {r.format} · {r.date} · {r.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[15px] font-semibold text-ink">{r.fee}</div>
                    <div className="mt-1">
                      {full
                        ? <Badge tone="rust">Fully booked</Badge>
                        : <Badge tone="green">{r.spotsLeft} of {r.capacity} spots left</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <button onClick={() => book(r, 1)} disabled={full || busyId === r.id} className="btn-primary px-4 py-2 disabled:opacity-50">Book an employee</button>
                  <button onClick={() => book(r, 5)} disabled={full || r.spotsLeft < 5 || busyId === r.id} className="btn-ghost px-4 py-2 disabled:opacity-50">Book a group (5)</button>
                  <button onClick={() => setReferring(r)} className="ml-auto rounded-lg px-3 py-2 text-[13px] font-semibold text-teal hover:bg-[#EDF1F1]">↗ Refer a peer</button>
                  {rowMsg[r.id] && <span className="w-full text-[12.5px] font-medium text-green sm:w-auto">{rowMsg[r.id]}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {referring && <ReferModal row={referring} onClose={() => setReferring(null)} />}
    </div>
  );
}

function ReferModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const [peerName, setPeerName] = useState("");
  const [peerEmail, setPeerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const subject = `A course you might find useful: ${row.title}`;
  const body = `Hi${peerName ? " " + peerName : ""},\n\nI thought this course could be useful for your CPD:\n\n${row.title} — ${row.consultant}\n${row.dept} · ${row.sector} · ${pointsLabel(row.points)} · ${row.fee}\n${row.format} · ${row.date} · ${row.location}\n${message ? "\n" + message + "\n" : ""}\nYou can explore it on Capacity Lane: ${shareUrl}`;
  const mailto = `mailto:${encodeURIComponent(peerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/organization/catalog/${row.id}/refer`, { peerName, peerEmail, message });
      setSent(true);
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not send the referral");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${row.title} — ${row.consultant} · ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={sent ? "Referral shared" : "Refer a peer"}>
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            We've noted your referral of <span className="font-semibold text-ink">{row.title}</span>
            {peerEmail ? <> to <span className="font-semibold text-ink">{peerEmail}</span></> : null}. Send it on directly:
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={mailto} className="btn-primary px-4 py-2">Open email</a>
            <button onClick={copyLink} className="btn-ghost px-4 py-2">{copied ? "Copied ✓" : "Copy course link"}</button>
          </div>
          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="btn-ghost">Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl bg-[#F3F6F6] p-3.5">
            <div className="font-serif text-[15px] font-semibold text-ink">{row.title}</div>
            <div className="text-[12.5px] text-muted">{row.consultant} · {pointsLabel(row.points)} · {row.fee}</div>
          </div>
          <Field label="Peer's name" value={peerName} onChange={setPeerName} placeholder="Jane Doe" optional />
          <Field label="Peer's email" type="email" value={peerEmail} onChange={setPeerEmail} placeholder="jane@example.com" required />
          <label className="block">
            <span className="field-label">Personal note <span className="font-normal text-muted">(optional)</span></span>
            <textarea className="field min-h-[80px] resize-y" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Thought this would be great for your CPD…" />
          </label>
          <FormError>{err}</FormError>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? "Sending…" : "Refer course"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
