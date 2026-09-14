import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Badge, Stars } from "./ui";
import type { Venue } from "../lib/types";

/**
 * Suggests hotels / team-building grounds for a finalised training, matched to
 * the group size (and, where known, the organisation's location), with an
 * estimated cost for each. Selecting one attaches it to the engagement.
 */
export function VenueSuggestModal({
  title,
  staffCount,
  location,
  currentVenueId,
  onClose,
  onSelect,
}: {
  title: string;
  staffCount: number;
  location?: string | null;
  currentVenueId?: string | null;
  onClose: () => void;
  onSelect: (venueId: string) => Promise<void> | void;
}) {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ suggest: "true", staff: String(staffCount || 0) });
    if (location) params.set("location", location);
    api
      .get<{ venues: Venue[] }>(`/organization/venues?${params.toString()}`)
      .then((r) => setVenues(r.venues))
      .catch(() => setVenues([]));
  }, [staffCount, location]);

  async function choose(id: string) {
    setBusy(id);
    try {
      await onSelect(id);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal open onClose={onClose} title="Suggested venues">
      <p className="text-sm text-muted">
        Venues for <span className="font-semibold text-ink">“{title}”</span> · {staffCount} {staffCount === 1 ? "person" : "people"}
        {location ? <> · prioritising <span className="font-semibold text-ink">{location}</span></> : null}. Estimated cost is for a one-day session.
      </p>

      {!venues ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-line" />)}
        </div>
      ) : venues.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No venues can seat {staffCount} people right now. Try a smaller group or check the Venues section.</p>
      ) : (
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {venues.map((v) => {
            const selected = v.id === currentVenueId;
            return (
              <div key={v.id} className={`rounded-xl border p-4 ${selected ? "border-teal bg-[#F2FAF9]" : "border-line bg-white"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{v.name}</span>
                      <Badge tone="teal">{v.type}</Badge>
                      {selected && <Badge tone="green">✓ Selected</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
                      <Stars value={v.rating} /> {v.rating.toFixed(1)} · 📍 {v.location} · seats {v.capacity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-lg font-bold text-ink">{v.estimateLabel}</div>
                    <div className="text-[11.5px] text-muted">est. for {staffCount} · {v.perPersonLabel}/person</div>
                  </div>
                </div>
                {v.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="rounded-full bg-[#EDF1F1] px-2 py-0.5 text-[11px] text-muted">{a}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => choose(v.id)}
                    disabled={busy === v.id || selected}
                    className={selected ? "btn-ghost px-4 py-2 text-[13px]" : "btn-teal px-4 py-2 text-[13px]"}
                  >
                    {selected ? "Current venue" : busy === v.id ? "Selecting…" : "Select venue"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="btn-ghost">Close</button>
      </div>
    </Modal>
  );
}
