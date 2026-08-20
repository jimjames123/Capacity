import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { ENTRY_TYPE_OPTIONS } from "../lib/format";
import type { EntryType } from "../lib/types";

export default function LogActivity() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EntryType>("COURSE");
  const [activityDate, setActivityDate] = useState(today());
  const [points, setPoints] = useState("2");
  const [proofName, setProofName] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/cpd/entries", {
        title,
        type,
        activityDate,
        pointsClaimed: Number(points),
        proofFileName: proofName ?? undefined,
        note: note || undefined,
      });
      navigate("/app/history");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/app" className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-bold text-ink">Log a CPD activity</h1>
      <p className="mt-2 text-muted">
        Entries are submitted to your professional body for verification before
        they count toward your cycle.
      </p>

      <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
        <div>
          <label className="field-label">Activity title</label>
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Strategic Workforce Planning workshop"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="field-label">Activity type</label>
            <select
              className="field"
              value={type}
              onChange={(e) => setType(e.target.value as EntryType)}
            >
              {ENTRY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              className="field"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">Points claimed</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className="field"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="field-label">Proof of completion</label>
          <ProofUpload fileName={proofName} onPick={setProofName} />
          <p className="mt-1.5 text-[12.5px] text-muted">
            {proofName
              ? "Attached — your entry will go straight to pending review."
              : "Without proof, your entry is saved as “needs proof”. You can add it later."}
          </p>
        </div>

        <div>
          <label className="field-label">Note <span className="font-normal text-muted">(optional)</span></label>
          <textarea
            className="field min-h-[80px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the verifier should know."
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rust-line bg-rust-soft px-3.5 py-2.5 text-sm text-rust">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Submitting…" : "Submit for verification"}
          </button>
          <Link to="/app" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

/**
 * Simulated proof upload — this build has no file storage, so we capture the
 * chosen file's name to mark the entry as having proof attached.
 */
function ProofUpload({
  fileName,
  onPick,
}: {
  fileName: string | null;
  onPick: (name: string | null) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-line-strong bg-panel px-4 py-4 transition hover:border-teal">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#EDF1F1] text-lg">📎</span>
        <div>
          <div className="text-sm font-semibold text-ink">
            {fileName ?? "Attach a certificate or evidence"}
          </div>
          <div className="text-[12px] text-muted">PDF, JPG or PNG · up to 10 MB</div>
        </div>
      </div>
      {fileName ? (
        <span
          className="text-[13px] font-semibold text-rust"
          onClick={(e) => { e.preventDefault(); onPick(null); }}
        >
          Remove
        </span>
      ) : (
        <span className="text-[13px] font-semibold text-teal">Browse</span>
      )}
      <input
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => onPick(e.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
