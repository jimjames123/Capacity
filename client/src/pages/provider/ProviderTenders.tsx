import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Badge, EmptyState } from "../../components/ui";
import { BID_STATUS_META, formatDate } from "../../lib/format";
import type { TenderBoardItem } from "../../lib/types";

type SortOption = "deadline-asc" | "deadline-desc" | "budget-desc" | "seats-desc";

export default function ProviderTenders() {
  const [tenders, setTenders] = useState<TenderBoardItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("ALL");
  const [districtFilter, setDistrictFilter] = useState<string>("ALL");
  const [bidStatusFilter, setBidStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("deadline-asc");

  useEffect(() => {
    api
      .get<{ tenders: TenderBoardItem[] }>("/provider/tenders")
      .then((r) => setTenders(r.tenders))
      .catch(() => setError("Could not load the tender board"));
  }, []);

  // Compute all available categories (areas of interest) with counts
  const categoryStats = useMemo(() => {
    if (!tenders) return [];
    const counts: Record<string, number> = {};
    for (const t of tenders) {
      const cat = t.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [tenders]);

  // Compute unique districts from organizations
  const districts = useMemo(() => {
    if (!tenders) return [];
    const set = new Set<string>();
    for (const t of tenders) {
      if (t.organization?.district) {
        set.add(t.organization.district);
      }
    }
    return Array.from(set).sort();
  }, [tenders]);

  // Parse budget string into numeric value for sorting
  function parseBudgetNumber(budgetStr: string): number {
    const digits = budgetStr.replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  // Filter and sort tenders
  const filteredTenders = useMemo(() => {
    if (!tenders) return [];

    const query = searchQuery.trim().toLowerCase();

    return tenders
      .filter((t) => {
        // Area of Interest filter
        if (selectedCategory !== "ALL" && (t.category || "General") !== selectedCategory) {
          return false;
        }

        // Delivery Mode filter
        if (deliveryFilter !== "ALL" && t.deliveryMode.toLowerCase() !== deliveryFilter.toLowerCase()) {
          return false;
        }

        // District filter
        if (districtFilter !== "ALL" && t.organization?.district !== districtFilter) {
          return false;
        }

        // Bid Status filter
        if (bidStatusFilter === "UNBID" && t.myBidStatus) {
          return false;
        }
        if (bidStatusFilter === "BID_ACTIVE" && !t.myBidStatus) {
          return false;
        }

        // Search Query
        if (query) {
          const haystack = [
            t.title,
            t.description,
            t.category,
            t.deliveryMode,
            t.organization?.name,
            t.organization?.district,
            t.organization?.sector,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(query)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline-asc") {
          return +new Date(a.deadline) - +new Date(b.deadline);
        }
        if (sortBy === "deadline-desc") {
          return +new Date(b.deadline) - +new Date(a.deadline);
        }
        if (sortBy === "budget-desc") {
          return parseBudgetNumber(b.budget) - parseBudgetNumber(a.budget);
        }
        if (sortBy === "seats-desc") {
          return (b.seats || 0) - (a.seats || 0);
        }
        return 0;
      });
  }, [tenders, selectedCategory, deliveryFilter, districtFilter, bidStatusFilter, searchQuery, sortBy]);

  // Check if any filter is active
  const hasActiveFilters =
    selectedCategory !== "ALL" ||
    deliveryFilter !== "ALL" ||
    districtFilter !== "ALL" ||
    bidStatusFilter !== "ALL" ||
    searchQuery.trim().length > 0;

  function resetFilters() {
    setSelectedCategory("ALL");
    setDeliveryFilter("ALL");
    setDistrictFilter("ALL");
    setBidStatusFilter("ALL");
    setSearchQuery("");
    setSortBy("deadline-asc");
  }

  // Days until deadline helper
  function getDaysUntil(deadlineStr: string): number {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (error) return <EmptyState title={error} />;
  if (!tenders) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Tender board</h1>
          <p className="mt-2 text-muted">
            Open training tenders from organisations. Filter by your area of interest and submit competitive bids.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-muted shadow-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-green" />
            <span><strong className="text-ink">{tenders.length}</strong> open tender{tenders.length === 1 ? "" : "s"}</span>
          </div>
          <Link to="/provider/bids" className="btn-ghost text-xs">
            My submitted bids →
          </Link>
        </div>
      </div>

      {/* Primary Area of Interest Filter Selector */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">
            Filter by Area of Interest
          </div>
          {selectedCategory !== "ALL" && (
            <button
              onClick={() => setSelectedCategory("ALL")}
              className="text-xs font-semibold text-teal hover:underline"
            >
              Show all areas
            </button>
          )}
        </div>

        {/* Category button strip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
              selectedCategory === "ALL"
                ? "bg-teal text-white shadow-sm ring-1 ring-teal-dark"
                : "border border-line bg-surface text-muted hover:border-line-strong hover:bg-white hover:text-ink"
            }`}
          >
            <span>All Areas</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-semibold ${
                selectedCategory === "ALL" ? "bg-white/20 text-white" : "bg-line/60 text-muted"
              }`}
            >
              {tenders.length}
            </span>
          </button>

          {categoryStats.map(({ name, count }) => {
            const isSelected = selectedCategory === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedCategory(name)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-teal text-white shadow-sm ring-1 ring-teal-dark"
                    : "border border-line bg-surface text-muted hover:border-line-strong hover:bg-white hover:text-ink"
                }`}
              >
                <span>{name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-semibold ${
                    isSelected ? "bg-white/20 text-white" : "bg-line/60 text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Secondary Filter Toolbar */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <input
            type="text"
            className="field pl-9 pr-8"
            placeholder="Search keywords, skills, organisation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted hover:bg-surface hover:text-ink"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Delivery mode */}
        <div>
          <select
            className="field"
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
          >
            <option value="ALL">All Delivery Modes</option>
            <option value="In-person">In-person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* District / Location */}
        <div>
          <select
            className="field"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="ALL">All Locations</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Sort option */}
        <div>
          <select
            className="field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="deadline-asc">Closing soonest</option>
            <option value="deadline-desc">Closing latest</option>
            <option value="budget-desc">Highest budget</option>
            <option value="seats-desc">Most participants</option>
          </select>
        </div>
      </div>

      {/* Active filters indicators & quick summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Showing <strong className="text-ink">{filteredTenders.length}</strong> of {tenders.length} tender{tenders.length === 1 ? "" : "s"}
          </span>

          {hasActiveFilters && (
            <>
              <span className="text-line-strong">|</span>
              <span className="font-semibold text-ink">Active filters:</span>

              {selectedCategory !== "ALL" && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-[11.5px] text-ink shadow-xs">
                  Area: <strong>{selectedCategory}</strong>
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className="ml-0.5 text-muted hover:text-rust"
                  >
                    ×
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-[11.5px] text-ink shadow-xs">
                  Keyword: <strong>"{searchQuery}"</strong>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-0.5 text-muted hover:text-rust"
                  >
                    ×
                  </button>
                </span>
              )}

              {deliveryFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-[11.5px] text-ink shadow-xs">
                  Mode: <strong>{deliveryFilter}</strong>
                  <button
                    onClick={() => setDeliveryFilter("ALL")}
                    className="ml-0.5 text-muted hover:text-rust"
                  >
                    ×
                  </button>
                </span>
              )}

              {districtFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-[11.5px] text-ink shadow-xs">
                  District: <strong>{districtFilter}</strong>
                  <button
                    onClick={() => setDistrictFilter("ALL")}
                    className="ml-0.5 text-muted hover:text-rust"
                  >
                    ×
                  </button>
                </span>
              )}

              {bidStatusFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-[11.5px] text-ink shadow-xs">
                  Status: <strong>{bidStatusFilter === "UNBID" ? "Unbid" : "My bids"}</strong>
                  <button
                    onClick={() => setBidStatusFilter("ALL")}
                    className="ml-0.5 text-muted hover:text-rust"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-teal underline hover:text-teal-dark font-medium"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>

        {/* Bid Status quick toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1 text-xs">
          <button
            type="button"
            onClick={() => setBidStatusFilter("ALL")}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              bidStatusFilter === "ALL"
                ? "bg-surface text-ink font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setBidStatusFilter("UNBID")}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              bidStatusFilter === "UNBID"
                ? "bg-surface text-ink font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            Not yet bid
          </button>
          <button
            type="button"
            onClick={() => setBidStatusFilter("BID_ACTIVE")}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              bidStatusFilter === "BID_ACTIVE"
                ? "bg-surface text-ink font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            My bids
          </button>
        </div>
      </div>

      {/* Tenders Listing */}
      {tenders.length === 0 ? (
        <EmptyState
          title="No open tenders right now"
          hint="Check back soon — new tenders posted by organisations will appear here."
        />
      ) : filteredTenders.length === 0 ? (
        <EmptyState
          title="No tenders match your selected filters"
          hint={
            selectedCategory !== "ALL"
              ? `There are currently no open tenders in "${selectedCategory}" matching your criteria.`
              : "Try adjusting your search keywords, location or delivery mode filters."
          }
          action={
            <button
              onClick={resetFilters}
              className="btn-primary"
            >
              Reset filters & view all {tenders.length} tenders
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredTenders.map((t) => {
            const daysLeft = getDaysUntil(t.deadline);
            const isClosingSoon = daysLeft > 0 && daysLeft <= 14;

            return (
              <Link
                key={t.id}
                to={`/provider/tenders/${t.id}`}
                className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-lg font-semibold text-ink">
                        {t.title}
                      </span>
                      {t.myBidStatus && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            BID_STATUS_META[t.myBidStatus]?.className ?? "bg-surface text-muted"
                          }`}
                        >
                          Your bid: {BID_STATUS_META[t.myBidStatus]?.label ?? t.myBidStatus}
                        </span>
                      )}
                      {isClosingSoon && (
                        <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-[11px] font-semibold text-amber border border-amber-line">
                          Closing in {daysLeft} day{daysLeft === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                      <span className="font-medium text-ink">{t.organization.name}</span>
                      {t.organization.district && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{t.organization.district}</span>
                        </>
                      )}
                      {t.organization.sector && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{t.organization.sector}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-muted">
                      {t.description}
                    </p>
                  </div>
                  <Badge tone="teal">{t.category}</Badge>
                </div>

                {/* Metadata footer row */}
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3 text-[13px] text-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted">Budget:</span>
                    <span className="font-semibold text-ink">{t.budget}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-muted">Mode:</span>
                    <span className="font-medium text-ink">{t.deliveryMode}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-muted">Seats:</span>
                    <span className="font-medium text-ink">{t.seats} delegates</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-muted">Deadline:</span>
                    <span className="font-medium text-ink">{formatDate(t.deadline)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-muted">Bids:</span>
                    <span className="font-medium text-ink">{t.bidCount} submitted</span>
                  </div>

                  <span className="ml-auto font-semibold text-teal hover:underline">
                    {t.myBidStatus ? "View / edit bid →" : "Submit a bid →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
