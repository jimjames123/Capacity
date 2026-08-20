import type { CpdEntry, Cycle } from "@prisma/client";

/** Points from entries that actually count toward the cycle (verified only). */
export function verifiedPoints(entries: CpdEntry[]): number {
  return entries
    .filter((e) => e.status === "VERIFIED")
    .reduce((sum, e) => sum + e.pointsClaimed, 0);
}

export function countByStatus(entries: CpdEntry[]) {
  const base = { VERIFIED: 0, PENDING: 0, NEEDS_PROOF: 0, REJECTED: 0 };
  for (const e of entries) {
    if (e.status in base) base[e.status as keyof typeof base] += 1;
  }
  return base;
}

export function daysRemaining(cycle: Pick<Cycle, "endDate">): number {
  const ms = new Date(cycle.endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Builds the dashboard/cycle summary the client renders. */
export function buildCycleSummary(cycle: Cycle, entries: CpdEntry[]) {
  const earned = verifiedPoints(entries);
  const required = cycle.requiredPoints;
  const pct = required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;
  const counts = countByStatus(entries);
  const remaining = Math.max(0, required - earned);
  return {
    cycleId: cycle.id,
    label: cycle.label,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    requiredPoints: required,
    earnedPoints: earned,
    remainingPoints: remaining,
    percentComplete: pct,
    daysRemaining: daysRemaining(cycle),
    isCurrent: cycle.isCurrent,
    counts,
    onTrack: pct >= 100 || earned >= required * 0.5,
  };
}
