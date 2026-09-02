import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/format";
import type { ProviderInquiry } from "../../lib/types";

export default function ProviderInquiries() {
  const [items, setItems] = useState<ProviderInquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<{ inquiries: ProviderInquiry[] }>("/provider/inquiries").then((r) => setItems(r.inquiries)).catch(() => setError("Could not load inquiries"));
  }
  useEffect(load, []);

  if (error) return <EmptyState title={error} />;
  if (!items) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  const open = items.filter((i) => i.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Inquiries</h1>
        <p className="mt-2 text-muted">
          Questions and waitlist requests from professionals about your courses
          {open > 0 ? ` — ${open} awaiting a reply.` : "."}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No inquiries yet" hint="When someone asks about a course or joins a waitlist, it shows here." />
      ) : (
        <div className="space-y-4">
          {items.map((q) => <InquiryCard key={q.id} q={q} onReplied={load} />)}
        </div>
      )}
    </div>
  );
}

function InquiryCard({ q, onReplied }: { q: ProviderInquiry; onReplied: () => void }) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    if (!reply.trim()) { setErr("Write a reply."); return; }
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/provider/inquiries/${q.id}/reply`, { response: reply.trim() });
      onReplied();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not send reply");
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-lg font-semibold text-ink">{q.courseTitle}</span>
            {q.waitlist && <Badge tone="amber">Waitlist</Badge>}
            {q.status === "ANSWERED" ? <Badge tone="green">Answered</Badge> : <Badge tone="rust">Awaiting reply</Badge>}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">{q.fromName}{q.fromEmail ? ` · ${q.fromEmail}` : ""} · {formatDate(q.createdAt)}</div>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-[#F3F6F6] p-3.5 text-sm text-ink">“{q.message}”</p>

      {q.status === "ANSWERED" && q.response ? (
        <div className="mt-3 rounded-xl border border-green-line bg-green-soft p-3.5">
          <div className="text-[11.5px] font-semibold text-green">Your reply · {q.respondedAt ? formatDate(q.respondedAt) : ""}</div>
          <p className="mt-1 text-sm text-ink">{q.response}</p>
        </div>
      ) : (
        <div className="mt-3">
          <textarea className="field min-h-[80px] resize-y" value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${q.fromName}…`} />
          {err && <p className="mt-1 text-[13px] text-rust">{err}</p>}
          <div className="mt-2 flex justify-end">
            <button onClick={send} disabled={busy} className="btn-primary px-4 py-2">{busy ? "Sending…" : "Send reply"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
