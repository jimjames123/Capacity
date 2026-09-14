import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Badge, EmptyState, Stars } from "../../components/ui";
import type { Venue } from "../../lib/types";

export default function OrgVenues() {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [location, setLocation] = useState("All");
  const [minCapacity, setMinCapacity] = useState("");

  function load() {
    api
      .get<{ venues: Venue[]; types: string[]; locations: string[] }>("/organization/venues")
      .then((r) => { setVenues(r.venues); setTypes(r.types); setLocations(r.locations); })
      .catch(() => setError("Could not load venues"));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const cap = Number(minCapacity) || 0;
    return (venues ?? []).filter((v) => {
      if (type !== "All" && v.type !== type) return false;
      if (location !== "All" && v.location !== location) return false;
      if (cap && v.capacity < cap) return false;
      if (term && ![v.name, v.type, v.location, v.address, ...v.amenities].some((f) => String(f).toLowerCase().includes(term))) return false;
      return true;
    });
  }, [venues, q, type, location, minCapacity]);

  const hasFilters = q !== "" || type !== "All" || location !== "All" || minCapacity !== "";
  function clearFilters() { setQ(""); setType("All"); setLocation("All"); setMinCapacity(""); }

  if (error) return <EmptyState title={error} />;
  if (!venues) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">Training venues</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Hotels, resorts and team-building grounds for your sessions, with indicative prices.
          When you award a tender or add a booking, Capacity Lane suggests venues that fit your group automatically.
        </p>
      </div>

      <div className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, location or amenity…" />
        <select className="field sm:w-48" value={type} onChange={(e) => setType(e.target.value)} aria-label="Venue type">
          <option value="All">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="field sm:w-40" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Location">
          <option value="All">All locations</option>
          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <input className="field sm:w-36" type="number" min={0} value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} placeholder="Min. seats" aria-label="Minimum capacity" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No venues match your search"
          hint="Try a different keyword, location or a smaller minimum capacity."
          action={hasFilters ? <button onClick={clearFilters} className="btn-ghost">Clear filters</button> : undefined}
        />
      ) : (
        <>
          <div className="text-[13px] text-muted">{filtered.length} venue{filtered.length === 1 ? "" : "s"}</div>
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((v) => <VenueCard key={v.id} v={v} />)}
          </div>
        </>
      )}

      <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">
        Ready to book a training? Head to <Link to="/org/bookings" className="font-semibold text-teal hover:underline">Bookings</Link> or award a{" "}
        <Link to="/org/tenders" className="font-semibold text-teal hover:underline">tender</Link> — we'll suggest matching venues with prices.
      </div>
    </div>
  );
}

function VenueCard({ v }: { v: Venue }) {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-serif text-lg font-semibold leading-snug text-ink">{v.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
            <Stars value={v.rating} /> {v.rating.toFixed(1)} · 📍 {v.location}
          </div>
        </div>
        <Badge tone="teal">{v.type}</Badge>
      </div>

      <div className="mt-3 text-[13px] text-muted">{v.address} · seats up to <span className="font-semibold text-ink">{v.capacity}</span></div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {v.amenities.slice(0, 5).map((a) => (
          <span key={a} className="rounded-full bg-[#EDF1F1] px-2 py-0.5 text-[11px] text-muted">{a}</span>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <div className="label-caps">Day delegate rate</div>
          <div className="mt-0.5 font-semibold text-ink">{v.perPersonLabel}<span className="text-[12px] font-normal text-muted">/person</span></div>
        </div>
        <div className="text-right">
          <div className="label-caps">Full-day hire from</div>
          <div className="mt-0.5 font-semibold text-ink">{v.dayRateLabel}</div>
        </div>
      </div>

      {v.contact && <div className="mt-3 text-[12px] text-muted">✉ {v.contact}</div>}
    </div>
  );
}
